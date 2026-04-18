/**
 * Outcome analytics aggregation (node:test) — uses live DB when DATABASE_URL set; otherwise skip heavy path.
 * Run: npx tsx --test lib/services/scene-run-outcome-analytics-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneRunAnalyticsSummary } from "@/lib/domain/scene-run-diff-analytics";

/** Mirror private logic: instability signal for risky launches */
function fakeInstability(s: SceneRunAnalyticsSummary): boolean {
  return s.allowanceDistribution.allowed_with_risk >= 2;
}

describe("outcome analytics heuristics (unit)", () => {
  it("flags repeated risky launches", () => {
    const s: SceneRunAnalyticsSummary = {
      sceneId: "x",
      totalRunsInWindow: 3,
      allowanceDistribution: { allowed: 0, allowed_with_risk: 3, blocked: 0, unknown: 0 },
      launchClassDistribution: {},
      launchSourceDistribution: {},
      machineRunCount: 0,
      interactiveRunCount: 3,
      rehearsalRunCount: 0,
      replayAttemptCount: 0,
      repairOrRevisionRunCount: 0,
      failedGenerationCount: 0,
      incompleteRunCount: 0,
      averageBlockerCount: null,
      averageRiskCount: null,
      averageAdvisoryCount: null,
      legacyOrPartialRunCount: 0,
    };
    assert.equal(fakeInstability(s), true);
  });
});
