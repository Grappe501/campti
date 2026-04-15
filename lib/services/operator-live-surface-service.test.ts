import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAuthorInsightSurface,
  buildOperatorDashboard,
} from "@/lib/services/operator-live-surface-service";

describe("operator-live-surface-service", () => {
  it("builds safe operator and author surfaces without forbidden narrative state", () => {
    const readerBehavior = {
      contractVersion: "1" as const,
      dateKey: "2026-04-15",
      sessionsObserved: 10,
      averageSessionDurationSeconds: 500,
      dropOffRate: 0.2,
      modeUsage: { immersive: 7, recap: 3 },
      interactionsPerSession: 4,
      reentryRate: 0.4,
      containsSensitiveInference: false as const,
    };
    const storyHealth = {
      contractVersion: "1" as const,
      manuscriptId: "man-1",
      chapterCompletionRate: 0.8,
      reentryAnomalyScore: 0.3,
      interactionAbandonmentRate: 0.2,
      coherenceWarnings: [],
      healthStatus: "healthy" as const,
    };
    const moderationOps = {
      contractVersion: "1" as const,
      windowStartIso: "2026-04-15T00:00:00.000Z",
      windowEndIso: "2026-04-15T23:59:59.000Z",
      violationsTracked: 3,
      escalationsTriggered: 1,
      unresolvedEscalations: 0,
      degradedFallbackFrequency: 0,
      providerFailures: 0,
    };

    const dashboard = buildOperatorDashboard({
      readerBehavior,
      storyHealth,
      moderationOps,
    });
    const authorInsights = buildAuthorInsightSurface({
      readerBehavior,
      storyHealth,
    });

    assert.equal(dashboard.exposesForbiddenNarrativeState, false);
    assert.equal(authorInsights.exposesForbiddenNarrativeState, false);
    assert.equal(dashboard.systemHealth, "nominal");
    assert.equal(authorInsights.engagementPatterns.modeUsage.immersive, 7);
  });
});
