/**
 * Degraded interaction policy resolution.
 * Run: npx tsx --test lib/services/degraded-interaction-policy-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDegradedInteractionPolicy } from "@/lib/services/degraded-interaction-policy-service";

describe("resolveDegradedInteractionPolicy", () => {
  it("maps schema_missing to allow_read_only", () => {
    const out = resolveDegradedInteractionPolicy({
      unavailableReason: "schema_missing",
      readerEntitlement: "standard",
      environment: "production",
    });
    assert.equal(out, "allow_read_only");
  });

  it("maps provider_failure to allow_system_fallback_only", () => {
    const out = resolveDegradedInteractionPolicy({
      unavailableReason: "provider_failure",
      readerEntitlement: "standard",
      environment: "production",
    });
    assert.equal(out, "allow_system_fallback_only");
  });

  it("defaults unknown unavailability to entitlement-based blocking in production", () => {
    const out = resolveDegradedInteractionPolicy({
      unavailableReason: "unknown_runtime_unavailable",
      readerEntitlement: "standard",
      environment: "production",
    });
    assert.equal(out, "blocked_all");
  });

  it("allows limited free turns for non-production admin only", () => {
    const dev = resolveDegradedInteractionPolicy({
      unavailableReason: "unknown_runtime_unavailable",
      readerEntitlement: "admin",
      environment: "development",
    });
    const prod = resolveDegradedInteractionPolicy({
      unavailableReason: "unknown_runtime_unavailable",
      readerEntitlement: "admin",
      environment: "production",
    });
    assert.equal(dev, "allow_limited_free_turns");
    assert.equal(prod, "blocked_all");
  });
});
