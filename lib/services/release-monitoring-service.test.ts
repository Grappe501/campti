import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildReleaseHealth } from "@/lib/services/deployment-commercial-layer-service";

describe("release-monitoring", () => {
  it("builds actionable release health summaries", () => {
    const health = buildReleaseHealth({
      healthId: "health-1",
      releaseVersion: "v1",
      deploymentEnvironment: "staging",
      signals: [
        {
          signalId: "signal-1",
          kind: "rollout_anomaly",
          severity: "high",
          details: "Error spike detected.",
        },
      ],
    });
    assert.equal(health.actionabilitySummary.length, 1);
    assert.equal(health.actionabilitySummary[0].includes("rollout_anomaly"), true);
  });
});
