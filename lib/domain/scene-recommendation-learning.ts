/**
 * Recommendation effectiveness / learning loop — observational, append-only, no autopilot.
 * Correlates shown advice, optional follow-up actions, and subsequent launch outcomes without causal claims.
 */

import type { SceneDecisionRecommendationCategory, SceneDecisionRecommendationStrength } from "@/lib/domain/scene-decision-assist";

export const SCENE_RECOMMENDATION_LEARNING_CONTRACT_VERSION = "1" as const;

export const SCENE_RECOMMENDATION_EVENT_TYPES = [
  "recommendation_shown",
  "recommendation_action_taken",
  "recommendation_outcome_linked",
  "recommendation_outcome_evaluated",
] as const;

export type SceneRecommendationEventType = (typeof SCENE_RECOMMENDATION_EVENT_TYPES)[number];

export const SCENE_RECOMMENDATION_ACTION_TYPES = [
  "replay_requested",
  "repair_requested",
  "opened_preflight",
  "opened_research",
  "opened_simulation",
  "opened_diff",
  "launched_new_run",
  "no_observed_followup",
] as const;

export type SceneRecommendationActionType = (typeof SCENE_RECOMMENDATION_ACTION_TYPES)[number];

export type SceneRecommendationHistoryStatus =
  | "insufficient_history"
  | "ambiguous_followup"
  | "no_observed_outcome"
  | "low_confidence_pattern"
  | "history_available";

export type SceneRecommendationOutcomeLinkStatus = "linked_outcome" | "ambiguous_followup" | "no_observed_outcome";

export type SceneRecommendationConfidenceAdjustmentKind =
  | "confidence_adjusted_up"
  | "confidence_adjusted_down"
  | "insufficient_history"
  | "historical_note_only";

/** Bounded correlation for one category in one scene window (not causal). */
export type SceneRecommendationOutcomeCorrelation = {
  category: SceneDecisionRecommendationCategory;
  shownCount: number;
  followedCount: number;
  /** Outcomes recorded via `recommendation_outcome_linked` referencing a prior shown event that included this category. */
  outcomeLinkedCount: number;
  subsequentAllowanceDistribution: {
    allowed: number;
    allowed_with_risk: number;
    blocked: number;
    failed_generation: number;
    unknown: number;
  };
  /** Share of non-clean completions in linked outcomes (heuristic churn proxy). */
  churnPressureShare: number | null;
  linkStatus: SceneRecommendationOutcomeLinkStatus;
  sparseData: boolean;
  historyStatus: SceneRecommendationHistoryStatus;
};

export type SceneRecommendationEffectivenessStats = {
  categoryCorrelations: SceneRecommendationOutcomeCorrelation[];
  windowDays: number;
  totalShownEvents: number;
  totalOutcomeLinkedEvents: number;
};

export type SceneRecommendationLearningNote = {
  text: string;
  derivation: "observational_pattern" | "sparse_data" | "ambiguous_linkage";
};

export type SceneRecommendationConfidenceAdjustment = {
  kind: SceneRecommendationConfidenceAdjustmentKind;
  /** Human-readable, non-coercive explanation (never implies certainty). */
  explanation: string | null;
  notes: SceneRecommendationLearningNote[];
};

export type SceneRecommendationFollowupSummary = {
  recentActionTypes: SceneRecommendationActionType[];
  lastActionAtIso: string | null;
};

export type SceneRecommendationOutcomeEvaluationMeta = {
  launchAllowance: string | null;
  generationSucceeded: boolean;
  linkStatus: SceneRecommendationOutcomeLinkStatus;
};

export type SceneRecommendationEffectivenessViewModel = {
  contractVersion: typeof SCENE_RECOMMENDATION_LEARNING_CONTRACT_VERSION;
  sceneId: string;
  evaluatedAtIso: string;
  overallHistoryStatus: SceneRecommendationHistoryStatus;
  honestyBanner: string;
  stats: SceneRecommendationEffectivenessStats;
  followup: SceneRecommendationFollowupSummary;
};

export type SceneRecommendationLearningAugmentation = {
  /** Pattern learned in this scene window — does not replace rule-based basis. */
  historicalNote: string | null;
  confidenceAdjustment: SceneRecommendationConfidenceAdjustment;
  /** Strength emitted by rules before any learning tweak (for transparency). */
  ruleBasedStrength: SceneDecisionRecommendationStrength;
  /** Strength after bounded learning tweak (same or one step). */
  effectiveStrength: SceneDecisionRecommendationStrength;
  historyStatus: SceneRecommendationHistoryStatus;
};
