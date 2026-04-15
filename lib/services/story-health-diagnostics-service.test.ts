import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateStoryHealthDiagnostics } from "@/lib/services/story-health-diagnostics-service";

describe("story-health-diagnostics-service", () => {
  it("produces bounded and non-overclaiming diagnostics", () => {
    const diagnostics = evaluateStoryHealthDiagnostics({
      manuscriptId: "man-1",
      chapterTransitionStress: 0.72,
      repeatedPointAbandonmentRate: 0.4,
      unresolvedPressureOverload: 0.61,
      branchGovernanceStress: 0.35,
      modeDistortionScore: 0.3,
      interactionBreakageScore: 0.2,
      reentryCoherenceDegradation: 0.65,
    });
    assert.equal(diagnostics.indicators.chapterTransitionStress > 0.6, true);
    assert.equal(diagnostics.boundedInterpretation.length >= 2, true);
    assert.equal(diagnostics.claimedCausalityLevel, "suggestive");
  });
});
