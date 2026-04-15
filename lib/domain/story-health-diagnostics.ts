/**
 * Phase 7 Expansion / Workstream 3 — story health diagnostics.
 */
export const STORY_HEALTH_DIAGNOSTICS_CONTRACT_VERSION = "1" as const;

export type StoryHealthDiagnostic = {
  contractVersion: typeof STORY_HEALTH_DIAGNOSTICS_CONTRACT_VERSION;
  manuscriptId: string;
  indicators: {
    chapterTransitionStress: number;
    repeatedPointAbandonmentRate: number;
    unresolvedPressureOverload: number;
    branchGovernanceStress: number;
    modeDistortionScore: number;
    interactionBreakageScore: number;
    reentryCoherenceDegradation: number;
  };
  boundedInterpretation: string[];
  claimedCausalityLevel: "none" | "suggestive";
};
