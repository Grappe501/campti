import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluatePlatformScaleVerification } from "@/lib/services/platform-scale-verification-service";

describe("platform-scale-verification-service", () => {
  it("passes when all scale checks pass", () => {
    const summary = evaluatePlatformScaleVerification({
      commandResults: [
        { command: "verify:multi-book", ok: true },
        { command: "verify:identity-isolation", ok: true },
      ],
    });
    assert.equal(summary.ok, true);
    assert.equal(summary.failedCommands.length, 0);
  });

  it("returns failed command list when checks fail", () => {
    const summary = evaluatePlatformScaleVerification({
      commandResults: [
        { command: "verify:session-isolation", ok: false },
        { command: "verify:versioning-integrity", ok: true },
      ],
    });
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.failedCommands, ["verify:session-isolation"]);
  });
});
