/**
 * P4-F engagement analytics tests.
 * Run: npx tsx --test lib/services/engagement-analytics-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getEngagementAggregateForDate,
  recordSessionEnded,
  recordSessionStarted,
  recordTurnSubmitted,
  recordVoiceUsage,
  resetEngagementAnalyticsForTests,
} from "@/lib/services/engagement-analytics-service";

describe("engagement-analytics-service", () => {
  it("records session lifecycle and turn metrics", () => {
    resetEngagementAnalyticsForTests();
    const start = "2026-04-15T12:00:00.000Z";
    const end = "2026-04-15T12:02:30.000Z";
    recordSessionStarted({
      sessionId: "s-1",
      readerId: "reader-1",
      characterId: "char-1",
      atIso: start,
    });
    recordTurnSubmitted({ sessionId: "s-1", atIso: "2026-04-15T12:00:20.000Z" });
    recordTurnSubmitted({ sessionId: "s-1", atIso: "2026-04-15T12:01:10.000Z" });
    recordVoiceUsage({ sessionId: "s-1", atIso: "2026-04-15T12:01:12.000Z" });
    recordSessionEnded({
      sessionId: "s-1",
      dropOffPoint: "completed_session",
      atIso: end,
    });

    const out = getEngagementAggregateForDate("2026-04-15");
    assert.equal(out.sessionsStarted, 1);
    assert.equal(out.sessionsEnded, 1);
    assert.equal(out.turnsSubmitted, 2);
    assert.equal(out.voiceUsageCount, 1);
    assert.equal(out.uniqueCharactersInteracted, 1);
    assert.equal(out.averageSessionLengthSeconds, 150);
    assert.equal(out.dropOffCounts.completed_session, 1);
  });

  it("aggregates drop-off points without transcript content", () => {
    resetEngagementAnalyticsForTests();
    recordSessionStarted({
      sessionId: "s-2",
      readerId: "reader-2",
      characterId: "char-2",
      atIso: "2026-04-16T00:00:00.000Z",
    });
    recordSessionEnded({
      sessionId: "s-2",
      dropOffPoint: "before_first_turn",
      atIso: "2026-04-16T00:00:10.000Z",
    });
    const out = getEngagementAggregateForDate("2026-04-16");
    assert.equal(out.dropOffCounts.before_first_turn, 1);
    assert.equal("rawTranscript" in (out as Record<string, unknown>), false);
  });
});

