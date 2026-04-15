import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildStorylineExplainabilitySummary } from "@/lib/services/storyline-explainability-service";

describe("storyline-explainability-service", () => {
  it("builds deterministic bounded explainability summary", () => {
    const input = {
      mode: "interaction_mode" as const,
      channel: "reader_bond_dyad" as const,
      seamId: "debug-seam",
      relationshipSignalCodes: ["signal_a", "signal_b", "signal_c"],
    };
    const a = buildStorylineExplainabilitySummary(input);
    const b = buildStorylineExplainabilitySummary(input);
    assert.deepEqual(a, b);
    assert.ok(a.arcState.explanationReasonCodes.length <= 6);
    assert.ok(a.chapterProgression.transitionBlockers.length <= 6);
    assert.ok(a.narrativePressure.topPressureCategories.length <= 4);
    assert.ok(a.branchGovernance.arcCompatibilityWarnings.length <= 6);
    assert.ok(a.storylineGuidance.allowedSceneTendencies.length <= 6);
    assert.ok(a.storylineGuidance.tensionEmphasisWeights.length <= 4);
  });
});
