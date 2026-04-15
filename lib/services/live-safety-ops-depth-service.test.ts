import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeLiveSafetyOpsDepth } from "@/lib/services/live-safety-ops-depth-service";

describe("live-safety-ops-depth-service", () => {
  it("provides actionable trend summaries and safe explanations", () => {
    const summary = summarizeLiveSafetyOpsDepth({
      moderationCountCurrent: 40,
      moderationCountBaseline: 15,
      degradedCountCurrent: 20,
      degradedCountBaseline: 8,
      providerFailureClusters: 3,
      repeatedModerationBlocks: 12,
      degradedUxSurfaceConsistency: "inconsistent",
    });
    assert.equal(summary.severitySummary, "high");
    assert.equal(summary.operatorActionabilitySignals.length > 1, true);
    assert.equal(summary.operatorSafeExplanation.includes("does not expose sensitive moderation"), true);
  });
});
