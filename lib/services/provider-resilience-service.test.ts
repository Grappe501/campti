/**
 * P4-D provider resilience tests.
 * Run: npx tsx --test lib/services/provider-resilience-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  executeWithProviderResilience,
  getProviderResilienceSnapshot,
  resetProviderResilienceStateForTests,
} from "@/lib/services/provider-resilience-service";

describe("provider-resilience-service", () => {
  it("returns normal operation output without fallback", async () => {
    resetProviderResilienceStateForTests();
    const out = await executeWithProviderResilience({
      kind: "llm",
      operation: async () => "ok",
      fallback: async () => "fallback",
      maxRetries: 0,
    });
    assert.equal(out.value, "ok");
    assert.equal(out.usedFallback, false);
    assert.equal(out.retries, 0);
  });

  it("falls back after retries are exhausted", async () => {
    resetProviderResilienceStateForTests();
    const out = await executeWithProviderResilience({
      kind: "voice",
      operation: async () => {
        throw new Error("provider_down");
      },
      fallback: async () => "stub",
      maxRetries: 1,
      baseBackoffMs: 1,
    });
    assert.equal(out.value, "stub");
    assert.equal(out.usedFallback, true);
    assert.equal(out.retries, 1);
  });

  it("updates provider snapshot when degraded/fallback occurs", async () => {
    resetProviderResilienceStateForTests();
    await executeWithProviderResilience({
      kind: "payment",
      operation: async () => {
        throw new Error("payment_timeout");
      },
      fallback: async () => ({ ok: false }),
      maxRetries: 0,
    });
    const snap = getProviderResilienceSnapshot();
    assert.equal(snap.payment, "degraded");
    assert.ok(typeof snap.lastUpdatedAtIso === "string");
  });
});

