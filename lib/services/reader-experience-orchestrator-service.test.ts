import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapGatedBy } from "@/lib/services/reader-experience-orchestrator-service";

describe("reader-experience-orchestrator-service", () => {
  it("marks degraded hard policies as degraded-policy gated", () => {
    assert.equal(
      mapGatedBy({
        entitlementPlan: "premium",
        degradedPolicy: "allow_read_only",
      }),
      "degraded_policy"
    );
  });

  it("marks free-tier degraded access as entitlement gated", () => {
    assert.equal(
      mapGatedBy({
        entitlementPlan: "free",
        degradedPolicy: "allow_limited_free_turns",
      }),
      "entitlement"
    );
  });
});
