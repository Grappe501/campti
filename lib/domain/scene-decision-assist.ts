/**
 * Author Decision Assist — advisory recommendation layer (no autopilot, no hidden policy).
 * Grounded in preflight, research tab, simulation rollup, run ledger, and outcome analytics.
 */

import type { SceneRunOutputChurnHint } from "@/lib/domain/scene-run-output-linkage";
import type {
  SceneRecommendationEffectivenessViewModel,
  SceneRecommendationLearningAugmentation,
} from "@/lib/domain/scene-recommendation-learning";
import type {
  SceneOperatingModeSummary,
  SceneStabilityForecast,
  SceneStabilityMemorySummary,
} from "@/lib/domain/scene-stability-operating";

export const SCENE_DECISION_ASSIST_CONTRACT_VERSION = "1" as const;

export type SceneDecisionRecommendationStrength = "strong" | "moderate" | "light" | "informational";

/** Bounded taxonomy — extend only with explicit contract bump. */
export type SceneDecisionRecommendationCategory =
  | "replay_now"
  | "repair_instead_of_replay"
  | "resolve_research_pressure_first"
  | "resolve_character_simulation_first"
  | "review_preflight_blockers"
  | "inspect_run_diff_first"
  | "pause_relaunch_churn"
  | "proceed_stability_improving"
  | "historical_review_only";

export type SceneDecisionEvidenceKind = "fact" | "heuristic" | "unavailable" | "partial";

export type SceneDecisionRecommendationEvidenceSummary = {
  id: string;
  text: string;
  kind: SceneDecisionEvidenceKind;
};

export type SceneDecisionAssistHeuristicNote = {
  id: string;
  text: string;
  /** Advisory strength of the interpretation, not factual certainty. */
  noteStrength: "low" | "medium" | "high";
};

export type SceneDecisionRecommendationActionKind = "scene_tab" | "href" | "advisory_only";

export type SceneDecisionRecommendationAction = {
  id: string;
  label: string;
  kind: SceneDecisionRecommendationActionKind;
  /** `/admin/scenes/:id?tab=…` when scene_tab */
  sceneTab?: "preflight" | "research" | "runs" | "assist";
  href?: string | null;
  explanation: string;
};

export type SceneDecisionRecommendationTrigger = {
  code: string;
  label: string;
  detail: string;
  kind: SceneDecisionEvidenceKind;
};

export type SceneDecisionRecommendationBasis = {
  summary: string;
  factualEvidence: SceneDecisionRecommendationEvidenceSummary[];
  heuristicNotes: SceneDecisionAssistHeuristicNote[];
  triggers: SceneDecisionRecommendationTrigger[];
};

export type SceneDecisionAssistSuppressionReason = {
  code: string;
  message: string;
  affectedRecommendationCategory: SceneDecisionRecommendationCategory | "any";
};

export type SceneDecisionRecommendation = {
  id: string;
  category: SceneDecisionRecommendationCategory;
  priorityRank: number;
  title: string;
  recommendationText: string;
  strength: SceneDecisionRecommendationStrength;
  basis: SceneDecisionRecommendationBasis;
  actions: SceneDecisionRecommendationAction[];
  suppressionOrCautionNotes: string[];
  /** Downstream strength cap when history is thin or partial. */
  confidenceCapReasons: SceneDecisionAssistSuppressionReason[];
  /**
   * Observational learning layer — bounded notes and at most one-step strength nudges.
   * Does not replace `basis`; may align `strength` with `learningAugmentation.effectiveStrength`.
   */
  learningAugmentation?: SceneRecommendationLearningAugmentation;
};

export type SceneDecisionRecommendationSet = {
  primary: SceneDecisionRecommendation | null;
  secondary: SceneDecisionRecommendation[];
};

export type SceneDecisionAssistSummary = {
  headline: string;
  honestyBanner: string;
  partialHistoryCodes: Array<
    "partial_history_limits_confidence" | "insufficient_recent_runs" | "output_linkage_unavailable" | "legacy_run_history"
  >;
  /** Bounded output-change hints from durable run snapshots (advisory). */
  outputChurnHints: SceneRunOutputChurnHint[];
};

export type SceneDecisionAssistRunFocus = {
  ledgerRunKey: string;
  replayEligibility: string;
  notes: string[];
};

export type SceneDecisionAssistViewModel = {
  contractVersion: typeof SCENE_DECISION_ASSIST_CONTRACT_VERSION;
  sceneId: string;
  evaluatedAtIso: string;
  summary: SceneDecisionAssistSummary;
  recommendations: SceneDecisionRecommendationSet;
  suppressionsApplied: SceneDecisionAssistSuppressionReason[];
  runFocus: SceneDecisionAssistRunFocus | null;
  /** Scene-scoped bounded effectiveness (optional when logging disabled or empty). */
  effectivenessSummary: SceneRecommendationEffectivenessViewModel | null;
  /** Derived scene stability memory (no separate persistence in v1). */
  stabilityMemory: SceneStabilityMemorySummary | null;
  /** Advisory early warnings — conservative, traceable. */
  stabilityForecasts: SceneStabilityForecast[];
  /** Legible operating posture; does not override guard policy. */
  sceneOperatingMode: SceneOperatingModeSummary | null;
};

/** Compact summary for cockpit / rails (no full evidence payload). */
export type SceneDecisionAssistCockpitCard = {
  primaryTitle: string;
  primaryRecommendation: string;
  strength: SceneDecisionRecommendationStrength;
  sceneAssistHref: string;
};
