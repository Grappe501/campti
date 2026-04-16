import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { NarrativeThreadToChapterStateService } from "@/lib/services/narrative-thread-to-chapter-state-service";

function buildChapterState() {
  return deriveChapterState({
    chapterId: "book1-chapter-01",
    bookId: "book1",
    sequenceNumber: 1,
    era: "Red River settlements",
    timePosition: "opening pressure turn",
    locationProfile: "natchitoches household",
    seasonPhase: "late-planting",
    progressionPhase: "phase_a",
    povWeightingCandidates: [{ characterId: "natchitoches-matriarch-keeper", weight: 0.7, rationale: "continuity anchor" }],
    axisInputs: {
      environmental_stability: { score: 64, direction: "falling", rationale: "riverline drift" },
      food_security: { score: 66, direction: "falling", rationale: "storage pressure" },
      social_cohesion: { score: 71, direction: "falling", rationale: "silent strain" },
      external_awareness: { score: 52, direction: "rising", rationale: "route rumors" },
      memory_continuity: { score: 80, direction: "flat", rationale: "memory authority holds" },
      identity_stability: { score: 68, direction: "falling", rationale: "identity pressure" },
      labor_pressure: { score: 62, direction: "rising", rationale: "workload rising" },
      signal_integrity: { score: 49, direction: "falling", rationale: "noisy cues" },
      decision_pressure: { score: 58, direction: "rising", rationale: "small choices matter" },
      movement_pressure: { score: 56, direction: "rising", rationale: "route stress" },
      relational_heat: { score: 54, direction: "rising", rationale: "contained tension" },
      meaning_load: { score: 60, direction: "rising", rationale: "meaning accumulation" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 78 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "storage", strength: 44 }],
    sourceBasis: ["test"],
  });
}

describe("narrative-thread-to-chapter-state-service", () => {
  it("derives thread influence and chapter-state activation recommendations", () => {
    const chapterState = buildChapterState();
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const result = new NarrativeThreadToChapterStateService().deriveInfluence({ chapterState, threads });
    assert.equal(result.influencedAxes.length > 0, true);
    assert.equal(result.recommendedActivations.some((row) => row.reason.includes("signal")), true);
  });

  it("projects continuity threads into chapter-state continuity lists", () => {
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const projection = new NarrativeThreadToChapterStateService().projectContinuityThreads(threads);
    assert.equal(projection.activeContinuityThreads.length > 0, true);
    assert.equal(projection.threatenedContinuityThreads.length >= 0, true);
  });
});
