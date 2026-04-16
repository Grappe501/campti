import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { NarrativePsychologyDerivationService } from "@/lib/services/narrative-psychology-derivation-service";
import { ChapterStateToBeatAssemblyChainService } from "@/lib/services/chapter-state-to-beat-assembly-chain-service";
import { ProseGenerationConstraintDerivationService } from "@/lib/services/prose-generation-constraint-derivation-service";
import { ProseGenerationOutputPathService } from "@/lib/services/prose-generation-output-path-service";
import { ProseGenerationValidationService } from "@/lib/services/prose-generation-validation-service";

function sampleState() {
  return deriveChapterState({
    chapterId: "book1-chapter-01",
    bookId: "book1",
    sequenceNumber: 1,
    era: "Natchitoches-centered Red River settlements",
    timePosition: "opening",
    locationProfile: "river yard",
    seasonPhase: "late planting",
    progressionPhase: "phase_a",
    povWeightingCandidates: [{ characterId: "natchitoches-matriarch-keeper", weight: 0.6, rationale: "continuity lead" }],
    axisInputs: {
      environmental_stability: { score: 72, direction: "falling", rationale: "subtle drift" },
      food_security: { score: 74, direction: "falling", rationale: "stores hold" },
      social_cohesion: { score: 71, direction: "falling", rationale: "quiet pressure" },
      external_awareness: { score: 36, direction: "rising", rationale: "edge signs" },
      memory_continuity: { score: 84, direction: "flat", rationale: "lineage memory" },
      identity_stability: { score: 79, direction: "falling", rationale: "early strain" },
      labor_pressure: { score: 51, direction: "rising", rationale: "load increase" },
      signal_integrity: { score: 61, direction: "falling", rationale: "soft mismatch" },
      decision_pressure: { score: 43, direction: "rising", rationale: "local decisions matter" },
      movement_pressure: { score: 18, direction: "rising", rationale: "still low" },
      relational_heat: { score: 39, direction: "rising", rationale: "contained strain" },
      meaning_load: { score: 34, direction: "rising", rationale: "implicit meaning" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 84 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "storage", strength: 43 }],
    sourceBasis: ["test"],
  });
}

describe("prose generation constraints layer", () => {
  it("derives prose constraints from psychology + chapter state + beat chain", () => {
    const state = sampleState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const beatResult = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(beatResult.status, "ready");
    if (beatResult.status !== "ready") return;
    const chapterPsych = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const constraints = new ProseGenerationConstraintDerivationService().derive({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
    });
    assert.equal(constraints.artifact, "prose_generation_constraints");
    assert.equal(constraints.parentBeatChainId, beatResult.chain.artifact);
  });

  it("hard-fails modern cognition drift and omniscient leakage", () => {
    const state = sampleState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const beatResult = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(beatResult.status, "ready");
    if (beatResult.status !== "ready") return;
    const chapterPsych = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const constraints = new ProseGenerationConstraintDerivationService().derive({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
    });
    const validation = new ProseGenerationValidationService().validate({
      constraints,
      beatChain: beatResult.chain,
      proseBySegment: [
        "She felt anxious about what it meant and everyone knew the whole settlement was doomed.",
        "Historically, this region always collapsed under this kind of pressure.",
      ],
    });
    assert.equal(validation.passed, false);
    assert.equal(validation.hardFailureCount >= 2, true);
  });

  it("returns soft warnings for weak immersion and weak carry-forward", () => {
    const state = sampleState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const beatResult = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(beatResult.status, "ready");
    if (beatResult.status !== "ready") return;
    const chapterPsych = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const constraints = new ProseGenerationConstraintDerivationService().derive({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
    });
    const validation = new ProseGenerationValidationService().validate({
      constraints,
      beatChain: beatResult.chain,
      proseBySegment: ["They talked and agreed.", "Everything resolved completely."],
    });
    assert.equal(validation.softFailureCount >= 1, true);
  });

  it("produces compliant constrained sample output path", () => {
    const state = sampleState();
    const recommendation = deriveBeatProfileRecommendation(state);
    const beatResult = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(beatResult.status, "ready");
    if (beatResult.status !== "ready") return;
    const chapterPsych = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const constraints = new ProseGenerationConstraintDerivationService().derive({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
    });
    const outputPath = new ProseGenerationOutputPathService().runConstrainedOutputPath({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
      proseConstraints: constraints,
    });
    assert.equal(outputPath.artifact, "prose_generation_output_path_report");
    assert.equal(outputPath.generatedParagraphs.length >= 2, true);
    assert.equal(typeof outputPath.validation.passed, "boolean");
  });
});
