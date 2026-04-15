/**
 * Phase 3 / Chunk 2 — Chapter / Movement Progression (deterministic, bounded).
 *
 * Scope:
 * - chapter/movement progression state
 * - entry/completion condition evaluation
 * - transition readiness + blockers
 * - bounded output surfaces for downstream scene systems
 *
 * Out of scope:
 * - branch governance
 * - narrative pressure engine
 * - UI rendering
 * - prose generation
 */
import {
  CHAPTER_FUNCTIONS,
  CHAPTER_MOVEMENT_PROGRESSION_CONTRACT_VERSION,
  type ChapterFunction,
  type ChapterMovementCompletionConditions,
  type ChapterMovementEntryConditions,
  type ChapterMovementProgressionInput,
  type ChapterMovementProgressionOutputSurface,
  type ChapterMovementProgressionResult,
  type ChapterMovementProgressionState,
  type ChapterMovementTransitionReadiness,
  type ChapterMovementUnresolvedCarryover,
  type ScenePressureRecommendation,
} from "@/lib/domain/chapter-movement-progression";
import { assertMemoryBoundary, type NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function uniqueNonEmpty(values: string[]): string[] {
  const out = values.map((v) => v.trim()).filter((v) => v.length > 0);
  return [...new Set(out)];
}

function assertKnownChapterFunction(value: string): asserts value is ChapterFunction {
  if (!(CHAPTER_FUNCTIONS as readonly string[]).includes(value)) {
    throw new Error(`[chapter-movement-progression] unsupported chapter function: ${value}`);
  }
}

function defaultEntryConditions(chapterFunction: ChapterFunction): ChapterMovementEntryConditions {
  switch (chapterFunction) {
    case "setup":
      return { minActiveArcs: 1, maxHighSeverityConsequences: 3 };
    case "fracture":
    case "reversal":
    case "loss":
      return { minActiveArcs: 2, maxHighSeverityConsequences: 4 };
    case "threshold":
    case "recommitment":
      return { minActiveArcs: 2, maxHighSeverityConsequences: 3 };
    default:
      return { minActiveArcs: 1, maxHighSeverityConsequences: 3 };
  }
}

function defaultCompletionConditions(chapterFunction: ChapterFunction): ChapterMovementCompletionConditions {
  switch (chapterFunction) {
    case "setup":
      return { minProgressedArcs: 1, minResolvedArcs: 0, maxUnresolvedQuestions: 5 };
    case "convergence":
    case "revelation":
      return { minProgressedArcs: 2, minResolvedArcs: 1, maxUnresolvedQuestions: 4 };
    case "aftermath":
      return { minProgressedArcs: 1, minResolvedArcs: 1, maxUnresolvedQuestions: 4 };
    case "threshold":
    case "recommitment":
      return { minProgressedArcs: 2, minResolvedArcs: 1, maxUnresolvedQuestions: 3 };
    default:
      return { minProgressedArcs: 1, minResolvedArcs: 0, maxUnresolvedQuestions: 4 };
  }
}

function normalizeCarryovers(
  unresolvedQuestions: string[],
  prior: ChapterMovementUnresolvedCarryover[] | undefined
): ChapterMovementUnresolvedCarryover[] {
  const priorCarryovers = prior ?? [];
  const openQuestionCarryovers = uniqueNonEmpty(unresolvedQuestions).map((question, idx) => ({
    carryoverId: `question-${idx + 1}`,
    category: "open_question" as const,
    severity: "moderate" as const,
  }));
  const dedupedById = new Map<string, ChapterMovementUnresolvedCarryover>();
  for (const carryover of [...priorCarryovers, ...openQuestionCarryovers]) {
    dedupedById.set(carryover.carryoverId, carryover);
  }
  return [...dedupedById.values()];
}

function computeReadinessMetrics(input: ChapterMovementProgressionInput): {
  activeArcCount: number;
  progressedArcCount: number;
  resolvedArcCount: number;
  highSeverityConsequenceCount: number;
  unresolvedQuestionCount: number;
} {
  const activeArcCount = input.activeArcs.filter((arc) =>
    ["seeded", "active", "escalating", "crisis", "turning", "resolving"].includes(arc.lifecycleState)
  ).length;

  const progressedArcCount = input.activeArcs.filter((arc) =>
    ["active", "escalating", "crisis", "turning", "resolving", "resolved", "transformed"].includes(arc.lifecycleState)
  ).length;

  const resolvedArcCount = input.activeArcs.filter((arc) => ["resolved", "transformed"].includes(arc.lifecycleState)).length;

  const highSeverityConsequenceCount = input.consequences.filter(
    (consequence) =>
      consequence.severity === "high" && ["active", "latent", "decaying"].includes(consequence.lifecycleState)
  ).length;

  return {
    activeArcCount,
    progressedArcCount,
    resolvedArcCount,
    highSeverityConsequenceCount,
    unresolvedQuestionCount: uniqueNonEmpty(input.unresolvedQuestions).length,
  };
}

function computeBlockers(input: {
  metrics: ReturnType<typeof computeReadinessMetrics>;
  entry: ChapterMovementEntryConditions;
  completion: ChapterMovementCompletionConditions;
  relationshipThresholds: ChapterMovementProgressionInput["relationshipThresholds"];
}): string[] {
  const blockers: string[] = [];
  if (input.metrics.activeArcCount < input.entry.minActiveArcs) blockers.push("insufficient_active_arcs");
  if (input.metrics.highSeverityConsequenceCount > input.entry.maxHighSeverityConsequences) {
    blockers.push("high_severity_consequence_overload");
  }
  if (input.metrics.progressedArcCount < input.completion.minProgressedArcs) blockers.push("insufficient_progressed_arcs");
  if (input.metrics.resolvedArcCount < input.completion.minResolvedArcs) blockers.push("insufficient_resolved_arcs");
  if (input.metrics.unresolvedQuestionCount > input.completion.maxUnresolvedQuestions) blockers.push("too_many_unresolved_questions");
  if (input.relationshipThresholds.ruptureRiskHigh && !input.relationshipThresholds.reconciliationOpen) {
    blockers.push("relationship_rupture_without_reconciliation_path");
  }
  if (input.relationshipThresholds.trustFloorBreached) blockers.push("trust_floor_breached");
  return blockers;
}

function computeReadinessScore(input: {
  metrics: ReturnType<typeof computeReadinessMetrics>;
  blockers: string[];
}): number {
  const base =
    Math.min(35, input.metrics.activeArcCount * 12) +
    Math.min(30, input.metrics.progressedArcCount * 10) +
    Math.min(20, input.metrics.resolvedArcCount * 10) +
    Math.max(0, 15 - input.metrics.unresolvedQuestionCount * 3);
  const blockerPenalty = input.blockers.length * 8;
  return clamp0to100(base - blockerPenalty);
}

function deriveRecommendedScenePressureTypes(input: {
  blockers: string[];
  relationshipThresholds: ChapterMovementProgressionInput["relationshipThresholds"];
  unresolvedQuestionCount: number;
}): ScenePressureRecommendation[] {
  const out = new Set<ScenePressureRecommendation>();
  if (input.blockers.includes("insufficient_progressed_arcs")) out.add("temporal_urgency");
  if (input.blockers.includes("high_severity_consequence_overload")) out.add("resource_strain");
  if (
    input.blockers.includes("relationship_rupture_without_reconciliation_path") ||
    input.relationshipThresholds.trustFloorBreached
  ) {
    out.add("relational_tension");
  }
  if (input.unresolvedQuestionCount > 0) out.add("moral_conflict");
  if (input.blockers.includes("too_many_unresolved_questions")) out.add("social_visibility");
  return [...out];
}

function progressionStateFromSignals(input: {
  priorState: ChapterMovementProgressionState | null;
  entrySatisfied: boolean;
  completionSatisfied: boolean;
  readinessScore: number;
  blockers: string[];
}): ChapterMovementProgressionState["progressionState"] {
  if (input.priorState?.progressionState === "completed") return "completed";
  if (!input.entrySatisfied && input.priorState == null) return "not_started";
  if (!input.entrySatisfied && input.priorState != null) return "blocked";
  if (input.completionSatisfied) return "ready_to_transition";
  if (input.readinessScore < 45 || input.blockers.includes("relationship_rupture_without_reconciliation_path")) {
    return "stalled";
  }
  return "in_progress";
}

export function createChapterMovementProgressionState(input: {
  chapterId: string;
  movementId: string;
  orderIndex: number;
  chapterFunction: ChapterFunction | string;
  createdAtIso: string;
  entryConditions?: Partial<ChapterMovementEntryConditions>;
  completionConditions?: Partial<ChapterMovementCompletionConditions>;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): ChapterMovementProgressionState {
  const chapterId = input.chapterId.trim();
  const movementId = input.movementId.trim();
  if (!chapterId) throw new Error("[chapter-movement-progression] chapterId is required.");
  if (!movementId) throw new Error("[chapter-movement-progression] movementId is required.");
  assertKnownChapterFunction(input.chapterFunction);

  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "canonical_truth";
  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      chapterId,
      movementId,
      chapterFunction: input.chapterFunction,
    },
  });

  const defaultEntry = defaultEntryConditions(input.chapterFunction);
  const defaultCompletion = defaultCompletionConditions(input.chapterFunction);

  return {
    contractVersion: CHAPTER_MOVEMENT_PROGRESSION_CONTRACT_VERSION,
    chapterId,
    movementId,
    orderIndex: clampNonNegativeInt(input.orderIndex),
    chapterFunction: input.chapterFunction,
    progressionState: "not_started",
    entryConditions: {
      minActiveArcs: input.entryConditions?.minActiveArcs ?? defaultEntry.minActiveArcs,
      maxHighSeverityConsequences:
        input.entryConditions?.maxHighSeverityConsequences ?? defaultEntry.maxHighSeverityConsequences,
    },
    completionConditions: {
      minProgressedArcs: input.completionConditions?.minProgressedArcs ?? defaultCompletion.minProgressedArcs,
      minResolvedArcs: input.completionConditions?.minResolvedArcs ?? defaultCompletion.minResolvedArcs,
      maxUnresolvedQuestions: input.completionConditions?.maxUnresolvedQuestions ?? defaultCompletion.maxUnresolvedQuestions,
    },
    unresolvedCarryovers: [],
    transitionReadiness: {
      readinessScore: 0,
      eligibleForNextMovement: false,
      blockers: ["not_evaluated"],
    },
    lastEvaluatedAtIso: input.createdAtIso,
    explanation: {
      summaryCode: "chapter_movement_initialized",
      reasonCodes: ["initial_state"],
      sourcePlane,
      targetPlane,
    },
  };
}

export function evaluateChapterMovementProgression(input: {
  state: ChapterMovementProgressionState;
  progressionInput: ChapterMovementProgressionInput;
  evaluatedAtIso: string;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): ChapterMovementProgressionResult {
  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "canonical_truth";
  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      chapterId: input.state.chapterId,
      movementId: input.state.movementId,
      activeArcs: input.progressionInput.activeArcs.length,
      consequences: input.progressionInput.consequences.length,
      unresolvedQuestions: input.progressionInput.unresolvedQuestions.length,
    },
  });

  const metrics = computeReadinessMetrics(input.progressionInput);
  const blockers = computeBlockers({
    metrics,
    entry: input.state.entryConditions,
    completion: input.state.completionConditions,
    relationshipThresholds: input.progressionInput.relationshipThresholds,
  });
  const readinessScore = computeReadinessScore({ metrics, blockers });
  const entrySatisfied =
    metrics.activeArcCount >= input.state.entryConditions.minActiveArcs &&
    metrics.highSeverityConsequenceCount <= input.state.entryConditions.maxHighSeverityConsequences;
  const completionSatisfied =
    metrics.progressedArcCount >= input.state.completionConditions.minProgressedArcs &&
    metrics.resolvedArcCount >= input.state.completionConditions.minResolvedArcs &&
    metrics.unresolvedQuestionCount <= input.state.completionConditions.maxUnresolvedQuestions;
  const progressionState = progressionStateFromSignals({
    priorState: input.progressionInput.priorState,
    entrySatisfied,
    completionSatisfied,
    readinessScore,
    blockers,
  });

  const transitionReadiness: ChapterMovementTransitionReadiness = {
    readinessScore,
    eligibleForNextMovement: progressionState === "ready_to_transition" || progressionState === "completed",
    blockers,
  };

  const unresolvedCarryovers = normalizeCarryovers(
    input.progressionInput.unresolvedQuestions,
    input.progressionInput.priorState?.unresolvedCarryovers
  );

  const meaningfullyProgressed =
    input.progressionInput.priorState == null
      ? progressionState !== "not_started"
      : progressionState !== input.progressionInput.priorState.progressionState ||
        readinessScore > input.progressionInput.priorState.transitionReadiness.readinessScore;

  const outputSurface: ChapterMovementProgressionOutputSurface = {
    currentMovementFunction: input.state.chapterFunction,
    progressionReadiness: {
      state: progressionState,
      score: readinessScore,
      meaningfullyProgressed,
      eligibleForNextMovement: transitionReadiness.eligibleForNextMovement,
    },
    unresolvedNeeds: unresolvedCarryovers,
    transitionBlockers: blockers,
    recommendedScenePressureTypes: deriveRecommendedScenePressureTypes({
      blockers,
      relationshipThresholds: input.progressionInput.relationshipThresholds,
      unresolvedQuestionCount: metrics.unresolvedQuestionCount,
    }),
  };

  const updatedState: ChapterMovementProgressionState = {
    ...input.state,
    progressionState,
    unresolvedCarryovers,
    transitionReadiness,
    lastEvaluatedAtIso: input.evaluatedAtIso,
    explanation: {
      summaryCode: `chapter_movement_${input.state.progressionState}_to_${progressionState}`,
      reasonCodes: [
        entrySatisfied ? "entry_conditions_satisfied" : "entry_conditions_blocked",
        completionSatisfied ? "completion_conditions_satisfied" : "completion_conditions_pending",
        ...blockers,
      ],
      sourcePlane,
      targetPlane,
    },
  };

  return {
    updatedState,
    outputSurface,
  };
}
