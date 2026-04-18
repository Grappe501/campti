/**
 * Scene generation preflight — launch allowance and overall readiness rules (node:test).
 * Run: npx tsx --test lib/domain/scene-generation-preflight-rules.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveLaunchAllowance, deriveOverallReadinessClass } from "@/lib/domain/scene-generation-preflight-rules";

describe("deriveLaunchAllowance", () => {
  it("returns allowed when no blockers and no risks", () => {
    assert.equal(deriveLaunchAllowance({ blockerCount: 0, downgradeRiskCount: 0 }), "allowed");
  });

  it("returns allowed_with_risk when risks exist but no blockers", () => {
    assert.equal(deriveLaunchAllowance({ blockerCount: 0, downgradeRiskCount: 1 }), "allowed_with_risk");
    assert.equal(deriveLaunchAllowance({ blockerCount: 0, downgradeRiskCount: 9 }), "allowed_with_risk");
  });

  it("returns blocked when any blocker exists, even with risks", () => {
    assert.equal(deriveLaunchAllowance({ blockerCount: 1, downgradeRiskCount: 0 }), "blocked");
    assert.equal(deriveLaunchAllowance({ blockerCount: 1, downgradeRiskCount: 5 }), "blocked");
  });
});

describe("deriveOverallReadinessClass", () => {
  it("maps blocked allowance to blocked", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "blocked", advisoryCount: 0, observationalOnly: false }),
      "blocked",
    );
  });

  it("maps allowed_with_risk to downgrade_risk", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "allowed_with_risk", advisoryCount: 0, observationalOnly: false }),
      "downgrade_risk",
    );
  });

  it("maps clean allowed to ready", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "allowed", advisoryCount: 0, observationalOnly: false }),
      "ready",
    );
  });

  it("maps allowed with advisories to ready_with_advisories", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "allowed", advisoryCount: 2, observationalOnly: false }),
      "ready_with_advisories",
    );
  });

  it("prefers blocked over observationalOnly flag", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "blocked", advisoryCount: 0, observationalOnly: true }),
      "blocked",
    );
  });

  it("honors observational_only only when allowance is allowed and no advisories", () => {
    assert.equal(
      deriveOverallReadinessClass({ launchAllowance: "allowed", advisoryCount: 0, observationalOnly: true }),
      "observational_only",
    );
  });
});
