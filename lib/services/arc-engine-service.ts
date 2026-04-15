/**
 * Phase 3 / Chunk 1 — Arc Engine Core.
 *
 * Deterministic structural arc state updates only:
 * - no prose generation
 * - no chapter progression
 * - no branch governance
 * - no UI concerns
 */
import {
  ARC_LIFECYCLE_STATES,
  ARC_RESOLUTION_MODES,
  ARC_SCOPES,
  ARC_TYPES,
  NARRATIVE_ARC_CONTRACT_VERSION,
  type ArcLifecycleState,
  type ArcResolutionMode,
  type ArcScope,
  type ArcType,
  type NarrativeArcAnchorEntity,
  type NarrativeArcConditionSet,
  type NarrativeArcEvidenceSnapshot,
  type NarrativeArcExplanationSummary,
  type NarrativeArcState,
  type NarrativeArcUpdateResult,
} from "@/lib/domain/narrative-arc";
import { assertMemoryBoundary, type NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function assertKnownArcType(value: string): asserts value is ArcType {
  if (!(ARC_TYPES as readonly string[]).includes(value)) {
    throw new Error(`[arc-engine] unsupported arc type: ${value}`);
  }
}

function assertKnownArcScope(value: string): asserts value is ArcScope {
  if (!(ARC_SCOPES as readonly string[]).includes(value)) {
    throw new Error(`[arc-engine] unsupported arc scope: ${value}`);
  }
}

function assertKnownLifecycleState(value: string): asserts value is ArcLifecycleState {
  if (!(ARC_LIFECYCLE_STATES as readonly string[]).includes(value)) {
    throw new Error(`[arc-engine] unsupported lifecycle state: ${value}`);
  }
}

function normalizeResolutionModes(modes: ArcResolutionMode[] | undefined): ArcResolutionMode[] {
  const input = modes?.filter((mode): mode is ArcResolutionMode => (ARC_RESOLUTION_MODES as readonly string[]).includes(mode)) ?? [];
  const deduped = [...new Set(input)];
  return deduped.length > 0 ? deduped : ["reconciliation", "survival_compromise"];
}

function defaultConditionSet(overrides?: Partial<NarrativeArcConditionSet>): NarrativeArcConditionSet {
  return {
    activation: {
      minObservedEvents: overrides?.activation?.minObservedEvents ?? 1,
      minStructuralScore: overrides?.activation?.minStructuralScore ?? 30,
    },
    progression: {
      minProgressionScore: overrides?.progression?.minProgressionScore ?? 40,
      minTensionForEscalation: overrides?.progression?.minTensionForEscalation ?? 35,
      escalationThreshold: overrides?.progression?.escalationThreshold ?? 58,
      crisisThreshold: overrides?.progression?.crisisThreshold ?? 78,
      turningThreshold: overrides?.progression?.turningThreshold ?? 62,
    },
    stall: {
      stallPressureThreshold: overrides?.stall?.stallPressureThreshold ?? 62,
    },
    failure: {
      failurePressureThreshold: overrides?.failure?.failurePressureThreshold ?? 80,
    },
    resolution: {
      minResolutionScore: overrides?.resolution?.minResolutionScore ?? 68,
      transformThreshold: overrides?.resolution?.transformThreshold ?? 72,
    },
  };
}

function normalizeEvidence(input: Partial<NarrativeArcEvidenceSnapshot>): NarrativeArcEvidenceSnapshot {
  return {
    observedEvents: clampNonNegativeInt(input.observedEvents ?? 0),
    activeConsequences: clampNonNegativeInt(input.activeConsequences ?? 0),
    relationshipShift: clamp0to100(input.relationshipShift ?? 0),
    memoryActivationPressure: clamp0to100(input.memoryActivationPressure ?? 0),
    temporalPressure: clamp0to100(input.temporalPressure ?? 0),
    worldStatePressure: clamp0to100(input.worldStatePressure ?? 0),
    storylineMomentum: clamp0to100(input.storylineMomentum ?? 0),
  };
}

function structuralLegitimacySources(e: NarrativeArcEvidenceSnapshot): number {
  let count = 0;
  if (e.observedEvents > 0) count += 1;
  if (e.activeConsequences > 0) count += 1;
  if (e.relationshipShift > 0) count += 1;
  if (e.memoryActivationPressure > 0) count += 1;
  if (e.temporalPressure > 0) count += 1;
  if (e.worldStatePressure > 0) count += 1;
  if (e.storylineMomentum > 0) count += 1;
  return count;
}

function structuralScore(e: NarrativeArcEvidenceSnapshot): number {
  const observed = Math.min(36, e.observedEvents * 12);
  const consequences = Math.min(25, e.activeConsequences * 10);
  const relationship = e.relationshipShift * 0.15;
  const memory = e.memoryActivationPressure * 0.12;
  const temporal = e.temporalPressure * 0.12;
  const world = e.worldStatePressure * 0.12;
  const continuity = e.storylineMomentum * 0.13;
  return clamp0to100(observed + consequences + relationship + memory + temporal + world + continuity);
}

function escalationPressure(e: NarrativeArcEvidenceSnapshot, score: number): number {
  return clamp0to100(score * 0.45 + e.activeConsequences * 7 + e.worldStatePressure * 0.2 + e.relationshipShift * 0.2);
}

function resolutionPressure(e: NarrativeArcEvidenceSnapshot): number {
  return clamp0to100(
    e.storylineMomentum * 0.45 +
      e.memoryActivationPressure * 0.25 +
      (100 - e.worldStatePressure) * 0.2 +
      (100 - e.relationshipShift) * 0.1
  );
}

function failurePressure(e: NarrativeArcEvidenceSnapshot): number {
  return clamp0to100(e.activeConsequences * 8 + e.worldStatePressure * 0.4 + (100 - e.storylineMomentum) * 0.25);
}

function stallPressure(e: NarrativeArcEvidenceSnapshot, score: number): number {
  return clamp0to100((100 - score) * 0.55 + (100 - e.temporalPressure) * 0.2 + (100 - e.storylineMomentum) * 0.25);
}

function determineNextLifecycle(input: {
  current: ArcLifecycleState;
  shouldActivate: boolean;
  shouldProgress: boolean;
  shouldEscalate: boolean;
  shouldCrisis: boolean;
  shouldTurn: boolean;
  shouldResolve: boolean;
  shouldFail: boolean;
  shouldTransform: boolean;
}): ArcLifecycleState {
  const c = input.current;
  if (c === "transformed") return "transformed";
  if (c === "failed") return "failed";
  if (input.shouldFail) return "failed";

  switch (c) {
    case "dormant":
      return input.shouldActivate ? "seeded" : "dormant";
    case "seeded":
      if (input.shouldProgress) return "active";
      return "seeded";
    case "active":
      if (input.shouldCrisis) return "crisis";
      if (input.shouldEscalate) return "escalating";
      if (input.shouldResolve) return "resolving";
      return "active";
    case "escalating":
      if (input.shouldCrisis) return "crisis";
      if (input.shouldResolve) return "resolving";
      return "escalating";
    case "crisis":
      if (input.shouldTurn) return "turning";
      if (input.shouldResolve) return "resolving";
      return "crisis";
    case "turning":
      if (input.shouldResolve) return "resolving";
      return "turning";
    case "resolving":
      return input.shouldResolve ? "resolved" : "resolving";
    case "resolved":
      return input.shouldTransform ? "transformed" : "resolved";
    default:
      return c;
  }
}

function computeDelta(input: {
  previousState: ArcLifecycleState;
  nextState: ArcLifecycleState;
  shouldProgress: boolean;
  shouldEscalate: boolean;
  shouldCrisis: boolean;
  shouldResolve: boolean;
  shouldFail: boolean;
  shouldStall: boolean;
}): { tensionDelta: number; intensityDelta: number } {
  if (input.shouldFail) return { tensionDelta: 18, intensityDelta: 18 };
  if (input.shouldCrisis) return { tensionDelta: 12, intensityDelta: 10 };
  if (input.shouldEscalate) return { tensionDelta: 8, intensityDelta: 6 };
  if (input.shouldResolve) {
    if (input.nextState === "resolved" || input.nextState === "transformed") {
      return { tensionDelta: -16, intensityDelta: -14 };
    }
    return { tensionDelta: -9, intensityDelta: -7 };
  }
  if (input.shouldStall) return { tensionDelta: 2, intensityDelta: 1 };
  if (input.shouldProgress) {
    if (input.previousState === "dormant" && input.nextState === "seeded") return { tensionDelta: 4, intensityDelta: 3 };
    if (input.previousState === "seeded" && input.nextState === "active") return { tensionDelta: 6, intensityDelta: 5 };
    return { tensionDelta: 4, intensityDelta: 3 };
  }
  return { tensionDelta: 0, intensityDelta: 0 };
}

function reasonCodes(input: {
  structuralLegitimacy: number;
  structuralScore: number;
  escalationPressure: number;
  resolutionPressure: number;
  stallPressure: number;
  failurePressure: number;
  previousState: ArcLifecycleState;
  nextState: ArcLifecycleState;
  modeUsed: ArcResolutionMode | null;
}): string[] {
  const out: string[] = [];
  out.push(`from_${input.previousState}`);
  out.push(`to_${input.nextState}`);
  if (input.structuralLegitimacy > 0) out.push("structural_legitimacy_present");
  if (input.structuralScore >= 30) out.push("structural_score_sufficient");
  if (input.escalationPressure >= 58) out.push("escalation_pressure_high");
  if (input.resolutionPressure >= 68) out.push("resolution_pressure_high");
  if (input.stallPressure >= 62) out.push("stall_pressure_high");
  if (input.failurePressure >= 80) out.push("failure_pressure_high");
  if (input.modeUsed) out.push(`resolution_mode_${input.modeUsed}`);
  return out;
}

function defaultExplanation(sourcePlane: NarrativeMemoryPlane, targetPlane: NarrativeMemoryPlane): NarrativeArcExplanationSummary {
  return {
    summaryCode: "arc_initialized",
    reasonCodes: ["initial_state"],
    structuralLegitimacySources: 0,
    structuralScore: 0,
    escalationPressure: 0,
    resolutionPressure: 0,
    stallPressure: 0,
    failurePressure: 0,
    sourcePlane,
    targetPlane,
  };
}

export function createNarrativeArc(input: {
  arcId: string;
  arcType: ArcType | string;
  arcScope: ArcScope | string;
  anchorEntities: NarrativeArcAnchorEntity[];
  lifecycleState?: ArcLifecycleState | string;
  tensionLevel?: number;
  intensityLevel?: number;
  conditions?: Partial<NarrativeArcConditionSet>;
  resolutionModes?: ArcResolutionMode[];
  createdAtIso: string;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): NarrativeArcState {
  const arcId = input.arcId.trim();
  if (!arcId) throw new Error("[arc-engine] arcId is required.");
  if (input.anchorEntities.length === 0) throw new Error("[arc-engine] at least one arc anchor entity is required.");

  assertKnownArcType(input.arcType);
  assertKnownArcScope(input.arcScope);
  const lifecycle = input.lifecycleState ?? "dormant";
  assertKnownLifecycleState(lifecycle);

  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "canonical_truth";
  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      arcType: input.arcType,
      arcScope: input.arcScope,
    },
  });

  return {
    contractVersion: NARRATIVE_ARC_CONTRACT_VERSION,
    arcId,
    arcType: input.arcType,
    arcScope: input.arcScope,
    anchorEntities: input.anchorEntities.map((entity) => ({
      anchorKind: entity.anchorKind,
      anchorId: entity.anchorId.trim(),
    })),
    lifecycleState: lifecycle,
    tensionLevel: clamp0to100(input.tensionLevel ?? 20),
    intensityLevel: clamp0to100(input.intensityLevel ?? 20),
    activationConditions: defaultConditionSet(input.conditions).activation,
    progressionConditions: defaultConditionSet(input.conditions).progression,
    stallConditions: defaultConditionSet(input.conditions).stall,
    failureConditions: defaultConditionSet(input.conditions).failure,
    resolutionConditions: defaultConditionSet(input.conditions).resolution,
    resolutionModes: normalizeResolutionModes(input.resolutionModes),
    lastUpdateAtIso: input.createdAtIso,
    lastExplanation: defaultExplanation(sourcePlane, targetPlane),
  };
}

export function applyNarrativeArcUpdate(input: {
  arc: NarrativeArcState;
  evidence: Partial<NarrativeArcEvidenceSnapshot>;
  observedAtIso: string;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): NarrativeArcUpdateResult {
  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "canonical_truth";
  const e = normalizeEvidence(input.evidence);

  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      observedEvents: e.observedEvents,
      activeConsequences: e.activeConsequences,
      relationshipShift: e.relationshipShift,
      memoryActivationPressure: e.memoryActivationPressure,
      temporalPressure: e.temporalPressure,
      worldStatePressure: e.worldStatePressure,
      storylineMomentum: e.storylineMomentum,
    },
  });

  const legitimacy = structuralLegitimacySources(e);
  const score = structuralScore(e);
  const escalation = escalationPressure(e, score);
  const resolution = resolutionPressure(e);
  const failure = failurePressure(e);
  const stall = stallPressure(e, score);

  const hasLegitimacy = legitimacy > 0;
  const shouldActivate =
    hasLegitimacy &&
    e.observedEvents >= input.arc.activationConditions.minObservedEvents &&
    score >= input.arc.activationConditions.minStructuralScore;
  const shouldProgress = hasLegitimacy && score >= input.arc.progressionConditions.minProgressionScore;
  const shouldEscalate = hasLegitimacy && escalation >= input.arc.progressionConditions.escalationThreshold;
  const shouldCrisis =
    hasLegitimacy &&
    escalation >= input.arc.progressionConditions.crisisThreshold &&
    input.arc.tensionLevel >= input.arc.progressionConditions.minTensionForEscalation;
  const shouldTurn =
    hasLegitimacy &&
    input.arc.lifecycleState === "crisis" &&
    resolution >= input.arc.progressionConditions.turningThreshold;
  const shouldResolve = hasLegitimacy && resolution >= input.arc.resolutionConditions.minResolutionScore;
  const shouldFail = hasLegitimacy && failure >= input.arc.failureConditions.failurePressureThreshold;
  const shouldTransform =
    hasLegitimacy &&
    input.arc.lifecycleState === "resolved" &&
    (e.worldStatePressure >= input.arc.resolutionConditions.transformThreshold ||
      e.storylineMomentum >= input.arc.resolutionConditions.transformThreshold);
  const shouldStall =
    hasLegitimacy && !shouldProgress && stall >= input.arc.stallConditions.stallPressureThreshold;

  const next = determineNextLifecycle({
    current: input.arc.lifecycleState,
    shouldActivate,
    shouldProgress,
    shouldEscalate,
    shouldCrisis,
    shouldTurn,
    shouldResolve,
    shouldFail,
    shouldTransform,
  });

  const delta = computeDelta({
    previousState: input.arc.lifecycleState,
    nextState: next,
    shouldProgress: shouldActivate || shouldProgress,
    shouldEscalate,
    shouldCrisis,
    shouldResolve,
    shouldFail,
    shouldStall,
  });

  const selectedMode = next === "resolved" || next === "transformed" ? input.arc.resolutionModes[0] ?? null : null;
  const explanation: NarrativeArcExplanationSummary = {
    summaryCode: `arc_transition_${input.arc.lifecycleState}_to_${next}`,
    reasonCodes: reasonCodes({
      structuralLegitimacy: legitimacy,
      structuralScore: score,
      escalationPressure: escalation,
      resolutionPressure: resolution,
      stallPressure: stall,
      failurePressure: failure,
      previousState: input.arc.lifecycleState,
      nextState: next,
      modeUsed: selectedMode,
    }),
    structuralLegitimacySources: legitimacy,
    structuralScore: score,
    escalationPressure: escalation,
    resolutionPressure: resolution,
    stallPressure: stall,
    failurePressure: failure,
    sourcePlane,
    targetPlane,
  };

  const updatedArc: NarrativeArcState = {
    ...input.arc,
    lifecycleState: next,
    tensionLevel: clamp0to100(input.arc.tensionLevel + delta.tensionDelta),
    intensityLevel: clamp0to100(input.arc.intensityLevel + delta.intensityDelta),
    lastUpdateAtIso: input.observedAtIso,
    lastExplanation: explanation,
  };

  return {
    updatedArc,
    tensionDelta: delta.tensionDelta,
    intensityDelta: delta.intensityDelta,
    signals: {
      progressed: next !== input.arc.lifecycleState && next !== "failed",
      stalled: shouldStall && next === input.arc.lifecycleState,
      failed: next === "failed",
      resolved: next === "resolved",
      transformed: next === "transformed",
    },
    explanation,
  };
}
