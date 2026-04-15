import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TelemetryEvent } from "@/lib/domain/operational-telemetry";
import { summarizeReaderBehavior } from "@/lib/services/reader-behavior-analytics-service";

function telemetryEvent(overrides: Partial<TelemetryEvent>): TelemetryEvent {
  return {
    contractVersion: "1",
    eventId: "evt-default",
    eventType: "session_lifecycle",
    classification: "session_operations",
    sessionId: "session-1",
    readerIdHash: "reader-hash",
    atIso: "2026-04-15T12:00:00.000Z",
    payload: {},
    observedStateOnly: true,
    ...overrides,
  };
}

describe("reader-behavior-analytics-service", () => {
  it("aggregates session duration, interaction and reentry metrics", () => {
    const events: TelemetryEvent[] = [
      telemetryEvent({
        eventId: "evt-1",
        eventType: "session_lifecycle",
        payload: { phase: "started" },
        atIso: "2026-04-15T12:00:00.000Z",
      }),
      telemetryEvent({
        eventId: "evt-2",
        eventType: "mode_change",
        classification: "reader_behavior",
        payload: { mode: "immersive" },
      }),
      telemetryEvent({
        eventId: "evt-3",
        eventType: "interaction_event",
        classification: "interaction_runtime",
        payload: { outcome: "completed" },
      }),
      telemetryEvent({
        eventId: "evt-4",
        eventType: "reentry_event",
        classification: "reentry_continuity",
      }),
      telemetryEvent({
        eventId: "evt-5",
        eventType: "session_lifecycle",
        payload: { phase: "ended" },
        atIso: "2026-04-15T12:02:00.000Z",
      }),
    ];

    const summary = summarizeReaderBehavior({ dateKey: "2026-04-15", events });
    assert.equal(summary.sessionsObserved, 1);
    assert.equal(summary.averageSessionDurationSeconds, 120);
    assert.equal(summary.interactionsPerSession, 1);
    assert.equal(summary.reentryRate, 1);
    assert.equal(summary.modeUsage.immersive, 1);
    assert.equal(summary.containsSensitiveInference, false);
  });
});
