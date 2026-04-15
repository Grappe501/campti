/**
 * P4-H background maintenance tests.
 * Run: npx tsx --test lib/services/background-maintenance-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { recordSessionEnded, recordSessionStarted } from "@/lib/services/engagement-analytics-service";
import { aggregateEngagementForDate } from "@/lib/services/background-maintenance-service";

describe("background-maintenance-service", () => {
  it("aggregates engagement metrics for a specific date", async () => {
    recordSessionStarted({
      sessionId: "bg-1",
      readerId: "reader",
      characterId: "char",
      atIso: "2026-04-18T00:00:00.000Z",
    });
    recordSessionEnded({
      sessionId: "bg-1",
      dropOffPoint: "completed_session",
      atIso: "2026-04-18T00:01:00.000Z",
    });
    const out = await aggregateEngagementForDate("2026-04-18");
    assert.equal(out.date, "2026-04-18");
    assert.ok(out.sessionsStarted >= 1);
    assert.ok(out.sessionsEnded >= 1);
  });
});

