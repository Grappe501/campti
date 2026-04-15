import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateExperimentGovernance } from "@/lib/services/experimentation-governance-service";

describe("experimentation-governance-service", () => {
  it("allows bounded experiments that do not mutate truth", () => {
    const verdict = evaluateExperimentGovernance({
      experiment: {
        contractVersion: "1",
        experimentId: "exp-1",
        name: "mode onboarding copy",
        audienceSegment: "new_readers",
        boundedScope: "ui_copy",
        variants: [
          {
            variantId: "control",
            allocationPercent: 50,
            parameters: { banner: "default" },
          },
          {
            variantId: "variant-a",
            allocationPercent: 50,
            parameters: { banner: "guided" },
          },
        ],
      },
    });
    assert.equal(verdict.allowed, true);
    assert.equal(verdict.violations.length, 0);
  });

  it("blocks variants that attempt truth mutation keys", () => {
    const verdict = evaluateExperimentGovernance({
      experiment: {
        contractVersion: "1",
        experimentId: "exp-2",
        name: "unsafe mutation",
        audienceSegment: "all_readers",
        boundedScope: "recommendation_ordering",
        variants: [
          {
            variantId: "control",
            allocationPercent: 100,
            parameters: {
              mutateTruth: true,
            },
          },
        ],
      },
    });
    assert.equal(verdict.allowed, false);
    assert.equal(verdict.violations.some((violation) => violation.includes("forbidden_truth_mutation_key")), true);
  });
});
