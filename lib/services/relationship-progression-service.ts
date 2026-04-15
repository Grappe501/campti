/**
 * Phase 2 / Chunk 2 — Relationship progression + reader bonding (durable, bounded).
 *
 * Durability strategy (minimal):
 * - canonical person-person progression: stored in `CharacterRelationship.generatedDynamicSummary` JSON string
 * - reader-character bond progression: stored in `CharacterReaderMemory.relationshipNotes` JSON object field
 */
import type { Prisma } from "@prisma/client";

import {
  defaultDyadicRelationshipAxes,
  normalizeDyadicParticipants,
  type DyadicRelationshipAxes,
  type DyadicRelationshipEventInput,
  type DyadicRelationshipType,
} from "@/lib/domain/dyadic-relationship";
import {
  RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
  defaultRelationshipProgressionSnapshot,
  type RelationshipAttachmentPressure,
  type RelationshipProgressionChannel,
  type RelationshipProgressionEnvelope,
  type RelationshipProgressionEventRecord,
  type RelationshipProgressionExplanation,
  type RelationshipProgressionSignals,
  type RelationshipProgressionSnapshot,
  type RelationshipProgressionTrend,
  type RelationshipReconciliationAvailability,
  type RelationshipRuptureRisk,
  type RelationshipDisclosureLikelihoodShift,
} from "@/lib/domain/relationship-progression";
import { prisma } from "@/lib/prisma";
import { getOrCreateCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import {
  applyDyadicRelationshipEvent,
  createDyadicRelationshipState,
  deriveDyadicRelationshipPosture,
} from "@/lib/services/dyadic-relationship-engine-service";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

const RELATIONSHIP_NOTES_PROGRESS_KEY = "dyadicRelationshipProgressionV1";
const MAX_RECENT_RELATIONSHIP_EVENTS = 12;

function asRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function coerceIntensity(value: unknown): 1 | 2 | 3 | null {
  if (value === 1 || value === 2 || value === 3) return value;
  return null;
}

function coerceDirection(value: unknown): "symmetric" | "participant_a_to_b" | "participant_b_to_a" | null {
  if (value === "symmetric" || value === "participant_a_to_b" || value === "participant_b_to_a") return value;
  return null;
}

function decodeEventRecord(raw: unknown): RelationshipProgressionEventRecord | null {
  const record = asRecord(raw);
  const intensity = coerceIntensity(record.intensity);
  const direction = coerceDirection(record.direction);
  const eventType = typeof record.eventType === "string" ? record.eventType : null;
  const occurredAtIso = typeof record.occurredAtIso === "string" ? record.occurredAtIso : null;
  if (!eventType || !intensity || !direction || !occurredAtIso) return null;
  return {
    eventType: eventType as RelationshipProgressionEventRecord["eventType"],
    intensity,
    direction,
    occurredAtIso,
  };
}

function decodeSignals(raw: unknown): RelationshipProgressionSignals | null {
  const record = asRecord(raw);
  const trend = record.trend;
  const ruptureRisk = record.ruptureRisk;
  const disclosureLikelihoodShift = record.disclosureLikelihoodShift;
  const attachmentPressure = record.attachmentPressure;
  const reconciliationAvailability = record.reconciliationAvailability;
  if (
    (trend === "warming" || trend === "cooling" || trend === "unstable" || trend === "flat") &&
    (ruptureRisk === "low" || ruptureRisk === "elevated" || ruptureRisk === "high") &&
    (disclosureLikelihoodShift === "decreasing" ||
      disclosureLikelihoodShift === "steady" ||
      disclosureLikelihoodShift === "increasing") &&
    (attachmentPressure === "low" || attachmentPressure === "moderate" || attachmentPressure === "high") &&
    (reconciliationAvailability === "open" ||
      reconciliationAvailability === "guarded" ||
      reconciliationAvailability === "closed")
  ) {
    return {
      trend,
      ruptureRisk,
      disclosureLikelihoodShift,
      attachmentPressure,
      reconciliationAvailability,
    };
  }
  return null;
}

function decodeSnapshot(raw: unknown): RelationshipProgressionSnapshot | null {
  const record = asRecord(raw);
  const contractVersion =
    record.contractVersion === RELATIONSHIP_PROGRESSION_CONTRACT_VERSION ? record.contractVersion : null;
  const channel =
    record.channel === "canonical_dyad" || record.channel === "reader_bond_dyad" ? record.channel : null;
  const relationshipId = typeof record.relationshipId === "string" ? record.relationshipId : null;
  const participantAId = typeof record.participantAId === "string" ? record.participantAId : null;
  const participantBId = typeof record.participantBId === "string" ? record.participantBId : null;
  const relationshipType = typeof record.relationshipType === "string" ? record.relationshipType : null;
  const posture = typeof record.posture === "string" ? record.posture : null;
  const eventCount = typeof record.eventCount === "number" && Number.isFinite(record.eventCount) ? record.eventCount : null;
  const lastEvent = decodeEventRecord(record.lastEvent);
  const signals = decodeSignals(record.signals);
  const updatedAtIso = typeof record.updatedAtIso === "string" ? record.updatedAtIso : null;
  const axesRecord = asRecord(record.axes);
  const axes: DyadicRelationshipAxes = {
    trust: typeof axesRecord.trust === "number" ? axesRecord.trust : 50,
    affection: typeof axesRecord.affection === "number" ? axesRecord.affection : 50,
    fear: typeof axesRecord.fear === "number" ? axesRecord.fear : 50,
    duty: typeof axesRecord.duty === "number" ? axesRecord.duty : 50,
    resentment: typeof axesRecord.resentment === "number" ? axesRecord.resentment : 50,
    dependence: typeof axesRecord.dependence === "number" ? axesRecord.dependence : 50,
    admiration: typeof axesRecord.admiration === "number" ? axesRecord.admiration : 50,
    shameExposure: typeof axesRecord.shameExposure === "number" ? axesRecord.shameExposure : 50,
    socialRisk: typeof axesRecord.socialRisk === "number" ? axesRecord.socialRisk : 50,
    stability: typeof axesRecord.stability === "number" ? axesRecord.stability : 50,
  };
  if (
    !contractVersion ||
    !channel ||
    !relationshipId ||
    !participantAId ||
    !participantBId ||
    !relationshipType ||
    !signals ||
    !updatedAtIso ||
    eventCount == null
  ) {
    return null;
  }
  const normalizedPosture = deriveDyadicRelationshipPosture(axes).posture;
  return {
    contractVersion,
    channel,
    relationshipId,
    participantAId,
    participantBId,
    relationshipType: relationshipType as DyadicRelationshipType,
    axes,
    posture: posture ? (posture as RelationshipProgressionSnapshot["posture"]) : normalizedPosture,
    eventCount: Math.max(0, Math.floor(eventCount)),
    lastEvent,
    signals,
    updatedAtIso,
  };
}

function decodeEnvelope(raw: unknown): RelationshipProgressionEnvelope | null {
  const record = asRecord(raw);
  const snapshot = decodeSnapshot(record.snapshot);
  if (!snapshot) return null;
  const recentRaw = Array.isArray(record.recentEvents) ? record.recentEvents : [];
  const recentEvents = recentRaw
    .map(decodeEventRecord)
    .filter((ev): ev is RelationshipProgressionEventRecord => ev != null)
    .slice(-MAX_RECENT_RELATIONSHIP_EVENTS);
  return {
    contractVersion: RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
    snapshot,
    recentEvents,
  };
}

function trendFromDelta(prior: DyadicRelationshipAxes, next: DyadicRelationshipAxes): RelationshipProgressionTrend {
  const bondScore = next.trust + next.affection + next.stability;
  const priorBond = prior.trust + prior.affection + prior.stability;
  const strainScore = next.resentment + next.fear + next.socialRisk;
  const priorStrain = prior.resentment + prior.fear + prior.socialRisk;
  if (Math.abs(bondScore - priorBond) <= 3 && Math.abs(strainScore - priorStrain) <= 3) return "flat";
  if (strainScore - priorStrain >= 8 || next.stability <= 32) return "unstable";
  if (bondScore > priorBond && strainScore <= priorStrain + 2) return "warming";
  if (bondScore < priorBond || strainScore > priorStrain) return "cooling";
  return "flat";
}

function ruptureRiskFromAxes(axes: DyadicRelationshipAxes): RelationshipRuptureRisk {
  if (axes.resentment >= 72 || (axes.fear >= 68 && axes.stability <= 35)) return "high";
  if (axes.resentment >= 52 || axes.stability <= 48 || axes.socialRisk >= 62) return "elevated";
  return "low";
}

function disclosureShiftFromAxes(
  prior: DyadicRelationshipAxes,
  next: DyadicRelationshipAxes
): RelationshipDisclosureLikelihoodShift {
  const priorScore = prior.trust - prior.shameExposure - prior.fear;
  const nextScore = next.trust - next.shameExposure - next.fear;
  if (nextScore - priorScore >= 6) return "increasing";
  if (priorScore - nextScore >= 6) return "decreasing";
  return "steady";
}

function attachmentPressureFromAxes(axes: DyadicRelationshipAxes): RelationshipAttachmentPressure {
  const pressure = axes.dependence + axes.fear + axes.socialRisk;
  if (pressure >= 200) return "high";
  if (pressure >= 145) return "moderate";
  return "low";
}

function reconciliationFromAxes(axes: DyadicRelationshipAxes): RelationshipReconciliationAvailability {
  if (axes.resentment >= 70 && axes.trust <= 35) return "closed";
  if (axes.trust >= 62 || (axes.duty >= 58 && axes.resentment <= 55)) return "open";
  return "guarded";
}

export function deriveRelationshipProgressionSignals(input: {
  priorAxes: DyadicRelationshipAxes;
  nextAxes: DyadicRelationshipAxes;
}): RelationshipProgressionSignals {
  return {
    trend: trendFromDelta(input.priorAxes, input.nextAxes),
    ruptureRisk: ruptureRiskFromAxes(input.nextAxes),
    disclosureLikelihoodShift: disclosureShiftFromAxes(input.priorAxes, input.nextAxes),
    attachmentPressure: attachmentPressureFromAxes(input.nextAxes),
    reconciliationAvailability: reconciliationFromAxes(input.nextAxes),
  };
}

function appendRecentEvent(
  prior: RelationshipProgressionEventRecord[],
  event: RelationshipProgressionEventRecord
): RelationshipProgressionEventRecord[] {
  return [...prior, event].slice(-MAX_RECENT_RELATIONSHIP_EVENTS);
}

function mapCharacterRelationshipType(rawType: string): DyadicRelationshipType {
  const normalized = rawType.trim().toLowerCase();
  if (normalized.includes("spouse")) return "spouse";
  if (normalized.includes("court") || normalized.includes("promise")) return "promised_courtship";
  if (normalized.includes("parent") || normalized.includes("child")) return "parent_child";
  if (normalized.includes("sibling") || normalized.includes("brother") || normalized.includes("sister")) return "siblings";
  if (normalized.includes("elder") || normalized.includes("younger")) return "elder_younger";
  if (normalized.includes("rival")) return "rival";
  if (normalized.includes("authority") || normalized.includes("subject")) return "authority_subject";
  return "ally";
}

function assertCanonicalChannelBoundary(event: DyadicRelationshipEventInput): void {
  const source = event.sourcePlane ?? "canonical_truth";
  const target = event.targetPlane ?? "canonical_truth";
  if (source !== "canonical_truth" || target !== "canonical_truth") {
    throw new Error(
      "[relationship-progression] Canonical relationship progression requires canonical_truth source/target planes."
    );
  }
  assertMemoryBoundary({
    source,
    target,
    payload: { channel: "canonical_dyad", eventType: event.eventType },
  });
}

function assertReaderBondChannelBoundary(event: DyadicRelationshipEventInput): void {
  const source = event.sourcePlane ?? "reader_interaction_memory";
  const target = event.targetPlane ?? "reader_interaction_memory";
  if (source !== "reader_interaction_memory" || target !== "reader_interaction_memory") {
    throw new Error(
      "[relationship-progression] Reader bond progression requires reader_interaction_memory source/target planes."
    );
  }
  assertMemoryBoundary({
    source,
    target,
    payload: { channel: "reader_bond_dyad", eventType: event.eventType },
  });
}

function applyProgressionFromEvent(params: {
  channel: RelationshipProgressionChannel;
  priorEnvelope: RelationshipProgressionEnvelope | null;
  priorState: ReturnType<typeof createDyadicRelationshipState>;
  event: DyadicRelationshipEventInput;
}): {
  envelope: RelationshipProgressionEnvelope;
  explanation: RelationshipProgressionExplanation;
} {
  const priorSnapshot = params.priorEnvelope?.snapshot ?? defaultRelationshipProgressionSnapshot({
    channel: params.channel,
    relationshipId: params.priorState.relationshipId,
    participantAId: params.priorState.participantAId,
    participantBId: params.priorState.participantBId,
    relationshipType: params.priorState.relationshipType,
    state: params.priorState,
  });
  const update = applyDyadicRelationshipEvent({
    prior: {
      ...params.priorState,
      axes: priorSnapshot.axes,
      posture: priorSnapshot.posture,
      updatedAtIso: priorSnapshot.updatedAtIso,
    },
    event: params.event,
  });
  const nextSignals = deriveRelationshipProgressionSignals({
    priorAxes: priorSnapshot.axes,
    nextAxes: update.state.axes,
  });
  const eventRecord: RelationshipProgressionEventRecord = {
    eventType: update.explanation.eventType,
    intensity: update.explanation.intensity,
    direction: update.explanation.direction,
    occurredAtIso: update.state.updatedAtIso,
  };
  const envelope: RelationshipProgressionEnvelope = {
    contractVersion: RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
    snapshot: {
      ...priorSnapshot,
      axes: update.state.axes,
      posture: update.state.posture,
      eventCount: priorSnapshot.eventCount + 1,
      lastEvent: eventRecord,
      signals: nextSignals,
      updatedAtIso: update.state.updatedAtIso,
    },
    recentEvents: appendRecentEvent(params.priorEnvelope?.recentEvents ?? [], eventRecord),
  };
  return {
    envelope,
    explanation: {
      channel: params.channel,
      priorAxes: priorSnapshot.axes,
      nextAxes: update.state.axes,
      axisDelta: update.explanation.axisDelta,
      priorPosture: priorSnapshot.posture,
      nextPosture: update.state.posture ?? deriveDyadicRelationshipPosture(update.state.axes).posture,
      postureReasonCodes: update.explanation.postureTransition.reasonCodes,
      signalTransition: {
        prior: priorSnapshot.signals,
        next: nextSignals,
      },
    },
  };
}

export function decodeCanonicalRelationshipProgressionEnvelope(
  generatedDynamicSummary: string | null
): RelationshipProgressionEnvelope | null {
  if (!generatedDynamicSummary) return null;
  try {
    const parsed = JSON.parse(generatedDynamicSummary) as unknown;
    const decoded = decodeEnvelope(parsed);
    if (decoded?.snapshot.channel !== "canonical_dyad") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function decodeReaderBondRelationshipProgressionEnvelope(
  relationshipNotes: Prisma.JsonValue | null
): RelationshipProgressionEnvelope | null {
  const root = asRecord(relationshipNotes);
  const raw = root[RELATIONSHIP_NOTES_PROGRESS_KEY];
  const decoded = decodeEnvelope(raw);
  if (decoded?.snapshot.channel !== "reader_bond_dyad") return null;
  return decoded;
}

export function mergeReaderNotesWithProgressionEnvelope(input: {
  relationshipNotes: Prisma.JsonValue | null;
  envelope: RelationshipProgressionEnvelope;
}): Prisma.InputJsonValue {
  const root = asRecord(input.relationshipNotes);
  return {
    ...root,
    [RELATIONSHIP_NOTES_PROGRESS_KEY]: input.envelope,
  } as Prisma.InputJsonValue;
}

export async function applyCanonicalRelationshipObservedEvent(input: {
  relationshipId: string;
  event: DyadicRelationshipEventInput;
}): Promise<{
  snapshot: RelationshipProgressionSnapshot;
  explanation: RelationshipProgressionExplanation;
}> {
  const relationshipId = input.relationshipId.trim();
  if (!relationshipId) {
    throw new Error("[relationship-progression] relationshipId is required.");
  }
  assertCanonicalChannelBoundary(input.event);
  const row = await prisma.characterRelationship.findUnique({
    where: { id: relationshipId },
    select: {
      id: true,
      personAId: true,
      personBId: true,
      relationshipType: true,
      generatedDynamicSummary: true,
    },
  });
  if (!row) {
    throw new Error(`[relationship-progression] CharacterRelationship not found: ${relationshipId}`);
  }
  const participants = normalizeDyadicParticipants({
    participantAId: row.personAId,
    participantBId: row.personBId,
  });
  const priorState = createDyadicRelationshipState({
    relationshipId: row.id,
    participantAId: participants.participantAId,
    participantBId: participants.participantBId,
    relationshipType: mapCharacterRelationshipType(row.relationshipType),
    origin: "seeded_canonical",
    axes: defaultDyadicRelationshipAxes(),
  });
  const priorEnvelope = decodeCanonicalRelationshipProgressionEnvelope(row.generatedDynamicSummary);
  const applied = applyProgressionFromEvent({
    channel: "canonical_dyad",
    priorEnvelope,
    priorState,
    event: input.event,
  });
  await prisma.characterRelationship.update({
    where: { id: relationshipId },
    data: {
      generatedDynamicSummary: JSON.stringify(applied.envelope),
    },
  });
  return {
    snapshot: applied.envelope.snapshot,
    explanation: applied.explanation,
  };
}

export async function applyReaderBondObservedEvent(input: {
  characterId: string;
  readerId: string;
  event: DyadicRelationshipEventInput;
}): Promise<{
  snapshot: RelationshipProgressionSnapshot;
  explanation: RelationshipProgressionExplanation;
}> {
  const characterId = input.characterId.trim();
  const readerId = input.readerId.trim();
  if (!characterId || !readerId) {
    throw new Error("[relationship-progression] characterId and readerId are required.");
  }
  assertReaderBondChannelBoundary(input.event);
  const memory = await getOrCreateCharacterReaderMemory(characterId, readerId);
  const participants = normalizeDyadicParticipants({
    participantAId: characterId,
    participantBId: readerId,
  });
  const priorState = createDyadicRelationshipState({
    relationshipId: `${participants.participantAId}::${participants.participantBId}::reader_bond`,
    participantAId: participants.participantAId,
    participantBId: participants.participantBId,
    relationshipType: "reader_bond",
    origin: "observed_interaction",
    axes: defaultDyadicRelationshipAxes(),
  });
  const priorEnvelope = decodeReaderBondRelationshipProgressionEnvelope(memory.relationshipNotes);
  const applied = applyProgressionFromEvent({
    channel: "reader_bond_dyad",
    priorEnvelope,
    priorState,
    event: input.event,
  });
  await prisma.characterReaderMemory.update({
    where: { id: memory.id },
    data: {
      relationshipNotes: mergeReaderNotesWithProgressionEnvelope({
        relationshipNotes: memory.relationshipNotes,
        envelope: applied.envelope,
      }),
    },
  });
  return {
    snapshot: applied.envelope.snapshot,
    explanation: applied.explanation,
  };
}
