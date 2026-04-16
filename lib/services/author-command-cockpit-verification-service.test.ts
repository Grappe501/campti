import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateAuthorCommandCockpitVerification } from "@/lib/services/author-command-cockpit-verification-service";

describe("author-command-cockpit-verification-service", () => {
  it("reports failed commands and cockpit invariants", () => {
    const summary = evaluateAuthorCommandCockpitVerification({
      commandResults: [
        { command: "verify:cockpit-shell-architecture", ok: true },
        { command: "verify:guided-signals", ok: false },
      ],
    });
    assert.equal(summary.ok, false);
    assert.deepEqual(summary.failedCommands, ["verify:guided-signals"]);
    assert.equal(summary.checkedInvariants.includes("guided_signals_advisory_only"), true);
  });
});
