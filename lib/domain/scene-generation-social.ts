/**
 * Phase 6.1 — Compact social-field payload for scene generation (no raw metric dumps).
 */

export const SCENE_GENERATION_SOCIAL_VERSION = "1" as const;

/**
 * Literary-facing guidance derived deterministically from `SocialFieldContext` (+ observer-compatible counts).
 * Intended for LLM prompts and light QA — not reader copy.
 */
/** Server-side QA only — not duplicated into LLM user prompt as metrics. */
export type SceneGenerationSocialQaScalars = {
  witnessRisk01: number;
  gossipRisk01: number;
  authorityPressure01: number;
};

export type SceneGenerationSocialBundleV1 = {
  contractVersion: typeof SCENE_GENERATION_SOCIAL_VERSION;
  /** 0–1 composite for advisory heuristics (not shown to readers). */
  pressureIntensityScore: number;
  /** One short paragraph: how inhabited / watched this moment should feel. */
  socialFieldSummaryForGeneration: string;
  /** Unseen observers, rumor risk, walls-thin — ambient unease or ease. */
  invisiblePressureSummary: string;
  witnessRiskSummary: string;
  gossipRiskSummary: string;
  authorityAtmosphereSummary: string;
  kinVisibilitySummary: string;
  householdDensityHint: string;
  /** Population / parish scale hint (no census tables in prose). */
  nearbyPopulationHint: string;
};
