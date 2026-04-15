import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeDegradedInteractionState } from "@/lib/services/degraded-interaction-observability-service";

describe("summarizeDegradedInteractionState", () => {
  it("surfaces read-only degraded mode from metadata", () => {
    const out = summarizeDegradedInteractionState({
      degradedInteraction: {
        currentPolicy: "allow_read_only",
        unavailableReason: "schema_missing",
        freeTurnCount: 0,
        lastTurnUsedDegradedFallback: false,
      },
    });
    assert.equal(out.currentPolicy, "allow_read_only");
    assert.equal(out.unavailableReason, "schema_missing");
    assert.equal(out.lastTurnUsedDegradedFallback, false);
    assert.equal(out.lastFallbackCause, null);
  });

  it("surfaces fallback-only degraded mode and fallback usage", () => {
    const out = summarizeDegradedInteractionState({
      degradedInteraction: {
        currentPolicy: "allow_system_fallback_only",
        unavailableReason: "provider_failure",
        freeTurnCount: 1,
        lastTurnUsedDegradedFallback: true,
        lastFallbackCause: "provider_resilience",
      },
    });
    assert.equal(out.currentPolicy, "allow_system_fallback_only");
    assert.equal(out.unavailableReason, "provider_failure");
    assert.equal(out.lastTurnUsedDegradedFallback, true);
    assert.equal(out.lastFallbackCause, "provider_resilience");
  });

  it("surfaces freeTurnCount with stable defaulting", () => {
    const withCount = summarizeDegradedInteractionState({
      degradedInteraction: {
        currentPolicy: "allow_limited_free_turns",
        unavailableReason: "unknown_runtime_unavailable",
        freeTurnCount: 7,
        lastTurnUsedDegradedFallback: true,
      },
    });
    assert.equal(withCount.freeTurnCount, 7);

    const withoutMetadata = summarizeDegradedInteractionState({});
    assert.equal(withoutMetadata.freeTurnCount, 0);
    assert.equal(withoutMetadata.currentPolicy, null);
    assert.equal(withoutMetadata.lastFallbackCause, null);
  });
});
