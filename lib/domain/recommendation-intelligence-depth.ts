/**
 * Phase 7 Expansion / Workstream 5 — recommendation intelligence depth.
 */
export const RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION = "1" as const;

export type DeepRecommendationKind = "next_story" | "next_mode" | "reentry_guidance" | "pacing_recap" | "library_path";

export type DeepRecommendation = {
  contractVersion: typeof RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION;
  recommendationId: string;
  kind: DeepRecommendationKind;
  suggestion: string;
  boundedRationale: string;
  userSafeExplanation: string;
  nonManipulative: true;
  spoilerFree: true;
  explainable: true;
};
