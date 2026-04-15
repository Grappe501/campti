import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOperationsOrchestrationDepthBundle } from "@/lib/services/operations-orchestration-depth-service";

describe("operations-orchestration-depth-service", () => {
  it("builds a bounded, explainable, non-omniscient operations bundle", () => {
    const bundle = buildOperationsOrchestrationDepthBundle({
      telemetrySummary: ["entry flow healthy"],
      anomalyState: ["drop-off anomaly warning"],
      storyHealthSummary: ["chapter transition stress elevated"],
      experimentStatusSummary: ["exp-1 safe to continue"],
      recommendationSummary: ["recap guidance active"],
      liveSafetySummary: ["degraded trend stable"],
      operatorActionHints: ["monitor reentry failures"],
    });

    assert.equal(bundle.bounded, true);
    assert.equal(bundle.explainable, true);
    assert.equal(bundle.nonOmniscient, true);
    assert.equal(bundle.mutatesCanonicalTruth, false);
    assert.equal(bundle.sourceOfTruth, "operational_observation_layer");
  });
});
