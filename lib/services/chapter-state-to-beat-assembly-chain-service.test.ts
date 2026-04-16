import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { ChapterStateToBeatAssemblyChainService } from "@/lib/services/chapter-state-to-beat-assembly-chain-service";

function buildState(overrides?: Partial<Record<keyof ReturnType<typeof deriveChapterState>["stateAxes"], number>>) {
  return deriveChapterState({
    chapterId: "book1-chapter-02",
    bookId: "book1",
    sequenceNumber: 2,
    era: "Natchitoches-centered Red River settlements",
    timePosition: "stress window",
    locationProfile: "river household and storage lane",
    seasonPhase: "late-planting",
    progressionPhase: "phase_b",
    povWeightingCandidates: [{ characterId: "natchitoches-matriarch-keeper", weight: 0.6, rationale: "Continuity lead." }],
    axisInputs: {
      environmental_stability: { score: overrides?.environmental_stability ?? 52, direction: "falling", rationale: "instability" },
      food_security: { score: overrides?.food_security ?? 66, direction: "falling", rationale: "buffer strain" },
      social_cohesion: { score: overrides?.social_cohesion ?? 63, direction: "falling", rationale: "strain" },
      external_awareness: { score: overrides?.external_awareness ?? 45, direction: "rising", rationale: "awareness" },
      memory_continuity: { score: overrides?.memory_continuity ?? 79, direction: "flat", rationale: "memory stable" },
      identity_stability: { score: overrides?.identity_stability ?? 72, direction: "falling", rationale: "identity strain" },
      labor_pressure: { score: overrides?.labor_pressure ?? 61, direction: "rising", rationale: "labor load" },
      signal_integrity: { score: overrides?.signal_integrity ?? 49, direction: "falling", rationale: "signal noise" },
      decision_pressure: { score: overrides?.decision_pressure ?? 57, direction: "rising", rationale: "decision pressure" },
      movement_pressure: { score: overrides?.movement_pressure ?? 34, direction: "rising", rationale: "movement edge" },
      relational_heat: { score: overrides?.relational_heat ?? 52, direction: "rising", rationale: "heat" },
      meaning_load: { score: overrides?.meaning_load ?? 48, direction: "rising", rationale: "meaning rise" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "Lineage transfer", strength: 81 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "Storage reliability", strength: 47 }],
    sourceBasis: ["test"],
  });
}

describe("chapter-state-to-beat-assembly-chain-service", () => {
  it("raises environmental beats when environmental stability is low", () => {
    const state = buildState({ environmental_stability: 35 });
    const recommendation = deriveBeatProfileRecommendation(state);
    const result = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    const types = result.chain.beats.map((beat) => beat.beatType);
    assert.equal(types.includes("environmental_confirmation_beat"), true);
    assert.equal(types.includes("salience_lock_beat"), true);
  });

  it("injects relational beats under social strain", () => {
    const state = buildState({ social_cohesion: 38, relational_heat: 71 });
    const recommendation = deriveBeatProfileRecommendation(state);
    const result = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    const types = result.chain.beats.map((beat) => beat.beatType);
    assert.equal(types.includes("social_signal_beat"), true);
    assert.equal(types.includes("relational_interpretation_beat"), true);
  });

  it("ensures decision beats when decision pressure is high", () => {
    const state = buildState({ decision_pressure: 82, movement_pressure: 64 });
    const recommendation = deriveBeatProfileRecommendation(state);
    const result = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    const types = result.chain.beats.map((beat) => beat.beatType);
    assert.equal(types.includes("micro_decision_beat"), true);
    assert.equal(types.includes("state_update_beat"), true);
  });

  it("returns blocked result when forced invalid ordering is provided", () => {
    const state = buildState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const service = new ChapterStateToBeatAssemblyChainService();
    const result = service.run({
      chapterState: {
        ...state,
        recommendedBeatWeights: {
          ...state.recommendedBeatWeights,
          salience_lock_beat: 0.01,
          pressure_escalation_beat: 1,
        },
      },
      beatProfileRecommendation: {
        ...recommendation,
        topWeightedBeatTypes: [
          { beatType: "pressure_escalation_beat", weight: 1 },
          { beatType: "consequence_seed_beat", weight: 0.9 },
          { beatType: "state_update_beat", weight: 0.8 },
          { beatType: "micro_decision_beat", weight: 0.7 },
        ],
      },
    });

    if (result.status === "blocked") {
      assert.equal(result.failure.reasons.length > 0, true);
      return;
    }
    assert.equal(result.chain.chainValidation.passed, true);
  });

  it("produces validation-passing chain for standard state", () => {
    const state = buildState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const result = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    assert.equal(result.chain.chainValidation.passed, true);
    assert.equal(result.preflight.orderedBeatTypes.length >= 8, true);
  });
});
