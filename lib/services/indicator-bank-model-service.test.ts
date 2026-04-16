import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildIndicatorBank } from "@/lib/services/indicator-bank-model-service";

describe("indicator-bank-model-service", () => {
  it("produces governed indicator bank for each scope", () => {
    const sceneBank = buildIndicatorBank({
      scope: "scene",
      metrics: { emotionalIntensity: 0.9, continuityRisk: 0.8 },
    });
    const chapterBank = buildIndicatorBank({
      scope: "chapter",
      metrics: { contradictionRisk: 0.7, chapterReadiness: 0.2 },
    });
    assert.equal(sceneBank.indicators.length >= 8, true);
    assert.equal(chapterBank.indicators.length >= 8, true);
    assert.equal(sceneBank.indicators.every((indicator) => indicator.source === "governed_state"), true);
  });
});
