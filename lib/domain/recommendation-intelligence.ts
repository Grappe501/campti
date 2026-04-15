/**
 * Phase 7 / Chunk 5 — explainable recommendation contract.
 */
export const RECOMMENDATION_CONTRACT_VERSION = "1" as const;

export type RecommendationKind = "next_story" | "pacing" | "mode";

export type Recommendation = {
  contractVersion: typeof RECOMMENDATION_CONTRACT_VERSION;
  recommendationId: string;
  kind: RecommendationKind;
  label: string;
  rationale: string;
  explainable: true;
  manipulative: false;
  mutatesNarrativeTruth: false;
};
