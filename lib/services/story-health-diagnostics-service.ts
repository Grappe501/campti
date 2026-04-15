import {
  STORY_HEALTH_DIAGNOSTICS_CONTRACT_VERSION,
  type StoryHealthDiagnostic,
} from "@/lib/domain/story-health-diagnostics";

export function evaluateStoryHealthDiagnostics(input: {
  manuscriptId: string;
  chapterTransitionStress: number;
  repeatedPointAbandonmentRate: number;
  unresolvedPressureOverload: number;
  branchGovernanceStress: number;
  modeDistortionScore: number;
  interactionBreakageScore: number;
  reentryCoherenceDegradation: number;
}): StoryHealthDiagnostic {
  const boundedInterpretation: string[] = [];

  if (input.chapterTransitionStress > 0.6) {
    boundedInterpretation.push("Elevated transition stress suggests chapter handoffs require inspection.");
  }
  if (input.repeatedPointAbandonmentRate > 0.3) {
    boundedInterpretation.push("Repeated abandonment near the same narrative points indicates structural friction.");
  }
  if (input.unresolvedPressureOverload > 0.5) {
    boundedInterpretation.push("Unresolved pressure patterns may be accumulating faster than releases.");
  }
  if (input.reentryCoherenceDegradation > 0.5) {
    boundedInterpretation.push("Reentry coherence degradation suggests recap/reentry flow should be reviewed.");
  }

  return {
    contractVersion: STORY_HEALTH_DIAGNOSTICS_CONTRACT_VERSION,
    manuscriptId: input.manuscriptId,
    indicators: {
      chapterTransitionStress: input.chapterTransitionStress,
      repeatedPointAbandonmentRate: input.repeatedPointAbandonmentRate,
      unresolvedPressureOverload: input.unresolvedPressureOverload,
      branchGovernanceStress: input.branchGovernanceStress,
      modeDistortionScore: input.modeDistortionScore,
      interactionBreakageScore: input.interactionBreakageScore,
      reentryCoherenceDegradation: input.reentryCoherenceDegradation,
    },
    boundedInterpretation,
    claimedCausalityLevel: boundedInterpretation.length > 0 ? "suggestive" : "none",
  };
}
