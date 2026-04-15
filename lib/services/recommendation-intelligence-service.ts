import {
  RECOMMENDATION_CONTRACT_VERSION,
  type Recommendation,
} from "@/lib/domain/recommendation-intelligence";
import type { ReaderBehaviorSummary } from "@/lib/domain/reader-behavior-summary";
import type { StoryHealth } from "@/lib/domain/story-health";

export function buildOperationalRecommendations(input: {
  readerBehavior: ReaderBehaviorSummary;
  storyHealth: StoryHealth;
}): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (input.readerBehavior.reentryRate > 0.6) {
    recommendations.push({
      contractVersion: RECOMMENDATION_CONTRACT_VERSION,
      recommendationId: "mode-guidance-reentry",
      kind: "mode",
      label: "Suggest recap mode on reentry",
      rationale: "High reentry rate indicates recap support can reduce context reconstruction friction.",
      explainable: true,
      manipulative: false,
      mutatesNarrativeTruth: false,
    });
  }

  if (input.storyHealth.interactionAbandonmentRate > 0.35) {
    recommendations.push({
      contractVersion: RECOMMENDATION_CONTRACT_VERSION,
      recommendationId: "pacing-slow-down",
      kind: "pacing",
      label: "Prefer slower pacing prompts",
      rationale: "Elevated interaction abandonment suggests conversational pacing should be softened.",
      explainable: true,
      manipulative: false,
      mutatesNarrativeTruth: false,
    });
  }

  if (input.storyHealth.chapterCompletionRate >= 0.75) {
    recommendations.push({
      contractVersion: RECOMMENDATION_CONTRACT_VERSION,
      recommendationId: "next-story-confident-handoff",
      kind: "next_story",
      label: "Recommend adjacent story arc",
      rationale: "Strong chapter completion indicates readiness for adjacent narrative exploration.",
      explainable: true,
      manipulative: false,
      mutatesNarrativeTruth: false,
    });
  }

  return recommendations;
}
