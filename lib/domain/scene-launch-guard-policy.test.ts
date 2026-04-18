/**
 * Scene launch guard — confirmation policy (node:test).
 * Run: npx tsx --test lib/domain/scene-launch-guard-policy.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveLaunchConfirmationRequired } from "@/lib/domain/scene-launch-guard-policy";

describe("deriveLaunchConfirmationRequired", () => {
  it("requires confirmation for allowed_with_risk", () => {
    assert.equal(
      deriveLaunchConfirmationRequired({
        launchAllowance: "allowed_with_risk",
        overallReadinessClass: "downgrade_risk",
      }),
      true,
    );
  });

  it("does not require confirmation for clean allowed", () => {
    assert.equal(
      deriveLaunchConfirmationRequired({
        launchAllowance: "allowed",
        overallReadinessClass: "ready",
      }),
      false,
    );
  });

  it("does not require confirmation when blocked", () => {
    assert.equal(
      deriveLaunchConfirmationRequired({
        launchAllowance: "blocked",
        overallReadinessClass: "blocked",
      }),
      false,
    );
  });

  it("requires confirmation for rehearsal_incomplete even if allowance allowed", () => {
    assert.equal(
      deriveLaunchConfirmationRequired({
        launchAllowance: "allowed",
        overallReadinessClass: "rehearsal_incomplete",
      }),
      true,
    );
  });
});
