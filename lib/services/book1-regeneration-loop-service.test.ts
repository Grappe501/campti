import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1RegenerationLoopService } from "@/lib/services/book1-regeneration-loop-service";

function sampleInput() {
  return {
    chapterOutline: {
      chapter: 1,
      timeline: [
        {
          segment: 1,
          sceneFocus: "Opening terrain and latent pressure.",
          setting: "River settlements define movement.",
          characters: ["Alexis", "Augustin"],
          psychology: "fear versus duty",
          narrativePurpose: "anchor stakes",
          readerExperience: "immersive tension",
          foreshadowing: "future authority contest",
          historicalContext: "context",
          transitionToNext: "anomaly appears",
        },
      ],
    },
    chapterEvidencePack: {
      artifact: "chapter_evidence_pack",
      chapter: 1,
      evidence: [
        { evidenceId: "KN-1", statement: "River kinship order shapes duty.", inferredYear: 1670 },
        { evidenceId: "KN-2", statement: "Scarcity strains trust.", inferredYear: null },
      ],
    },
    chapterLaw: {
      artifact: "chapter_law",
      chapter: 1,
      chronologyInvariants: [{ id: "CI-1", rule: "No year over 1680.", enforcement: "reject" }],
      futureArcConstraints: [{ id: "FA-1", mustPreserve: "Pressure unresolved.", forbiddenResolution: "No final peace." }],
      compositionFirewall: {
        allowedInputs: ["chapter_law", "chapter_evidence_pack", "chapter_voice_spec.voiceCompliancePlan"],
        deniedInputs: ["raw_research"],
      },
    },
    chapterVoiceSpec: {
      artifact: "chapter_voice_spec",
      chapter: 1,
      voiceSpec: { dictionProfile: { prioritize: ["kinship"], avoid: ["meta"] } },
      voiceCompliancePlan: { thresholds: { maxMetaLanguageHits: 1, minSensoryGroundingHits: 1, minKinshipSignalHits: 1 } },
    },
    chapterCharacterHiddenHistories: {
      artifact: "chapter_character_hidden_histories",
      chapter: 1,
      characters: [
        { character: "Alexis", suppressedMotive: "preserve continuity", privateWound: "fear", futureArcHooks: ["hook-1"] },
      ],
    },
    chapterEpicSimulation: {
      artifact: "chapter_epic_simulation",
      chapter: 1,
      hiddenTimeline: [{ beatId: "H1", latentEvent: "anchor", futureArcConstraintLink: "link" }],
    },
    previousDraft: {
      chapter: 1,
      title: "Chapter 1 - River Oath",
      segmentDrafts: [
        {
          segment: 1,
          heading: "Movement 1",
          text: "Prior text.",
          compliance: { followsOutline: true, includesPsychologicalArc: true, includesHistoricalGrounding: true },
        },
      ],
      fullText: "Chapter 1 - River Oath\n\nPrior text.",
    },
    previousConsistencyReport: {
      artifact: "chapter_consistency_report",
      chronology: { passed: true, findings: [] },
      futureArc: { passed: true, findings: [] },
      firewall: { passed: true, findings: [] },
    },
    previousVoiceReport: {
      artifact: "chapter_voice_report",
      checks: [{ check: "x", passed: true, detail: "ok" }],
      passRate: 1,
    },
    previousGapReport: {
      artifact: "chapter_gap_report",
      missingInformation: [],
    },
    previousAdversarialSummary: {
      chapter: 1,
      severityTotals: { low: 0, medium: 0, high: 1, critical: 0 },
      critics: { proseShape: { findingCount: 1, criticalCount: 0 } },
      releaseDecision: "previous",
    },
    characterConsoleSession: {
      governancePolicy: { allowAnchorMutation: false },
      branchSandbox: { canonicalMutations: [{ mutationId: "M-1", targetKey: "alexis.state.fearWeight" }] },
      turns: [
        {
          proposedMutation: {
            mutationId: "M-1",
            mutationKind: "character_state",
            targetKey: "alexis.state.fearWeight",
            patch: { fearWeight: 0.8 },
            rationale: "retune",
            provenanceRefs: ["reports/book1-character-console-session.json#turns[2]"],
          },
        },
      ],
    },
    lawConsoleSession: {
      governancePolicy: { allowAnchorMutation: false },
      branchSandbox: { canonicalMutations: [{ actionId: "L-1" }, { actionId: "L-2" }] },
      actions: [
        {
          actionId: "L-1",
          actionType: "adjust_symbolic_emphasis",
          targetKey: "river-oath",
          patch: { motifWeight: 0.72 },
          rationale: "symbolism",
          provenanceRefs: ["reports/book1-law-console-session.json#actions[0]"],
        },
        {
          actionId: "L-2",
          actionType: "propose_anchor_mutation",
          targetKey: "H1",
          patch: { latentEvent: "mutated" },
          rationale: "test lock",
          provenanceRefs: ["reports/book1-law-console-session.json#actions[3]"],
        },
      ],
    },
  };
}

describe("book1-regeneration-loop-service", () => {
  it("runs regeneration and enforces locked anchors", () => {
    const service = new Book1RegenerationLoopService();
    const result = service.run(sampleInput());

    assert.equal(result.regeneratedDraftJson.chapter, 1);
    assert.equal(result.voiceContract.artifact, "chapter_voice_contract");
    assert.equal(result.proseBriefs.artifact, "chapter_prose_briefs");
    assert.equal(result.livedHistory.artifact, "chapter_lived_history");
    assert.equal(result.cognitionSignatures.artifact, "chapter_cognition_signatures");
    assert.equal(result.segmentSimulationState.artifact, "chapter_segment_simulation_state");
    assert.equal(result.chapterState.artifact, "chapter_state_model");
    assert.equal(result.chapterBeatProfileRecommendation.artifact, "chapter_state_beat_profile_recommendation");
    const beatAssemblyResult = result.beatAssemblyResult as { status?: string; chain?: { chainValidation?: { passed: boolean } } };
    const beatAssemblyPreflight = result.beatAssemblyPreflight as { orderedBeatTypes?: string[] };
    assert.equal(result.beatAssemblyBlocked, false);
    assert.equal(beatAssemblyResult.status, "ready");
    assert.equal(beatAssemblyResult.chain?.chainValidation?.passed, true);
    assert.equal((beatAssemblyPreflight.orderedBeatTypes?.length ?? 0) >= 8, true);
    assert.equal((result.narrativePsychologyArchitecture as { artifact: string }).artifact, "narrative_psychology_architecture");
    assert.equal((result.proseGenerationConstraints as { artifact: string }).artifact, "prose_generation_constraints");
    assert.equal((result.proseGenerationPreflight as { artifact: string }).artifact, "prose_generation_preflight");
    assert.equal((result.chapter1ProseGenerationPacket as { artifact: string }).artifact, "book1_chapter1_prose_generation_packet");
    assert.equal((result.chapter1ProseOutputPathReport as { artifact: string }).artifact, "prose_generation_output_path_report");
    assert.equal(typeof (result.authorCockpitBundle as { beatGating?: { blocked: boolean } }).beatGating?.blocked, "boolean");
    assert.equal(
      (result.authorCockpitBundle as { runtimeAuthority?: { authorityClass?: string } }).runtimeAuthority?.authorityClass,
      "advisory_runtime",
    );
    assert.equal((result.epicEmotionalGravityPack as { artifact: string }).artifact, "campti_epic_emotional_gravity_pack");
    assert.equal(typeof (result.epicEmotionalGravityValidation as { score?: number }).score, "number");
    assert.equal(result.thoughtRecurrenceGuard.artifact, "chapter_thought_recurrence_guard");
    assert.equal(result.motiveCompression.artifact, "chapter_motive_compression");
    assert.equal(result.characterDistinctionPlan.artifact, "chapter_character_distinction_plan");
    assert.equal(result.enneagramMediationLayer.artifact, "chapter_enneagram_mediation_layer");
    assert.equal(result.abstractFearSuppression.artifact, "chapter_abstract_fear_suppression");
    assert.equal(result.entryStrategyPlan.artifact, "chapter_entry_strategy_plan");
    assert.equal(result.paragraphShapePlan.artifact, "chapter_paragraph_shape_plan");
    assert.equal(result.embodimentAssemblyAdjustments.artifact, "chapter_embodiment_assembly_adjustments");
    assert.equal(result.transitionTexturePlan.artifact, "chapter_transition_texture_plan");
    assert.equal(result.segment24OpenerPolicy.artifact, "chapter_segment_2_4_opener_policy");
    assert.equal(result.segment24EmbodimentPolicy.artifact, "chapter_segment_2_4_embodiment_policy");
    assert.equal(result.openingFamilyAudit.artifact, "chapter_opening_family_audit");
    assert.equal(result.openingParagraphFamilyPlan.artifact, "chapter_opening_paragraph_family_plan");
    assert.equal(result.openerTokenAudit.artifact, "chapter_opener_token_audit");
    assert.equal(result.firstTwoSentencePlan.artifact, "chapter_first_two_sentence_plan");
    assert.equal(result.openerFamilyMemory.artifact, "chapter_opener_family_memory");
    assert.equal(result.segment1OpenerIsolation.artifact, "chapter_segment_1_opener_isolation");
    assert.equal(result.earlyParagraphAntiSymmetry.artifact, "chapter_early_paragraph_anti_symmetry");
    assert.equal(result.sentencePatternPlan.artifact, "chapter_sentence_pattern_plan");
    assert.equal(result.segmentEnergy.artifact, "chapter_segment_energy");
    assert.equal(result.embodiment.artifact, "chapter_embodiment_packets");
    assert.equal(result.proseShapeCritic.artifact, "chapter_prose_shape_critic");
    assert.equal(result.proseShapeSummary.artifact, "chapter_prose_shape_summary");
    assert.equal(result.regenerationSummary.lockedAnchorsEnforced, true);
    assert.equal(Array.isArray(result.regenerationSummary.changedSystems), true);
    const regenerationDiff = result.regenerationDiff as { lockEnforcement: { lockedAnchorViolations: number } };
    const regenerationSummary = result.regenerationSummary as { changedSystems: string[] };
    assert.equal(regenerationDiff.lockEnforcement.lockedAnchorViolations >= 1, true);
    assert.equal(regenerationSummary.changedSystems.includes("cognition_signatures"), true);
    assert.equal(regenerationSummary.changedSystems.includes("segment_simulation_state"), true);
    assert.equal(regenerationSummary.changedSystems.includes("chapter_state_model"), true);
    assert.equal(regenerationSummary.changedSystems.includes("chapter_state_to_beat_profile"), true);
    assert.equal(regenerationSummary.changedSystems.includes("thought_recurrence_guard"), true);
    assert.equal(regenerationSummary.changedSystems.includes("motive_compression"), true);
    assert.equal(regenerationSummary.changedSystems.includes("character_distinction_plan"), true);
    assert.equal(regenerationSummary.changedSystems.includes("abstract_fear_suppression"), true);
    assert.equal(regenerationSummary.changedSystems.includes("entry_strategy_randomizer"), true);
    assert.equal(regenerationSummary.changedSystems.includes("paragraph_shape_alternator"), true);
    assert.equal(regenerationSummary.changedSystems.includes("embodiment_first_injection"), true);
    assert.equal(regenerationSummary.changedSystems.includes("transition_texture_builder"), true);
    assert.equal(regenerationSummary.changedSystems.includes("segment_2_4_opener_policy"), true);
    assert.equal(regenerationSummary.changedSystems.includes("segment_2_4_embodiment_policy"), true);
    assert.equal(regenerationSummary.changedSystems.includes("opening_family_audit"), true);
    assert.equal(regenerationSummary.changedSystems.includes("opening_paragraph_family_diversification"), true);
    assert.equal(regenerationSummary.changedSystems.includes("opener_token_suppression"), true);
    assert.equal(regenerationSummary.changedSystems.includes("first_two_sentence_diversity_governor"), true);
    assert.equal(regenerationSummary.changedSystems.includes("segment_1_opener_isolation"), true);
    assert.equal(regenerationSummary.changedSystems.includes("early_paragraph_anti_symmetry"), true);
    assert.equal(typeof result.regenerationSummary.recommendation, "string");
    assert.equal(typeof result.regenerationSummary.enneagramOverexposureRisk, "string");
    assert.equal(typeof result.regenerationSummary.behaviorMediationQuality, "string");
    assert.equal(typeof result.regenerationSummary.proseTheorizationRisk, "string");
  });

  it("blocks regeneration when beat assembly validation fails", () => {
    const service = new Book1RegenerationLoopService();
    const result = service.run({
      ...sampleInput(),
      forceBeatChainValidationFailure: true,
    });

    assert.equal(result.beatAssemblyBlocked, true);
    assert.equal(result.regeneratedDraftJson.chapter, 1);
    const failure = result.beatAssemblyFailure as { failureStage?: string; reasons?: string[] };
    assert.equal(failure.failureStage, "validation");
    assert.equal((failure.reasons?.[0] ?? "").includes("Forced failure path"), true);
    const gate = result.regenerationSummary as { recommendation?: string };
    assert.equal(gate.recommendation, "reject new draft");
  });
});
