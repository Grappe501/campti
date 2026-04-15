import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateOperationsOrchestrationDepthVerification } from "@/lib/services/operations-orchestration-depth-verification-service";

describe("operations-orchestration-depth-verification-service", () => {
  it("fails when any required depth command fails", () => {
    const summary = evaluateOperationsOrchestrationDepthVerification({
      commandResults: [
        { command: "verify:telemetry-depth", ok: true },
        { command: "verify:anomaly-detection", ok: false },
      ],
    });
    assert.equal(summary.ok, false);
    assert.equal(summary.failedCommands.length, 1);
  });
});
