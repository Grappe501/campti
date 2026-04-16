import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateCreatorPublishingLayerVerification } from "@/lib/services/creator-publishing-layer-verification-service";

describe("creator-publishing-layer-verification-service", () => {
  it("reports failures and includes critical creator/publishing invariants", () => {
    const summary = evaluateCreatorPublishingLayerVerification({
      commandResults: [
        { command: "verify:creator-identity-roles", ok: true },
        { command: "verify:workspace-project-model", ok: false },
      ],
    });
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.failedCommands, ["verify:workspace-project-model"]);
    assert.equal(summary.checkedInvariants.includes("no_publishing_without_governance"), true);
  });
});
