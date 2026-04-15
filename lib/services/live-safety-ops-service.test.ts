import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeLiveSafetyOps } from "@/lib/services/live-safety-ops-service";

describe("live-safety-ops-service", () => {
  it("summarizes moderation escalation and degraded fallback metrics", () => {
    const summary = summarizeLiveSafetyOps({
      windowStartIso: "2026-04-15T00:00:00.000Z",
      windowEndIso: "2026-04-15T23:59:59.000Z",
      moderationEvents: [
        { violationId: "v-1", escalated: true, resolved: false },
        { violationId: "v-2", escalated: false, resolved: true },
      ],
      degradedEvents: [
        { fallbackTriggered: true, providerFailure: true },
        { fallbackTriggered: true, providerFailure: false },
      ],
    });

    assert.equal(summary.violationsTracked, 2);
    assert.equal(summary.escalationsTriggered, 1);
    assert.equal(summary.unresolvedEscalations, 1);
    assert.equal(summary.degradedFallbackFrequency, 2);
    assert.equal(summary.providerFailures, 1);
  });
});
