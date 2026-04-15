import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateStoryHealth } from "@/lib/services/story-health-monitoring-service";

describe("story-health-monitoring-service", () => {
  it("detects watch/critical conditions from usage and coherence signals", () => {
    const health = evaluateStoryHealth({
      manuscriptId: "man-1",
      chapterCompletions: 6,
      chapterStarts: 10,
      reentryEvents: 8,
      sessionsObserved: 10,
      abandonedInteractions: 5,
      interactionEvents: 10,
      coherenceFindings: [
        {
          findingId: "pressure-1",
          category: "pacing",
          severity: "moderate",
          message: "Pressure drift risk",
        },
      ],
    });
    assert.equal(health.manuscriptId, "man-1");
    assert.equal(health.healthStatus, "critical");
    assert.equal(health.coherenceWarnings.length, 1);
  });
});
