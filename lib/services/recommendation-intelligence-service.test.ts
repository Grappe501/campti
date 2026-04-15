import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOperationalRecommendations } from "@/lib/services/recommendation-intelligence-service";

describe("recommendation-intelligence-service", () => {
  it("produces explainable non-manipulative recommendations", () => {
    const recommendations = buildOperationalRecommendations({
      readerBehavior: {
        contractVersion: "1",
        dateKey: "2026-04-15",
        sessionsObserved: 10,
        averageSessionDurationSeconds: 420,
        dropOffRate: 0.1,
        modeUsage: { immersive: 8, recap: 2 },
        interactionsPerSession: 3,
        reentryRate: 0.7,
        containsSensitiveInference: false,
      },
      storyHealth: {
        contractVersion: "1",
        manuscriptId: "man-1",
        chapterCompletionRate: 0.81,
        reentryAnomalyScore: 0.7,
        interactionAbandonmentRate: 0.4,
        coherenceWarnings: [],
        healthStatus: "watch",
      },
    });

    assert.equal(recommendations.length >= 2, true);
    for (const recommendation of recommendations) {
      assert.equal(recommendation.explainable, true);
      assert.equal(recommendation.manipulative, false);
      assert.equal(recommendation.mutatesNarrativeTruth, false);
      assert.equal(recommendation.rationale.length > 0, true);
    }
  });
});
