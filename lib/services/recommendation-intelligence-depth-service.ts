import {
  RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION,
  type DeepRecommendation,
} from "@/lib/domain/recommendation-intelligence-depth";

export function buildRecommendationIntelligenceDepth(input: {
  reentryRate: number;
  abandonmentRate: number;
  chapterCompletionRate: number;
  dominantMode: string;
  libraryContinuationsAvailable: number;
}): DeepRecommendation[] {
  const recommendations: DeepRecommendation[] = [];

  if (input.chapterCompletionRate >= 0.7 && input.libraryContinuationsAvailable > 0) {
    recommendations.push({
      contractVersion: RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION,
      recommendationId: "deep-next-story",
      kind: "next_story",
      suggestion: "Offer adjacent storyline continuation options in library context.",
      boundedRationale: "High completion suggests readiness for continuation browsing.",
      userSafeExplanation: "Based on completion patterns, a nearby continuation may be a good next read.",
      nonManipulative: true,
      spoilerFree: true,
      explainable: true,
    });
  }

  if (input.reentryRate > 0.55) {
    recommendations.push({
      contractVersion: RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION,
      recommendationId: "deep-reentry-guidance",
      kind: "reentry_guidance",
      suggestion: "Prioritize recap-first reentry guidance.",
      boundedRationale: "Frequent reentry benefits from context restoration.",
      userSafeExplanation: "A recap-first return can make sessions easier to resume.",
      nonManipulative: true,
      spoilerFree: true,
      explainable: true,
    });
  }

  if (input.abandonmentRate > 0.3) {
    recommendations.push({
      contractVersion: RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION,
      recommendationId: "deep-pacing-recap",
      kind: "pacing_recap",
      suggestion: "Apply gentler pacing with recap cueing.",
      boundedRationale: "Abandonment increase may indicate pacing/context mismatch.",
      userSafeExplanation: "A slower pace with recap cues can reduce drop-off.",
      nonManipulative: true,
      spoilerFree: true,
      explainable: true,
    });
  }

  recommendations.push({
    contractVersion: RECOMMENDATION_INTELLIGENCE_DEPTH_CONTRACT_VERSION,
    recommendationId: "deep-mode-stability",
    kind: "next_mode",
    suggestion: `Bias toward ${input.dominantMode} unless abandonment worsens.`,
    boundedRationale: "Mode stability can reduce cognitive switching overhead.",
    userSafeExplanation: "Keeping your usual mode can make the flow more consistent.",
    nonManipulative: true,
    spoilerFree: true,
    explainable: true,
  });

  return recommendations;
}
