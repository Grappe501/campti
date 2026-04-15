import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyBoundedAuthorSteering,
  createAuthorIntent,
} from "@/lib/services/author-intent-steering-service";

describe("author-intent-steering-service", () => {
  it("applies steering as bounded weighting only", () => {
    const intent = createAuthorIntent({
      emphasisSignals: [{ signalId: "arc:trust", weightDelta: 10 }],
      suppressionSignals: [{ signalId: "arc:betrayal", weightDelta: -14 }],
      pressureAdjustments: [{ signalId: "pressure:urgency", weightDelta: 8 }],
      chapterLevelShaping: ["focus relational repair"],
      bookLevelShaping: ["maintain tragic undertone"],
    });
    const out = applyBoundedAuthorSteering({
      intent,
      legalSignalIds: ["arc:trust", "arc:betrayal", "pressure:urgency"],
      illegalSignalIds: [],
    });
    assert.equal(out.forceOverrideApplied, false);
    assert.equal(out.appliedWeightDeltas["arc:trust"], 10);
    assert.equal(out.appliedWeightDeltas["arc:betrayal"], -14);
  });

  it("rejects illegal override-like signals", () => {
    const intent = createAuthorIntent({
      emphasisSignals: [{ signalId: "force:guarantee-ending", weightDelta: 100 }],
      suppressionSignals: [],
      pressureAdjustments: [],
      chapterLevelShaping: [],
      bookLevelShaping: [],
    });
    const out = applyBoundedAuthorSteering({
      intent,
      legalSignalIds: ["arc:trust"],
      illegalSignalIds: ["force:guarantee-ending"],
    });
    assert.equal(Object.keys(out.appliedWeightDeltas).length, 0);
    assert.ok(out.rejectedSignals.includes("force:guarantee-ending"));
  });
});
