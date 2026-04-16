import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateDeploymentCommercialLayerVerification } from "@/lib/services/deployment-commercial-layer-verification-service";

describe("deployment-commercial-layer-verification-service", () => {
  it("reports deployment/commercial verification failures with invariants", () => {
    const summary = evaluateDeploymentCommercialLayerVerification({
      commandResults: [
        { command: "verify:deployment-governance", ok: true },
        { command: "verify:rollout-rollback", ok: false },
      ],
    });
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.failedCommands, ["verify:rollout-rollback"]);
    assert.equal(summary.checkedInvariants.includes("entitlements_remain_authoritative"), true);
  });
});
