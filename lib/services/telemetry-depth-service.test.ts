import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createDeepTelemetryEvent,
  recordDeepTelemetryEvent,
  resetDeepTelemetryForTests,
  summarizeTelemetryDepthCoverage,
} from "@/lib/services/telemetry-depth-service";

describe("telemetry-depth-service", () => {
  it("captures deep telemetry with taxonomy, tags and correlation ids", () => {
    resetDeepTelemetryForTests();
    const event = createDeepTelemetryEvent({
      eventId: "t-depth-1",
      taxonomyGroup: "entry",
      taxonomyEvent: "entry_started",
      sourceTag: "reader_client",
      surfaceTag: "reader_surface",
      atIso: "2026-04-15T10:00:00.000Z",
      correlation: {
        sessionId: "session-1",
        storyId: "story-1",
        bookId: "book-1",
        requestId: "req-1",
      },
      userSafeContext: {
        entryType: "reentry",
      },
    });
    recordDeepTelemetryEvent(event);

    const summary = summarizeTelemetryDepthCoverage([event]);
    assert.equal(summary.eventCount, 1);
    assert.equal(summary.byGroup.entry, 1);
    assert.equal(summary.bySource.reader_client, 1);
    assert.equal(summary.bySurface.reader_surface, 1);
    assert.equal(summary.correlatedSessions, 1);
  });

  it("rejects forbidden narrative context keys", () => {
    assert.throws(
      () =>
        createDeepTelemetryEvent({
          eventId: "t-depth-2",
          taxonomyGroup: "session",
          taxonomyEvent: "session_started",
          sourceTag: "orchestrator",
          surfaceTag: "internal_surface",
          atIso: "2026-04-15T10:01:00.000Z",
          correlation: {
            sessionId: "session-2",
            storyId: null,
            bookId: null,
            requestId: null,
          },
          userSafeContext: {
            canonicalState: "forbidden",
          },
        }),
      /forbidden telemetry context keys/
    );
  });
});
