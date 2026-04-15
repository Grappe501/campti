/**
 * P4-C provider cost governance tests.
 * Run: npx tsx --test lib/services/provider-cost-governance-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateProviderCostGovernance,
  recordProviderCostUsage,
  resetProviderCostGovernanceStateForTests,
} from "@/lib/services/provider-cost-governance-service";

describe("provider-cost-governance-service", () => {
  it("allows projected usage within limits", () => {
    resetProviderCostGovernanceStateForTests();
    const out = evaluateProviderCostGovernance({
      readerId: "reader-a",
      sessionId: "session-a",
      projectedTextCostUnits: 100,
      projectedVoiceCostUnits: 20,
    });
    assert.equal(out.allowed, true);
    assert.equal(out.denyReason, null);
  });

  it("enforces session cost ceilings", () => {
    resetProviderCostGovernanceStateForTests();
    process.env.PROVIDER_COST_MAX_SESSION_UNITS = "100";
    recordProviderCostUsage({
      readerId: "reader-a",
      sessionId: "session-a",
      costUnits: 95,
      category: "text",
    });
    const out = evaluateProviderCostGovernance({
      readerId: "reader-a",
      sessionId: "session-a",
      projectedTextCostUnits: 10,
    });
    assert.equal(out.allowed, false);
    assert.equal(out.degradeToFallback, true);
    assert.equal(out.denyReason, "max_session_cost_exceeded");
    delete process.env.PROVIDER_COST_MAX_SESSION_UNITS;
  });

  it("tracks voice and text costs separately", () => {
    resetProviderCostGovernanceStateForTests();
    process.env.PROVIDER_COST_MAX_VOICE_DAILY_UNITS = "50";
    recordProviderCostUsage({
      readerId: "reader-a",
      sessionId: "session-a",
      costUnits: 40,
      category: "voice",
    });
    const out = evaluateProviderCostGovernance({
      readerId: "reader-a",
      projectedVoiceCostUnits: 20,
    });
    assert.equal(out.allowed, false);
    assert.equal(out.denyReason, "max_voice_daily_cost_exceeded");
    delete process.env.PROVIDER_COST_MAX_VOICE_DAILY_UNITS;
  });
});

