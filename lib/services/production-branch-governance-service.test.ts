import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateProductionBranchGovernance } from "@/lib/services/production-branch-governance-service";

describe("production-branch-governance-service", () => {
  it("flags unreconverged branches as certification blockers", () => {
    const result = evaluateProductionBranchGovernance({
      branches: [
        {
          branchId: "b1",
          type: "canonical",
          depth: 0,
          parentBranchId: null,
          reconverged: true,
        },
        {
          branchId: "b2",
          type: "exploratory",
          depth: 1,
          parentBranchId: "b1",
          reconverged: false,
        },
      ],
    });

    assert.equal(result.allowed, false);
    assert.ok(result.violations.includes("reconvergence_required_before_certification"));
  });

  it("passes governance when branches remain bounded and reconverged", () => {
    const result = evaluateProductionBranchGovernance({
      branches: [
        {
          branchId: "b1",
          type: "canonical",
          depth: 0,
          parentBranchId: null,
          reconverged: true,
        },
      ],
    });

    assert.equal(result.allowed, true);
    assert.equal(result.eligibleForCertification, true);
  });
});
