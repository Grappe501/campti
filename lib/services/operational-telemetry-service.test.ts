import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createTelemetryEvent,
  getTelemetrySnapshot,
  recordTelemetryEvent,
  resetOperationalTelemetryForTests,
} from "@/lib/services/operational-telemetry-service";

describe("operational-telemetry-service", () => {
  it("records structured telemetry events with deterministic classification", () => {
    resetOperationalTelemetryForTests();
    const event = createTelemetryEvent({
      eventId: "evt-1",
      eventType: "mode_change",
      sessionId: "session-1",
      readerIdHash: "reader-hash-1",
      atIso: "2026-04-15T10:00:00.000Z",
      payload: {
        mode: "immersive",
      },
    });
    const log = recordTelemetryEvent({
      source: "reader_client",
      event,
    });
    assert.equal(log.event.classification, "reader_behavior");
    assert.equal(log.event.observedStateOnly, true);
    const snapshot = getTelemetrySnapshot();
    assert.equal(snapshot.events.length, 1);
    assert.equal(snapshot.logEntries.length, 1);
  });

  it("rejects telemetry payloads containing forbidden narrative state keys", () => {
    resetOperationalTelemetryForTests();
    assert.throws(
      () =>
        createTelemetryEvent({
          eventId: "evt-2",
          eventType: "interaction_event",
          sessionId: "session-2",
          readerIdHash: "reader-hash-2",
          atIso: "2026-04-15T11:00:00.000Z",
          payload: {
            canonicalStoryState: "spoiler",
          },
        }),
      /Forbidden narrative payload keys/
    );
  });
});
