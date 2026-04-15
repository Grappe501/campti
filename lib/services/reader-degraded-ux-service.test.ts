import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveUnifiedDegradedUxState } from "@/lib/services/reader-degraded-ux-service";

describe("reader-degraded-ux-service", () => {
  it("maps provider failure into unified degraded state", () => {
    const out = resolveUnifiedDegradedUxState({
      cockpit: {
        degradedInteraction: {
          currentPolicy: "allow_system_fallback_only",
          unavailableReason: "provider_failure",
          freeTurnCount: 0,
          lastTurnUsedDegradedFallback: false,
        },
      } as never,
    });
    assert.equal(out.state, "provider_failure");
  });

  it("maps moderation errors into a bounded warning", () => {
    const out = resolveUnifiedDegradedUxState({
      cockpit: null,
      lastErrorMessage: "[session_invalid] Session ended due to safety policy.",
    });
    assert.equal(out.state, "moderation_block");
  });
});
