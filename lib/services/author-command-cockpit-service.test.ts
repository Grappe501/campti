import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";

describe("author-command-cockpit-service", () => {
  it("builds bounded cockpit bundle with contextual actions", () => {
    const bundle = buildAuthorCommandCockpitBundle({
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "chapter-1" }),
      labels: { chapterLabel: "Chapter One" },
      metrics: {
        chapterProgressionState: 0.7,
        contradictionRisk: 0.6,
        chapterReadiness: 0.5,
      },
      beatAssembly: {
        chapter: 1,
        beatCount: 10,
        validationPassed: true,
        highestPressureLoad: 0.76,
        salienceCoverage: 1,
        memoryLinkedBeats: 10,
        socialFeedbackBeats: 2,
        meaningTraceBeats: 1,
        summaryLine: "Order-under-pressure chain active.",
      },
      chapterState: {
        chapterId: "book1-chapter-01",
        chapterMode: "continuity_chapter",
        dominantPressures: ["labor_pressure", "signal_integrity"],
        suppressedPressures: ["movement_pressure"],
        movementPressure: 14,
        decisionPressure: 34,
        meaningLoad: 26,
        allowedMeaningIntensity: "guarded",
        validationPassed: true,
        riskFlags: [],
        summaryLine: "Continuity still leads, but pressure readability has softened.",
      },
    });

    assert.equal(bundle.context.scope, "chapter");
    assert.equal(bundle.bounded, true);
    assert.equal(bundle.explainable, true);
    assert.equal(bundle.availableActions.includes("escalate_scope"), true);
    assert.equal(bundle.indicatorBank.scope, "chapter");
    assert.equal(bundle.beatAssembly?.beatCount, 10);
    assert.equal(bundle.chapterState?.chapterId, "book1-chapter-01");
  });
});
