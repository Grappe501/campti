import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateExperimentGovernanceDepth } from "@/lib/services/experiment-governance-depth-service";

describe("experiment-governance-depth-service", () => {
  it("flags over-fragmented and unstable experiment behavior", () => {
    const report = evaluateExperimentGovernanceDepth({
      experiment: {
        contractVersion: "1",
        experimentId: "exp-depth-1",
        name: "reentry treatment matrix",
        audienceSegment: "returning_readers",
        boundedScope: "mode_default",
        variants: [
          { variantId: "v1", allocationPercent: 20, parameters: { mode: "recap" } },
          { variantId: "v2", allocationPercent: 20, parameters: { mode: "hybrid" } },
          { variantId: "v3", allocationPercent: 20, parameters: { mode: "immersive" } },
          { variantId: "v4", allocationPercent: 20, parameters: { mode: "contextual" } },
          { variantId: "v5", allocationPercent: 20, parameters: { mode: "assistive" } },
        ],
      },
      outcomes: [
        {
          variantId: "v1",
          reentryRate: 0.4,
          interactionCompletionRate: 0.85,
          abandonmentRate: 0.1,
          degradedRate: 0.05,
          readingFlowScore: 0.8,
        },
        {
          variantId: "v2",
          reentryRate: 0.5,
          interactionCompletionRate: 0.4,
          abandonmentRate: 0.48,
          degradedRate: 0.22,
          readingFlowScore: 0.3,
        },
      ],
    });

    assert.equal(report.safeToContinue, false);
    assert.equal(report.guardrailFindings.includes("possible_hidden_product_fork"), true);
    assert.equal(report.guardrailFindings.includes("continuity_or_flow_confusion_risk"), true);
  });
});
