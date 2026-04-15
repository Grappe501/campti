import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createCrossStoryContinuity,
  projectCrossStoryContinuity,
} from "@/lib/services/cross-story-continuity-service";

describe("cross-story-continuity-service", () => {
  it("defaults continuity to disabled and empty", () => {
    const continuity = createCrossStoryContinuity({ readerId: "reader-1" });
    assert.equal(continuity.enabled, false);
    assert.deepEqual(continuity.nonCanonicalSignals, {});
  });

  it("rejects canonical carryover events", () => {
    assert.throws(() =>
      createCrossStoryContinuity({
        readerId: "reader-1",
        enabled: true,
        canonicalCarryoverEvents: ["event-1"],
      })
    );
  });

  it("projects non-canonical continuity to a story", () => {
    const continuity = createCrossStoryContinuity({
      readerId: "reader-1",
      enabled: true,
      nonCanonicalSignals: { pacing_hint: "slow_down" },
    });
    const projection = projectCrossStoryContinuity({
      continuity,
      storyId: "story-1",
    });
    assert.equal(projection.continuityApplied, true);
    assert.deepEqual(projection.signalKeys, ["pacing_hint"]);
  });
});
