import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOperatorInsightDepthBundle } from "@/lib/services/operator-insight-depth-service";

describe("operator-insight-depth-service", () => {
  it("keeps operator, author and internal surfaces separated", () => {
    const bundle = buildOperatorInsightDepthBundle({
      telemetrySummary: ["entry/reentry coverage healthy"],
      anomalySummary: ["drop-off spike warning in chapter transition"],
      safetySummary: ["degraded trend rising"],
      storyDiagnosticsSummary: ["transition stress elevated in ch4->ch5"],
      recommendationRationaleSummary: ["recap-first guidance due to high reentry rate"],
      experimentSummary: ["variant v2 shows abandonment risk"],
      releaseImpactSignals: ["v1.0.4 introduced higher fallback rates"],
      orchestrationSignals: ["operations bundle sync healthy"],
    });
    assert.equal(bundle.ownershipBoundariesClear, true);
    assert.equal(bundle.operatorSurface.telemetrySummary.length, 1);
    assert.equal(bundle.authorSurface.storyDiagnosticsSummary.length, 1);
    assert.equal(bundle.internalDebugSurface.releaseImpactSignals.length, 1);
  });
});
