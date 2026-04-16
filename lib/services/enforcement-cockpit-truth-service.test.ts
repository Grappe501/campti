/**
 * Cluster 2 — cockpit enforcement truth. Run: npx tsx --test lib/services/enforcement-cockpit-truth-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import {
  AUTHOR_COCKPIT_PANEL_TO_SUBSYSTEM,
  buildCockpitEnforcementSemanticTruth,
  collectPopulatedAuthorCockpitPanelKeys,
} from "@/lib/services/enforcement-cockpit-truth-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import {
  RUNTIME_ID_BOOK1_REGENERATION,
  RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
} from "@/lib/services/runtime-authority-registry-service";

describe("enforcement-cockpit-truth-service", () => {
  it("maps every cockpit panel key to a subsystem id", () => {
    const keys = Object.keys(AUTHOR_COCKPIT_PANEL_TO_SUBSYSTEM);
    assert.ok(keys.includes("beatAssembly"));
    for (const k of keys) {
      assert.ok(AUTHOR_COCKPIT_PANEL_TO_SUBSYSTEM[k]?.length);
    }
  });

  it("collectPopulatedAuthorCockpitPanelKeys lists only present panels", () => {
    const keys = collectPopulatedAuthorCockpitPanelKeys({
      beatAssembly: { x: 1 },
      chapterState: { y: 2 },
    });
    assert.deepEqual(keys.sort(), ["beatAssembly", "chapterState"].sort());
  });

  it("buildCockpitEnforcementSemanticTruth flags non-canonical cockpit runtime", () => {
    const truth = buildCockpitEnforcementSemanticTruth({
      runtimeId: RUNTIME_ID_BOOK1_REGENERATION,
      populatedPanelKeys: ["beatAssembly"],
    });
    assert.equal(truth.cockpitBundleObservationalOnly, true);
    assert.ok(truth.globalWarnings.some((w) => w.includes("cockpit_runtime_non_canonical")));
  });

  it("author cockpit bundle includes enforcement semantic truth for populated panels", () => {
    const bundle = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "c1" }),
      metrics: { chapterReadiness: 0.5 },
      beatAssembly: {
        chapter: 1,
        beatCount: 2,
        validationPassed: true,
        highestPressureLoad: 0.5,
        salienceCoverage: 1,
        memoryLinkedBeats: 1,
        socialFeedbackBeats: 0,
        meaningTraceBeats: 0,
        summaryLine: "ok",
      },
    });
    assert.ok(bundle.enforcementSemanticTruth);
    assert.equal(bundle.enforcementSemanticTruth?.cockpitBundleObservationalOnly, true);
    assert.ok(bundle.enforcementSemanticTruth?.panelTruth.some((p) => p.panelKey === "beatAssembly"));
  });
});
