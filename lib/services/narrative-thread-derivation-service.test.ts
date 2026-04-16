import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";

describe("narrative-thread-derivation-service", () => {
  it("builds book1 sample thread pack with required architecture elements", () => {
    const pack = new NarrativeThreadDerivationService().buildBook1SampleThreadPack();
    const types = new Set(pack.threads.map((thread) => thread.threadType));
    assert.equal(types.has("primary_plot_thread"), true);
    assert.equal(types.has("route_thread"), true);
    assert.equal(types.has("philosophy_thread"), true);
    assert.equal(pack.chapterCompositions.length > 0, true);
    assert.equal(pack.delayedConvergenceEvents.length > 0, true);
    assert.equal(pack.reinterpretations.length > 0, true);
  });

  it("derives thread inspection payload for cockpit density analysis", () => {
    const service = new NarrativeThreadDerivationService();
    const pack = service.buildBook1SampleThreadPack();
    const inspection = service.deriveInspection({
      chapterId: "book1-chapter-01",
      threads: pack.threads,
      chapterComposition: pack.chapterCompositions[0],
      reinterpretations: pack.reinterpretations,
      delayedConvergenceEvents: pack.delayedConvergenceEvents,
    });
    assert.equal(inspection.sceneDensity.length > 0, true);
    assert.equal(inspection.reinterpretationCandidates.length > 0, true);
  });
});
