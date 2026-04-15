/**
 * Phase 7 / Chunk 7 — safe operator and author live surface models.
 */
export const OPERATOR_LIVE_SURFACE_CONTRACT_VERSION = "1" as const;

export type OperatorDashboard = {
  contractVersion: typeof OPERATOR_LIVE_SURFACE_CONTRACT_VERSION;
  systemHealth: "nominal" | "degraded" | "critical";
  readerBehaviorSummary: {
    sessionsObserved: number;
    dropOffRate: number;
    reentryRate: number;
  };
  storyHealthIndicators: {
    chapterCompletionRate: number;
    interactionAbandonmentRate: number;
    healthStatus: "healthy" | "watch" | "critical";
  };
  moderationMetrics: {
    violationsTracked: number;
    escalationsTriggered: number;
    unresolvedEscalations: number;
  };
  exposesForbiddenNarrativeState: false;
};

export type AuthorInsightSurface = {
  contractVersion: typeof OPERATOR_LIVE_SURFACE_CONTRACT_VERSION;
  chapterPerformance: {
    chapterCompletionRate: number;
    interactionAbandonmentRate: number;
  };
  engagementPatterns: {
    averageSessionDurationSeconds: number;
    interactionsPerSession: number;
    modeUsage: Record<string, number>;
  };
  exposesForbiddenNarrativeState: false;
};
