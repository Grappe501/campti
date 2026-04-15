import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRecommendationIntelligenceDepth } from "@/lib/services/recommendation-intelligence-depth-service";

describe("recommendation-intelligence-depth-service", () => {
  it("returns explainable, non-manipulative, spoiler-free recommendations", () => {
    const recs = buildRecommendationIntelligenceDepth({
      reentryRate: 0.7,
      abandonmentRate: 0.35,
      chapterCompletionRate: 0.8,
      dominantMode: "recap",
      libraryContinuationsAvailable: 3,
    });

    assert.equal(recs.length >= 3, true);
    for (const rec of recs) {
      assert.equal(rec.explainable, true);
      assert.equal(rec.nonManipulative, true);
      assert.equal(rec.spoilerFree, true);
      assert.equal(rec.userSafeExplanation.length > 0, true);
    }
  });
});
