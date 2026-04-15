/**
 * Phase 2 / Chunk 3 — Consequence Engine Core.
 *
 * Deterministic, trigger-bound consequence records:
 * - no prose generation
 * - no free-floating consequence creation
 * - explicit channel separation between canonical and reader-bond domains
 */
import type { Prisma } from "@prisma/client";

import type { DyadicRelationshipEventInput } from "@/lib/domain/dyadic-relationship";
import {
  CONSEQUENCE_ENGINE_CONTRACT_VERSION,
  type ConsequenceCategory,
  type ConsequenceEngineChannel,
  type ConsequenceEngineOutputSurface,
  type ConsequenceEngineState,
  type ConsequenceFutureConstraintSignal,
  type ConsequenceMemorySalienceModifier,
  type ConsequencePressureModifier,
  type ConsequencePropagationTarget,
  type ConsequenceRecord,
  type ConsequenceSeverity,
  type ConsequenceTriggerReference,
} from "@/lib/domain/consequence-engine";
import { prisma } from "@/lib/prisma";
import { getOrCreateCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

const CANONICAL_STORAGE_KEY = "consequenceEngineV1";
const READER_BOND_STORAGE_KEY = "dyadicConsequenceEngineV1";
const MAX_CONSEQUENCE_RECORDS = 40;

function asRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function requireObservedTriggerAnchor(trigger: ConsequenceTriggerReference): void {
  if (!trigger.observedEventId.trim()) {
    throw new Error("[consequence-engine] observedEventId is required.");
  }
  if (!trigger.occurredAtIso.trim()) {
    throw new Error("[consequence-engine] occurredAtIso is required.");
  }
}

function normalizeSeverity(input: 1 | 2 | 3 | undefined): ConsequenceSeverity {
  if (input === 3) return "high";
  if (input === 2) return "moderate";
  return "low";
}

function categoryFromEvent(eventType: DyadicRelationshipEventInput["eventType"]): ConsequenceCategory {
  switch (eventType) {
    case "betrayal":
    case "duty_broken":
      return "relational";
    case "violence":
      return "bodily";
    case "public_disapproval":
      return "reputational";
    case "humiliation":
      return "social";
    case "neglect":
      return "emotional";
    case "protection":
    case "support":
    case "comfort":
    case "sacrifice":
    case "confession":
    case "secrecy":
    case "duty_fulfilled":
      return "relational";
  }
}

function lifecycleFromEvent(eventType: DyadicRelationshipEventInput["eventType"]): ConsequenceRecord["lifecycleState"] {
  if (eventType === "secrecy") return "latent";
  return "active";
}

function durationFromEvent(eventType: DyadicRelationshipEventInput["eventType"]): ConsequenceRecord["duration"] {
  if (eventType === "betrayal" || eventType === "violence" || eventType === "duty_broken") return "long";
  if (eventType === "public_disapproval" || eventType === "humiliation") return "medium";
  return "short";
}

function reversibilityFromEvent(
  eventType: DyadicRelationshipEventInput["eventType"]
): ConsequenceRecord["reversibility"] {
  if (eventType === "violence") return "partially_reversible";
  if (eventType === "betrayal" || eventType === "duty_broken") return "partially_reversible";
  return "reversible";
}

function visibilityFromEvent(eventType: DyadicRelationshipEventInput["eventType"]): ConsequenceRecord["visibility"] {
  if (eventType === "public_disapproval" || eventType === "humiliation") return "scene_public";
  return "private_dyadic";
}

function propagationTargetsFromEvent(input: {
  eventType: DyadicRelationshipEventInput["eventType"];
  severity: ConsequenceSeverity;
  linkedRelationshipIds?: string[];
}): ConsequencePropagationTarget[] {
  const scale = input.severity === "high" ? 3 : input.severity === "moderate" ? 2 : 1;
  const out: ConsequencePropagationTarget[] = [];
  if (input.eventType === "public_disapproval" || input.eventType === "humiliation") {
    out.push({
      targetKind: "social_risk_pressure",
      targetRef: null,
      modifier: 4 * scale,
    });
  }
  if (input.eventType === "violence") {
    out.push({
      targetKind: "household_economic_pressure",
      targetRef: null,
      modifier: 3 * scale,
    });
  }
  if (input.eventType === "betrayal") {
    for (const relId of input.linkedRelationshipIds ?? []) {
      out.push({
        targetKind: "linked_relationships",
        targetRef: relId,
        modifier: 2 * scale,
      });
    }
  }
  return out;
}

function buildConsequenceRecord(params: {
  channel: ConsequenceEngineChannel;
  trigger: ConsequenceTriggerReference;
  event: DyadicRelationshipEventInput;
  affectedEntityIds: string[];
  priorCount: number;
  linkedRelationshipIds?: string[];
}): ConsequenceRecord {
  const severity = normalizeSeverity(params.event.intensity);
  return {
    consequenceId: `${params.channel}::${params.trigger.observedEventId}::${params.priorCount + 1}`,
    channel: params.channel,
    trigger: params.trigger,
    affectedEntityIds: params.affectedEntityIds,
    category: categoryFromEvent(params.event.eventType),
    severity,
    visibility: visibilityFromEvent(params.event.eventType),
    immediacy: "immediate",
    duration: durationFromEvent(params.event.eventType),
    lifecycleState: lifecycleFromEvent(params.event.eventType),
    reversibility: reversibilityFromEvent(params.event.eventType),
    propagationTargets: propagationTargetsFromEvent({
      eventType: params.event.eventType,
      severity,
      linkedRelationshipIds: params.linkedRelationshipIds,
    }),
    explanation: {
      ruleCode: `event_${params.event.eventType}_to_consequence_v1`,
      reasonCodes: [
        `category_${categoryFromEvent(params.event.eventType)}`,
        `lifecycle_${lifecycleFromEvent(params.event.eventType)}`,
      ],
    },
    createdAtIso: params.trigger.occurredAtIso,
    updatedAtIso: params.trigger.occurredAtIso,
  };
}

function decodeConsequenceRecord(raw: unknown): ConsequenceRecord | null {
  const record = asRecord(raw);
  const consequenceId = typeof record.consequenceId === "string" ? record.consequenceId : null;
  const channel = record.channel === "canonical_dyad" || record.channel === "reader_bond_dyad" ? record.channel : null;
  const trigger = asRecord(record.trigger);
  const sourceKind =
    trigger.sourceKind === "relationship_event" || trigger.sourceKind === "interaction_event" || trigger.sourceKind === "scene_event"
      ? trigger.sourceKind
      : null;
  const observedEventId = typeof trigger.observedEventId === "string" ? trigger.observedEventId : null;
  const sourceEventType = typeof trigger.sourceEventType === "string" ? trigger.sourceEventType : null;
  const occurredAtIso = typeof trigger.occurredAtIso === "string" ? trigger.occurredAtIso : null;
  const category = typeof record.category === "string" ? record.category : null;
  const severity = record.severity === "low" || record.severity === "moderate" || record.severity === "high" ? record.severity : null;
  const visibility =
    record.visibility === "private_dyadic" ||
    record.visibility === "scene_public" ||
    record.visibility === "household_public" ||
    record.visibility === "community_public"
      ? record.visibility
      : null;
  const immediacy = record.immediacy === "immediate" || record.immediacy === "delayed" ? record.immediacy : null;
  const duration =
    record.duration === "short" || record.duration === "medium" || record.duration === "long" || record.duration === "indefinite"
      ? record.duration
      : null;
  const lifecycleState =
    record.lifecycleState === "active" ||
    record.lifecycleState === "latent" ||
    record.lifecycleState === "decaying" ||
    record.lifecycleState === "resolved" ||
    record.lifecycleState === "transformed"
      ? record.lifecycleState
      : null;
  const reversibility =
    record.reversibility === "reversible" ||
    record.reversibility === "partially_reversible" ||
    record.reversibility === "irreversible"
      ? record.reversibility
      : null;
  const affectedEntityIds = Array.isArray(record.affectedEntityIds)
    ? record.affectedEntityIds.filter((id): id is string => typeof id === "string")
    : [];
  const propagationTargets = Array.isArray(record.propagationTargets)
    ? record.propagationTargets
        .map((targetRaw) => {
          const target = asRecord(targetRaw);
          if (
            target.targetKind === "relationship_axes" ||
            target.targetKind === "social_risk_pressure" ||
            target.targetKind === "household_economic_pressure" ||
            target.targetKind === "linked_relationships"
          ) {
            return {
              targetKind: target.targetKind,
              targetRef: typeof target.targetRef === "string" ? target.targetRef : null,
              modifier: typeof target.modifier === "number" ? target.modifier : 0,
            } satisfies ConsequencePropagationTarget;
          }
          return null;
        })
        .filter((t): t is ConsequencePropagationTarget => t != null)
    : [];
  const explanationRecord = asRecord(record.explanation);
  const explanation = {
    ruleCode:
      typeof explanationRecord.ruleCode === "string"
        ? explanationRecord.ruleCode
        : "event_unknown_to_consequence_v1",
    reasonCodes: Array.isArray(explanationRecord.reasonCodes)
      ? explanationRecord.reasonCodes.filter((code): code is string => typeof code === "string")
      : [],
  };
  const createdAtIso = typeof record.createdAtIso === "string" ? record.createdAtIso : occurredAtIso;
  const updatedAtIso = typeof record.updatedAtIso === "string" ? record.updatedAtIso : occurredAtIso;
  if (
    !consequenceId ||
    !channel ||
    !sourceKind ||
    !observedEventId ||
    !sourceEventType ||
    !occurredAtIso ||
    !category ||
    !severity ||
    !visibility ||
    !immediacy ||
    !duration ||
    !lifecycleState ||
    !reversibility ||
    !createdAtIso ||
    !updatedAtIso
  ) {
    return null;
  }
  return {
    consequenceId,
    channel,
    trigger: {
      sourceKind,
      observedEventId,
      sourceEventType: sourceEventType as ConsequenceTriggerReference["sourceEventType"],
      occurredAtIso,
      relationshipId: typeof trigger.relationshipId === "string" ? trigger.relationshipId : null,
      sceneId: typeof trigger.sceneId === "string" ? trigger.sceneId : null,
      sessionId: typeof trigger.sessionId === "string" ? trigger.sessionId : null,
      turnId: typeof trigger.turnId === "string" ? trigger.turnId : null,
      worldStateId: typeof trigger.worldStateId === "string" ? trigger.worldStateId : null,
    },
    affectedEntityIds,
    category: category as ConsequenceCategory,
    severity,
    visibility,
    immediacy,
    duration,
    lifecycleState,
    reversibility,
    propagationTargets,
    explanation,
    createdAtIso,
    updatedAtIso,
  };
}

function decodeConsequenceState(raw: unknown): ConsequenceEngineState | null {
  const record = asRecord(raw);
  const contractVersion =
    record.contractVersion === CONSEQUENCE_ENGINE_CONTRACT_VERSION ? record.contractVersion : null;
  const channel = record.channel === "canonical_dyad" || record.channel === "reader_bond_dyad" ? record.channel : null;
  const updatedAtIso = typeof record.updatedAtIso === "string" ? record.updatedAtIso : null;
  const records = Array.isArray(record.records)
    ? record.records
        .map(decodeConsequenceRecord)
        .filter((entry): entry is ConsequenceRecord => entry != null)
        .slice(-MAX_CONSEQUENCE_RECORDS)
    : [];
  if (!contractVersion || !channel || !updatedAtIso) return null;
  return {
    contractVersion,
    channel,
    records,
    updatedAtIso,
  };
}

function defaultConsequenceState(channel: ConsequenceEngineChannel, updatedAtIso: string): ConsequenceEngineState {
  return {
    contractVersion: CONSEQUENCE_ENGINE_CONTRACT_VERSION,
    channel,
    records: [],
    updatedAtIso,
  };
}

function mergeCanonicalSummaryWithConsequenceState(input: {
  generatedDynamicSummary: string | null;
  state: ConsequenceEngineState;
}): string {
  const root = (() => {
    if (!input.generatedDynamicSummary) return {};
    try {
      return asRecord(JSON.parse(input.generatedDynamicSummary));
    } catch {
      return {};
    }
  })();
  const merged = { ...root, [CANONICAL_STORAGE_KEY]: input.state };
  return JSON.stringify(merged);
}

function mergeReaderNotesWithConsequenceState(input: {
  relationshipNotes: Prisma.JsonValue | null;
  state: ConsequenceEngineState;
}): Prisma.InputJsonValue {
  const root = asRecord(input.relationshipNotes);
  return {
    ...root,
    [READER_BOND_STORAGE_KEY]: input.state,
  } as Prisma.InputJsonValue;
}

function decodeCanonicalConsequenceState(generatedDynamicSummary: string | null): ConsequenceEngineState | null {
  if (!generatedDynamicSummary) return null;
  try {
    const parsed = asRecord(JSON.parse(generatedDynamicSummary));
    return decodeConsequenceState(parsed[CANONICAL_STORAGE_KEY]);
  } catch {
    return null;
  }
}

function decodeReaderConsequenceState(relationshipNotes: Prisma.JsonValue | null): ConsequenceEngineState | null {
  const root = asRecord(relationshipNotes);
  return decodeConsequenceState(root[READER_BOND_STORAGE_KEY]);
}

function ensureCanonicalTriggerBoundary(event: DyadicRelationshipEventInput): void {
  const source = event.sourcePlane ?? "canonical_truth";
  const target = event.targetPlane ?? "canonical_truth";
  if (source !== "canonical_truth" || target !== "canonical_truth") {
    throw new Error("[consequence-engine] canonical consequence flow requires canonical_truth source/target.");
  }
  assertMemoryBoundary({
    source,
    target,
    payload: { channel: "canonical_dyad", eventType: event.eventType },
  });
}

function ensureReaderTriggerBoundary(event: DyadicRelationshipEventInput): void {
  const source = event.sourcePlane ?? "reader_interaction_memory";
  const target = event.targetPlane ?? "reader_interaction_memory";
  if (source !== "reader_interaction_memory" || target !== "reader_interaction_memory") {
    throw new Error(
      "[consequence-engine] reader-bond consequence flow requires reader_interaction_memory source/target."
    );
  }
  assertMemoryBoundary({
    source,
    target,
    payload: { channel: "reader_bond_dyad", eventType: event.eventType },
  });
}

function updateConsequenceState(params: {
  priorState: ConsequenceEngineState | null;
  channel: ConsequenceEngineChannel;
  trigger: ConsequenceTriggerReference;
  event: DyadicRelationshipEventInput;
  affectedEntityIds: string[];
  linkedRelationshipIds?: string[];
}): {
  state: ConsequenceEngineState;
  record: ConsequenceRecord;
} {
  requireObservedTriggerAnchor(params.trigger);
  const base = params.priorState ?? defaultConsequenceState(params.channel, params.trigger.occurredAtIso);
  const record = buildConsequenceRecord({
    channel: params.channel,
    trigger: params.trigger,
    event: params.event,
    affectedEntityIds: params.affectedEntityIds,
    priorCount: base.records.length,
    linkedRelationshipIds: params.linkedRelationshipIds,
  });
  return {
    record,
    state: {
      contractVersion: CONSEQUENCE_ENGINE_CONTRACT_VERSION,
      channel: params.channel,
      records: [...base.records, record].slice(-MAX_CONSEQUENCE_RECORDS),
      updatedAtIso: record.updatedAtIso,
    },
  };
}

export function buildConsequenceOutputSurface(state: ConsequenceEngineState): ConsequenceEngineOutputSurface {
  const active = state.records.filter((record) => record.lifecycleState === "active" || record.lifecycleState === "latent");
  const pressureMap = new Map<ConsequencePressureModifier["target"], number>();
  const memorySalience: ConsequenceMemorySalienceModifier[] = [];
  const futureSignals: ConsequenceFutureConstraintSignal[] = [];

  for (const record of active) {
    for (const target of record.propagationTargets) {
      if (
        target.targetKind === "social_risk_pressure" ||
        target.targetKind === "household_economic_pressure" ||
        target.targetKind === "relationship_axes"
      ) {
        const key = target.targetKind;
        pressureMap.set(key, (pressureMap.get(key) ?? 0) + target.modifier);
      }
    }
    const salience =
      record.severity === "high" ? 90 : record.severity === "moderate" ? 65 : 40;
    memorySalience.push({
      consequenceId: record.consequenceId,
      salienceWeight: salience,
    });
    if (record.category === "reputational" || record.category === "social") {
      futureSignals.push({
        signalCode: "avoid_public_exposure",
        severity: record.severity,
        sourceConsequenceId: record.consequenceId,
      });
    }
    if (record.category === "household_economic" || record.propagationTargets.some((t) => t.targetKind === "household_economic_pressure")) {
      futureSignals.push({
        signalCode: "elevated_household_burden",
        severity: record.severity,
        sourceConsequenceId: record.consequenceId,
      });
    }
    if (record.category === "relational" && record.trigger.sourceEventType === "betrayal") {
      futureSignals.push({
        signalCode: "trust_repair_needed",
        severity: record.severity,
        sourceConsequenceId: record.consequenceId,
      });
    }
    if (record.category === "bodily") {
      futureSignals.push({
        signalCode: "bodily_caution",
        severity: record.severity,
        sourceConsequenceId: record.consequenceId,
      });
    }
  }

  return {
    activeConsequenceSummary: active.map((record) => ({
      consequenceId: record.consequenceId,
      category: record.category,
      severity: record.severity,
      lifecycleState: record.lifecycleState,
      triggerEventType: record.trigger.sourceEventType,
    })),
    relationshipPressureModifiers: [...pressureMap.entries()].map(([target, totalModifier]) => ({
      target,
      totalModifier,
    })),
    memorySalienceModifiers: memorySalience,
    futureConstraintSignals: futureSignals,
  };
}

export async function applyCanonicalConsequenceFromObservedEvent(input: {
  relationshipId: string;
  event: DyadicRelationshipEventInput;
  trigger: ConsequenceTriggerReference;
  affectedEntityIds: string[];
  linkedRelationshipIds?: string[];
}): Promise<{
  state: ConsequenceEngineState;
  output: ConsequenceEngineOutputSurface;
  record: ConsequenceRecord;
}> {
  const relationshipId = input.relationshipId.trim();
  if (!relationshipId) {
    throw new Error("[consequence-engine] relationshipId is required.");
  }
  requireObservedTriggerAnchor(input.trigger);
  ensureCanonicalTriggerBoundary(input.event);
  const row = await prisma.characterRelationship.findUnique({
    where: { id: relationshipId },
    select: {
      id: true,
      generatedDynamicSummary: true,
    },
  });
  if (!row) {
    throw new Error(`[consequence-engine] CharacterRelationship not found: ${relationshipId}`);
  }
  const priorState = decodeCanonicalConsequenceState(row.generatedDynamicSummary);
  const updated = updateConsequenceState({
    priorState,
    channel: "canonical_dyad",
    trigger: {
      ...input.trigger,
      relationshipId: relationshipId,
    },
    event: input.event,
    affectedEntityIds: input.affectedEntityIds,
    linkedRelationshipIds: input.linkedRelationshipIds,
  });
  await prisma.characterRelationship.update({
    where: { id: relationshipId },
    data: {
      generatedDynamicSummary: mergeCanonicalSummaryWithConsequenceState({
        generatedDynamicSummary: row.generatedDynamicSummary,
        state: updated.state,
      }),
    },
  });
  return {
    state: updated.state,
    output: buildConsequenceOutputSurface(updated.state),
    record: updated.record,
  };
}

export async function applyReaderBondConsequenceFromObservedEvent(input: {
  characterId: string;
  readerId: string;
  event: DyadicRelationshipEventInput;
  trigger: ConsequenceTriggerReference;
  affectedEntityIds: string[];
  linkedRelationshipIds?: string[];
}): Promise<{
  state: ConsequenceEngineState;
  output: ConsequenceEngineOutputSurface;
  record: ConsequenceRecord;
}> {
  const characterId = input.characterId.trim();
  const readerId = input.readerId.trim();
  if (!characterId || !readerId) {
    throw new Error("[consequence-engine] characterId and readerId are required.");
  }
  requireObservedTriggerAnchor(input.trigger);
  ensureReaderTriggerBoundary(input.event);
  const memory = await getOrCreateCharacterReaderMemory(characterId, readerId);
  const priorState = decodeReaderConsequenceState(memory.relationshipNotes);
  const updated = updateConsequenceState({
    priorState,
    channel: "reader_bond_dyad",
    trigger: {
      ...input.trigger,
    },
    event: input.event,
    affectedEntityIds: input.affectedEntityIds,
    linkedRelationshipIds: input.linkedRelationshipIds,
  });
  await prisma.characterReaderMemory.update({
    where: { id: memory.id },
    data: {
      relationshipNotes: mergeReaderNotesWithConsequenceState({
        relationshipNotes: memory.relationshipNotes,
        state: updated.state,
      }),
    },
  });
  return {
    state: updated.state,
    output: buildConsequenceOutputSurface(updated.state),
    record: updated.record,
  };
}
