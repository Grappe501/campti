import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveGuidedSignals } from "@/lib/services/guided-signals-service";
import { buildIndicatorBank } from "@/lib/services/indicator-bank-model-service";

describe("guided-signals-service", () => {
  it("derives bounded and explainable advisory signals", () => {
    const bank = buildIndicatorBank({
      scope: "book",
      metrics: {
        pressureDistribution: 0.8,
        releaseReadiness: 0.9,
        unresolvedBlockers: 0.8,
      },
    });
    const signals = deriveGuidedSignals({ indicatorBank: bank, threshold: "medium" });
    assert.equal(signals.length > 0, true);
    assert.equal(signals.every((signal) => signal.advisoryOnly && signal.bounded && signal.explainable), true);
  });
});
