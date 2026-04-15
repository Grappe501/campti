import {
  OPERATOR_LIVE_SURFACE_CONTRACT_VERSION,
  type AuthorInsightSurface,
  type OperatorDashboard,
} from "@/lib/domain/operator-live-surface";
import type { ReaderBehaviorSummary } from "@/lib/domain/reader-behavior-summary";
import type { StoryHealth } from "@/lib/domain/story-health";
import type { ModerationOpsSummary } from "@/lib/domain/moderation-ops";

export function buildOperatorDashboard(input: {
  readerBehavior: ReaderBehaviorSummary;
  storyHealth: StoryHealth;
  moderationOps: ModerationOpsSummary;
}): OperatorDashboard {
  const criticalSignals =
    (input.storyHealth.healthStatus === "critical" ? 1 : 0) +
    (input.moderationOps.unresolvedEscalations > 0 ? 1 : 0) +
    (input.moderationOps.providerFailures > 0 ? 1 : 0);
  const warningSignals =
    (input.storyHealth.healthStatus === "watch" ? 1 : 0) +
    (input.readerBehavior.dropOffRate > 0.4 ? 1 : 0) +
    (input.moderationOps.degradedFallbackFrequency > 0 ? 1 : 0);

  return {
    contractVersion: OPERATOR_LIVE_SURFACE_CONTRACT_VERSION,
    systemHealth: criticalSignals > 0 ? "critical" : warningSignals > 0 ? "degraded" : "nominal",
    readerBehaviorSummary: {
      sessionsObserved: input.readerBehavior.sessionsObserved,
      dropOffRate: input.readerBehavior.dropOffRate,
      reentryRate: input.readerBehavior.reentryRate,
    },
    storyHealthIndicators: {
      chapterCompletionRate: input.storyHealth.chapterCompletionRate,
      interactionAbandonmentRate: input.storyHealth.interactionAbandonmentRate,
      healthStatus: input.storyHealth.healthStatus,
    },
    moderationMetrics: {
      violationsTracked: input.moderationOps.violationsTracked,
      escalationsTriggered: input.moderationOps.escalationsTriggered,
      unresolvedEscalations: input.moderationOps.unresolvedEscalations,
    },
    exposesForbiddenNarrativeState: false,
  };
}

export function buildAuthorInsightSurface(input: {
  readerBehavior: ReaderBehaviorSummary;
  storyHealth: StoryHealth;
}): AuthorInsightSurface {
  return {
    contractVersion: OPERATOR_LIVE_SURFACE_CONTRACT_VERSION,
    chapterPerformance: {
      chapterCompletionRate: input.storyHealth.chapterCompletionRate,
      interactionAbandonmentRate: input.storyHealth.interactionAbandonmentRate,
    },
    engagementPatterns: {
      averageSessionDurationSeconds: input.readerBehavior.averageSessionDurationSeconds,
      interactionsPerSession: input.readerBehavior.interactionsPerSession,
      modeUsage: { ...input.readerBehavior.modeUsage },
    },
    exposesForbiddenNarrativeState: false,
  };
}
