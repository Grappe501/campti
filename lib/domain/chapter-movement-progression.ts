import type { NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

export const CHAPTER_MOVEMENT_PROGRESSION_CONTRACT_VERSION = "1" as const;

export const CHAPTER_FUNCTIONS = [
  "setup",
  "deepening",
  "fracture",
  "convergence",
  "revelation",
  "reversal",
  "aftermath",
  "pursuit",
  "threshold",
  "loss",
  "recommitment",
] as const;

export const CHAPTER_PROGRESS_STATES = [
  "not_started",
  "blocked",
  "in_progress",
  "stalled",
  "ready_to_transition",
  "completed",
] as const;

export const SCENE_PRESSURE_RECOMMENDATIONS = [
  "relational_tension",
  "social_visibility",
  "temporal_urgency",
  "resource_strain",
  "moral_conflict",
] as const;

export type ChapterFunction = (typeof CHAPTER_FUNCTIONS)[number];
export type ChapterProgressState = (typeof CHAPTER_PROGRESS_STATES)[number];
export type ScenePressureRecommendation = (typeof SCENE_PRESSURE_RECOMMENDATIONS)[number];

export type ChapterMovementEntryConditions = {
  minActiveArcs: number;
  maxHighSeverityConsequences: number;
};

export type ChapterMovementCompletionConditions = {
  minProgressedArcs: number;
  minResolvedArcs: number;
  maxUnresolvedQuestions: number;
};

export type ChapterMovementUnresolvedCarryover = {
  carryoverId: string;
  category: "arc_open_thread" | "consequence_aftershock" | "relationship_instability" | "open_question";
  severity: "low" | "moderate" | "high";
};

export type ChapterMovementTransitionReadiness = {
  readinessScore: number;
  eligibleForNextMovement: boolean;
  blockers: string[];
};

export type ChapterMovementExplanation = {
  summaryCode: string;
  reasonCodes: string[];
  sourcePlane: NarrativeMemoryPlane;
  targetPlane: NarrativeMemoryPlane;
};

export type ChapterMovementProgressionState = {
  contractVersion: typeof CHAPTER_MOVEMENT_PROGRESSION_CONTRACT_VERSION;
  chapterId: string;
  movementId: string;
  orderIndex: number;
  chapterFunction: ChapterFunction;
  progressionState: ChapterProgressState;
  entryConditions: ChapterMovementEntryConditions;
  completionConditions: ChapterMovementCompletionConditions;
  unresolvedCarryovers: ChapterMovementUnresolvedCarryover[];
  transitionReadiness: ChapterMovementTransitionReadiness;
  lastEvaluatedAtIso: string;
  explanation: ChapterMovementExplanation;
};

export type ChapterMovementProgressionInput = {
  activeArcs: Array<{
    arcId: string;
    lifecycleState:
      | "dormant"
      | "seeded"
      | "active"
      | "escalating"
      | "crisis"
      | "turning"
      | "resolving"
      | "resolved"
      | "failed"
      | "transformed";
  }>;
  consequences: Array<{
    consequenceId: string;
    severity: "low" | "moderate" | "high";
    lifecycleState: "active" | "latent" | "decaying" | "resolved" | "transformed";
  }>;
  relationshipThresholds: {
    ruptureRiskHigh: boolean;
    trustFloorBreached: boolean;
    reconciliationOpen: boolean;
  };
  unresolvedQuestions: string[];
  priorState: ChapterMovementProgressionState | null;
};

export type ChapterMovementProgressionOutputSurface = {
  currentMovementFunction: ChapterFunction;
  progressionReadiness: {
    state: ChapterProgressState;
    score: number;
    meaningfullyProgressed: boolean;
    eligibleForNextMovement: boolean;
  };
  unresolvedNeeds: ChapterMovementUnresolvedCarryover[];
  transitionBlockers: string[];
  recommendedScenePressureTypes: ScenePressureRecommendation[];
};

export type ChapterMovementProgressionResult = {
  updatedState: ChapterMovementProgressionState;
  outputSurface: ChapterMovementProgressionOutputSurface;
};
