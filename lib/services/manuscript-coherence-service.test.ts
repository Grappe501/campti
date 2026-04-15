import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateManuscriptCoherence } from "@/lib/services/manuscript-coherence-service";

describe("manuscript-coherence-service", () => {
  it("fails coherence with high contradiction and high brittleness", () => {
    const report = evaluateManuscriptCoherence({
      manuscriptId: "book-1",
      findings: [
        {
          findingId: "brittleness:ch2-transition",
          category: "chapter_to_chapter_continuity",
          severity: "high",
          message: "Chapter 2 exits without resolving required burden.",
        },
        {
          findingId: "contradiction:arc-lifecycle",
          category: "contradiction",
          severity: "high",
          message: "Arc marked resolved and escalating in consecutive chapters.",
        },
      ],
    });
    assert.equal(report.coherencePass, false);
    assert.equal(report.chapterBrittlenessRisk, "high");
  });

  it("passes coherence when only low/moderate findings remain", () => {
    const report = evaluateManuscriptCoherence({
      manuscriptId: "book-1",
      findings: [
        {
          findingId: "pressure:minor-balance",
          category: "pacing",
          severity: "moderate",
          message: "Pressure spike in chapter 7 is steep but recoverable.",
        },
      ],
    });
    assert.equal(report.coherencePass, true);
    assert.equal(report.pressureDriftRisk, "moderate");
  });
});
