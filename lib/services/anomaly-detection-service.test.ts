import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectOperationalAnomalies } from "@/lib/services/anomaly-detection-service";

describe("anomaly-detection-service", () => {
  it("detects actionable anomalies with explainable rule output", () => {
    const anomalies = detectOperationalAnomalies({
      metrics: [
        {
          metric: "drop_off_spike",
          current: 0.42,
          baseline: 0.14,
          thresholdMultiplier: 1.5,
          likelyCauseHints: ["mode-switch friction", "entry/reentry mismatch"],
          explanation: "Drop-off rate increased materially compared to baseline behavior.",
        },
      ],
    });
    assert.equal(anomalies.length, 1);
    assert.equal(anomalies[0]?.severity, "critical");
    assert.equal(anomalies[0]?.nonOmniscient, true);
    assert.equal(anomalies[0]?.explainableRule.includes("ratio"), true);
  });
});
