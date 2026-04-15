import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateOperationsLayerVerification } from "@/lib/services/operations-layer-verification-service";

describe("operations-layer-verification-service", () => {
  it("reports failed commands and invariant coverage", () => {
    const out = evaluateOperationsLayerVerification({
      commandResults: [
        { command: "verify:telemetry-model", ok: true },
        { command: "verify:reader-analytics", ok: false },
      ],
    });
    assert.equal(out.ok, false);
    assert.equal(out.failedCommands.length, 1);
    assert.equal(out.checkedInvariants.includes("truth_over_convenience"), true);
  });
});
