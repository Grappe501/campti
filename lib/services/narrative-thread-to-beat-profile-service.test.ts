import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { NarrativeThreadToBeatProfileService } from "@/lib/services/narrative-thread-to-beat-profile-service";

function buildStateForRecommendation() {
  return deriveChapterState({
    chapterId: "book1-chapter-01",
    bookId: "book1",
    sequenceNumber: 1,
    era: "Red River settlements",
    timePosition: "opening pressure turn",
    locationProfile: "natchitoches household",
    seasonPhase: "late-planting",
    progressionPhase: "phase_a",
    povWeightingCandidates: [{ characterId: "natchitoches-matriarch-keeper", weight: 0.8, rationale: "continuity lead" }],
    axisInputs: {
      environmental_stability: { score: 62, direction: "falling", rationale: "river drift" },
      food_security: { score: 64, direction: "falling", rationale: "store uncertainty" },
      social_cohesion: { score: 66, direction: "falling", rationale: "stress under speech" },
      external_awareness: { score: 58, direction: "rising", rationale: "route awareness" },
      memory_continuity: { score: 78, direction: "flat", rationale: "memory stable" },
      identity_stability: { score: 67, direction: "falling", rationale: "identity pressure" },
      labor_pressure: { score: 61, direction: "rising", rationale: "labor pressure" },
      signal_integrity: { score: 48, direction: "falling", rationale: "signal noise" },
      decision_pressure: { score: 59, direction: "rising", rationale: "decision pressure" },
      movement_pressure: { score: 53, direction: "rising", rationale: "movement pressure" },
      relational_heat: { score: 57, direction: "rising", rationale: "relational heat" },
      meaning_load: { score: 62, direction: "rising", rationale: "meaning load" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 80 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "storage", strength: 48 }],
    sourceBasis: ["test"],
  });
}

describe("narrative-thread-to-beat-profile-service", () => {
  it("derives thread-aware beat influence", () => {
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const result = new NarrativeThreadToBeatProfileService().deriveInfluence({
      chapterId: "book1-chapter-01",
      threads,
    });
    assert.equal(result.emphasisNotes.length > 0, true);
    assert.equal(result.beatWeightBias.meaning_trace_beat > 0, true);
  });

  it("merges thread influence into chapter beat recommendation", () => {
    const chapterState = buildStateForRecommendation();
    const recommendation = deriveBeatProfileRecommendation(chapterState);
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const service = new NarrativeThreadToBeatProfileService();
    const influence = service.deriveInfluence({ chapterId: chapterState.chapterId, threads });
    const merged = service.mergeWithRecommendation({ recommendation, threadInfluence: influence, scale: 0.3 });
    assert.equal(merged.topWeightedBeatTypes.length, recommendation.topWeightedBeatTypes.length);
    assert.equal(merged.transitionBiasNotes.length >= recommendation.transitionBiasNotes.length, true);
  });
});
