/**
 * Cluster 8 — character simulation core (node:test).
 * Run: npx tsx --test lib/services/cluster8-character-simulation.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { CharacterConstraintService } from "@/lib/services/character-constraint-service";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";
import { CharacterSceneEmergenceService } from "@/lib/services/character-scene-emergence-service";
import { CharacterSimulationRuntimeDerivationService } from "@/lib/services/character-simulation-runtime-service";
import { CharacterSimulationValidationService } from "@/lib/services/character-simulation-validation-service";
import { CharacterStateEvolutionService } from "@/lib/services/character-state-evolution-service";
import { CanonicalNarrativeGovernanceOrchestrationService } from "@/lib/services/canonical-narrative-governance-orchestration-service";
import { ChapterCompositionPlanSchema } from "@/lib/domain/chapter-composition";
import { ProseGenerationConstraintsSchema } from "@/lib/domain/prose-generation-constraints";

function minimalProse() {
  return ProseGenerationConstraintsSchema.parse({
    artifact: "prose_generation_constraints",
    proseConstraintId: "p1",
    chapterId: "book1-chapter-01",
    parentBeatChainId: "b1",
    parentChapterStateId: "book1-chapter-01",
    parentNarrativePsychologyId: "book1",
    povCharacterId: "pov-a",
    proseMode: "rooted_continuity",
    narrativeDistance: "close_externalized_embodied",
    cognitionMode: ["native_relational"],
    sentencePressureProfile: { level: "medium", compressionBias: 0.5 },
    sensoryDensityProfile: { requiredDensity: "high", requiredChannels: ["touch"] },
    environmentalGroundingFloor: 0.8,
    relationalSignalDensity: 0.6,
    memoryInvocationAllowance: 0.4,
    expositionAllowance: 0.1,
    interpretationAllowance: 0.2,
    ambiguityAllowance: 0.4,
    revelationAllowance: 0.2,
    emotionalLabelAllowance: 0.1,
    meaningReflectionAllowance: 0.2,
    lineTensionProfile: { target: "steady", unresolvedCarryForward: 0.6 },
    paragraphBreathProfile: { averageSentences: 4, allowedLongParagraphRatio: 0.2 },
    cadenceProfile: ["c"],
    dictionGuardrails: ["d"],
    syntaxGuardrails: ["s"],
    forbiddenPatterns: ["f"],
    requiredPatterns: ["r"],
    endingMomentumProfile: { vector: "carry", carryForwardPressureType: "warning" },
    literaryDeviceConstraints: {
      activeDeviceIds: [],
      suppressedDeviceIds: [],
      soundPatternAllowance: "minimal",
      symbolismAllowance: "minimal",
      metaphorSimileAllowance: "minimal",
      explicitnessCeiling: "low",
      closurePressureStyle: "state_pressure_seeded",
      callbackPhraseAllowance: false,
      placeMemoryInsertionOpportunities: [],
      repetitionAllowance: "rare_only",
    },
    continuityEmphasis: 0.7,
    placeImmersionTarget: 0.8,
    attachmentTarget: 0.75,
    driftFlags: [],
    validationFlags: [],
  });
}

function tinyContract(): SceneGenerationContractV1 {
  return {
    contractVersion: "1",
    epic: { id: "epic1", title: "E", summary: null, metadataJson: {} },
    book: { id: "book1", movementIndex: 0, title: "B", readerFacingTitle: null, summary: null },
    chapter: {
      id: "ch1",
      title: "C",
      summary: null,
      sequenceInBook: 1,
      chapterNumber: 1,
    },
    scene: {
      id: "scene-a",
      description: "d",
      summary: null,
      narrativeIntent: null,
      emotionalTone: null,
      orderInChapter: 2,
      writingMode: "STRUCTURED",
      historicalAnchor: null,
      locationNote: null,
      pov: null,
      structuredDataJson: {},
    },
    effectiveWorldState: { worldStateId: "ws1", eraId: null, label: "era" },
    place: { id: "pl1", name: "P", description: null },
    participatingPeople: [
      { id: "alice", name: "Alice", description: null, birthYear: null, deathYear: null },
      { id: "bob", name: "Bob", description: null, birthYear: null, deathYear: null },
    ],
    genealogicalAssertions: [],
    worldStateReference: null,
    beatPlan: [],
    continuityNotes: [],
    privateNotes: null,
  };
}

describe("cluster8 character simulation", () => {
  it("state evolution increases pressure and respects no-reset floor", () => {
    const seeds = new CharacterMindSeedService();
    const mind = seeds.buildMindProfile({ characterId: "c1", displayLabel: "C1" });
    const priorCognitive = [
      {
        characterId: "c1",
        currentDesireFocus: "x",
        currentFearActivation: 0.7,
        currentEmotionalState: "strained",
        currentRelationalFocus: "r",
        currentInternalConflict: "i",
        currentSuppressionState: "held",
        currentDecisionPressure: 0.5,
        currentIdentityStress: 0.72,
      },
    ];
    const evo = new CharacterStateEvolutionService().evolveAfterScene({
      minds: [mind],
      priorCognitive,
      priorRelationshipStates: [
        {
          relationshipId: "rel:a",
          currentTensionLevel: 0.5,
          currentThreatLevel: 0.5,
          currentDependencyPressure: 0.5,
          currentConflictMode: "cold",
          currentRepairStatus: "stalled",
        },
      ],
      sceneOrderIndex: 2,
      humanGravity: null,
      allowEmotionalReset: false,
    });
    assert.ok(evo.cognitiveStates[0]!.currentFearActivation >= 0);
    assert.ok(evo.relationshipStates[0]!.currentTensionLevel >= 0.5);
  });

  it("constraints block unrealistic repair under high difficulty", () => {
    const seeds = new CharacterMindSeedService();
    const mind = seeds.buildMindProfile({ characterId: "a", displayLabel: "A" });
    const cog = {
      characterId: "a",
      currentDesireFocus: "d",
      currentFearActivation: 0.8,
      currentEmotionalState: "brittle",
      currentRelationalFocus: "x",
      currentInternalConflict: "i",
      currentSuppressionState: "leaking",
      currentDecisionPressure: 0.9,
      currentIdentityStress: 0.85,
    };
    const voice = {
      characterId: "a",
      currentVoiceMode: "intimate" as const,
      stressLevel: 0.9,
      relationalContext: "x",
      truthVsMaskRatio: 0.8,
    };
    const out = new CharacterConstraintService().evaluateForCharacter({
      mind: { ...mind, changeResistance: 0.8 },
      cognitive: cog,
      voice,
      relationships: [
        {
          profile: {
            relationshipId: "rel",
            participants: ["a", "b"] as [string, string],
            bondType: "kin",
            dependencyMap: {},
            powerBalance: 0.5,
            trustLevel: 0.3,
            unspokenNeeds: [],
            resentmentLines: [],
            protectionInstinct: "",
            conflictHistory: [],
            repairHistory: [],
            breakRisk: 0.5,
            repairDifficulty: 0.9,
            silenceZones: [],
          },
          state: {
            relationshipId: "rel",
            currentTensionLevel: 0.8,
            currentThreatLevel: 0.8,
            currentDependencyPressure: 0.6,
            currentConflictMode: "volatile",
            currentRepairStatus: "none",
          },
        },
      ],
    });
    assert.ok(out.blockedRelationalMoves.length + out.blockedSpeechActs.length > 0);
  });

  it("runtime derivation produces emergence and voice differentiation for two people", () => {
    const governanceSvc = new CanonicalNarrativeGovernanceOrchestrationService();
    const orch = governanceSvc.orchestrate({
      proseConstraintsAfterLiteraryLayer: minimalProse(),
      epicId: "epic1",
      bookId: "book1",
      chapterId: "ch1",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1"],
      chapterCompositionPlan: ChapterCompositionPlanSchema.parse({
        artifact: "chapter_composition_plan",
        schemaVersion: "1.0.0",
        compositionPlanId: "plan1",
        chapterId: "ch1",
        parentBookId: "book1",
        parentNarrativePsychologyId: "book1",
        parentChapterStateId: "ch1",
        activeThreadIds: ["t1"],
        latentThreadIds: [],
        callbackThreadIds: [],
        routeRequirementStatus: {
          requiredLocationIds: ["pl1"],
          missingLocationIds: [],
          recurrenceSatisfied: true,
          enforcementNotes: [],
        },
        philosophyRequirementStatus: {
          activePhilosophyThreadIds: [],
          explicitnessCeiling: 0.2,
          satisfied: true,
          warnings: [],
        },
        compositionMode: "delayed_convergence",
        sceneCountTarget: 2,
        sceneSequence: [
          {
            scenePlanId: "scene-a",
            chapterId: "ch1",
            sceneOrder: 1,
            sceneRole: "grounding_scene",
            povCandidateWeights: [{ povId: "alice", weight: 0.7 }],
            dominantThreadIds: ["t1"],
            secondaryThreadIds: [],
            latentThreadIds: [],
            settingBindings: ["pl1"],
            routeBindings: ["pl1"],
            philosophyBindings: [],
            callbackSeeds: [],
            delayedConvergenceKeys: [],
            requiredBeatBiases: { salience_lock_beat: 0.5 },
            requiredStateBiases: { unresolved_pull: 0.45 },
            apparentConnectionLevel: "indirectly_linked",
            actualConnectionLevel: "hidden_linked",
            transitionStrategy: "soft_echo",
            carryForwardPressureType: "threaded_pressure",
            sceneClosureType: "open_knot",
            validationFlags: [],
          },
          {
            scenePlanId: "scene-b",
            chapterId: "ch1",
            sceneOrder: 2,
            sceneRole: "closure_scene",
            povCandidateWeights: [{ povId: "bob", weight: 0.55 }],
            dominantThreadIds: ["t1"],
            secondaryThreadIds: [],
            latentThreadIds: [],
            settingBindings: ["pl1"],
            routeBindings: ["pl1"],
            philosophyBindings: [],
            callbackSeeds: [],
            delayedConvergenceKeys: [],
            requiredBeatBiases: { consequence_seed_beat: 0.5 },
            requiredStateBiases: { unresolved_pull: 0.5 },
            apparentConnectionLevel: "indirectly_linked",
            actualConnectionLevel: "hidden_linked",
            transitionStrategy: "closure_open",
            carryForwardPressureType: "threaded_pressure",
            sceneClosureType: "pressure_forward",
            validationFlags: [],
          },
        ],
        sceneContrastProfile: {
          tonalContrast: 0.5,
          pressureContrast: 0.5,
          threadMixContrast: 0.5,
          settingContrast: 0.5,
          notes: [],
        },
        delayedConvergenceBindings: [],
        callbackMarkers: [],
        reinterpretationAnchors: [],
        densityScore: 0.6,
        densityWarnings: [],
        routeCoverageNotes: [],
        continuityCarryForwardPlan: ["carry"],
        unresolvedPressurePlan: ["pressure"],
        chapterClosureProfile: "convergence_teased",
        validationFlags: [],
      }),
      narrativeThreads: [],
      settingCoverageReport: { records: [], missingLocationIds: [] },
      sceneIdsInChapter: ["scene-a", "scene-b"],
      preparationPath: "explicit_override",
    });
    const pre = governanceSvc.toPreGenerationBundle(orch, { preparationPath: "explicit_override" });
    const input: SceneGenerationInput = {
      contract: tinyContract(),
      generationMode: "draft",
      generationPurpose: "author_draft",
      historicalAnchorTerms: [],
      proseQaContext: {},
      sourceIdsUsed: [],
      canonicalPreGeneration: pre,
      humanGravityRuntime: null,
    };
    const rt = new CharacterSimulationRuntimeDerivationService().derive(input);
    assert.ok(rt);
    assert.equal(rt!.voiceProfiles.length, 2);
    assert.notEqual(rt!.voiceProfiles[0]!.characterId, rt!.voiceProfiles[1]!.characterId);
    assert.notEqual(rt!.voiceProfiles[0]!.internalMonologueStyle, rt!.voiceProfiles[1]!.internalMonologueStyle);
    assert.ok(rt!.sceneEmergenceDigest.sceneNecessityReasons.length >= 1);
  });

  it("validation flags voice flattening risk when metaphor domains collapse", () => {
    const sim = new CharacterSimulationValidationService().validate({
      sceneGenerationInput: {
        contract: tinyContract(),
        generationMode: "draft",
        generationPurpose: "author_draft",
        historicalAnchorTerms: [],
        proseQaContext: {},
        sourceIdsUsed: [],
        characterSimulationRuntime: {
          contractVersion: "1",
          clusterTag: "cluster8_character_simulation_runtime",
          sceneId: "scene-a",
          chapterId: "ch1",
          mindProfiles: [],
          cognitiveStates: [],
          voiceProfiles: [
            {
              characterId: "a",
              internalMonologueStyle: "",
              spokenDialogueStyle: "",
              silencePattern: "",
              deflectionPattern: "",
              emotionalExpressionStyle: "",
              metaphorDomain: "same",
              cadenceProfile: "same",
              vocabularyRange: "medium",
              tabooBoundaries: [],
              conflictSpeechPattern: "",
              intimacySpeechPattern: "",
              powerSpeechPattern: "",
              stressVoiceShiftPattern: "",
            },
            {
              characterId: "b",
              internalMonologueStyle: "",
              spokenDialogueStyle: "",
              silencePattern: "",
              deflectionPattern: "",
              emotionalExpressionStyle: "",
              metaphorDomain: "same",
              cadenceProfile: "same",
              vocabularyRange: "medium",
              tabooBoundaries: [],
              conflictSpeechPattern: "",
              intimacySpeechPattern: "",
              powerSpeechPattern: "",
              stressVoiceShiftPattern: "",
            },
          ],
          voiceStates: [],
          relationshipProfiles: [],
          relationshipStates: [],
          sceneEmergenceDigest: {
            sceneId: "scene-a",
            sceneNecessityReasons: ["n"],
            conflictSources: ["c"],
            povCandidates: [{ personId: "a", weight: 1, rationale: "r" }],
            scenePurposeFromPressure: "p",
            dominantPressureIds: ["d"],
            validationFlags: [],
          },
          constraintFlags: [],
          evolutionStamp: { sceneOrderIndex: 0, residueNotes: [], noResetAligned: true },
          promptInstructionLines: ["x"],
          validationFlags: [],
        },
      } as SceneGenerationInput,
      generatedText: "A longer paragraph with enough length to avoid thin-scene hard fail, commas, here, and there, so that the heuristic does not misfire on segmentation.",
    });
    assert.equal(sim.voiceFlatteningRisk, true);
  });

  it("chapter emergence plan includes every composition scene id", () => {
    const composition = ChapterCompositionPlanSchema.parse({
        artifact: "chapter_composition_plan",
        schemaVersion: "1.0.0",
        compositionPlanId: "plan1",
        chapterId: "ch1",
        parentBookId: "book1",
        parentNarrativePsychologyId: "book1",
        parentChapterStateId: "ch1",
        activeThreadIds: ["t1"],
        latentThreadIds: [],
        callbackThreadIds: [],
        routeRequirementStatus: {
          requiredLocationIds: ["pl1"],
          missingLocationIds: [],
          recurrenceSatisfied: true,
          enforcementNotes: [],
        },
        philosophyRequirementStatus: {
          activePhilosophyThreadIds: [],
          explicitnessCeiling: 0.2,
          satisfied: true,
          warnings: [],
        },
        compositionMode: "delayed_convergence",
        sceneCountTarget: 2,
        sceneSequence: [
          {
            scenePlanId: "s1",
            chapterId: "ch1",
            sceneOrder: 1,
            sceneRole: "grounding_scene",
            povCandidateWeights: [{ povId: "p1", weight: 0.6 }],
            dominantThreadIds: ["t1"],
            secondaryThreadIds: [],
            latentThreadIds: [],
            settingBindings: ["pl1"],
            routeBindings: ["pl1"],
            philosophyBindings: [],
            callbackSeeds: [],
            delayedConvergenceKeys: [],
            requiredBeatBiases: { salience_lock_beat: 0.5 },
            requiredStateBiases: { unresolved_pull: 0.45 },
            apparentConnectionLevel: "indirectly_linked",
            actualConnectionLevel: "hidden_linked",
            transitionStrategy: "soft_echo",
            carryForwardPressureType: "threaded_pressure",
            sceneClosureType: "open_knot",
            validationFlags: [],
          },
          {
            scenePlanId: "s2",
            chapterId: "ch1",
            sceneOrder: 2,
            sceneRole: "closure_scene",
            povCandidateWeights: [{ povId: "p2", weight: 0.55 }],
            dominantThreadIds: ["t1"],
            secondaryThreadIds: [],
            latentThreadIds: [],
            settingBindings: ["pl1"],
            routeBindings: ["pl1"],
            philosophyBindings: [],
            callbackSeeds: [],
            delayedConvergenceKeys: [],
            requiredBeatBiases: { salience_lock_beat: 0.5 },
            requiredStateBiases: { unresolved_pull: 0.45 },
            apparentConnectionLevel: "indirectly_linked",
            actualConnectionLevel: "hidden_linked",
            transitionStrategy: "soft_echo",
            carryForwardPressureType: "threaded_pressure",
            sceneClosureType: "pressure_forward",
            validationFlags: [],
          },
        ],
        sceneContrastProfile: {
          tonalContrast: 0.5,
          pressureContrast: 0.5,
          threadMixContrast: 0.5,
          settingContrast: 0.5,
          notes: [],
        },
        delayedConvergenceBindings: [],
        callbackMarkers: [],
        reinterpretationAnchors: [],
        densityScore: 0.6,
        densityWarnings: [],
        routeCoverageNotes: [],
        continuityCarryForwardPlan: ["carry"],
        unresolvedPressurePlan: ["pressure"],
        chapterClosureProfile: "convergence_teased",
        validationFlags: [],
      });
    const orch = new CanonicalNarrativeGovernanceOrchestrationService().orchestrate({
      proseConstraintsAfterLiteraryLayer: minimalProse(),
      epicId: "epic1",
      bookId: "book1",
      chapterId: "ch1",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1"],
      chapterCompositionPlan: composition,
      narrativeThreads: [],
      settingCoverageReport: { records: [], missingLocationIds: [] },
      sceneIdsInChapter: ["s1", "s2"],
      preparationPath: "explicit_override",
    });
    const plan = new CharacterSceneEmergenceService().deriveChapterPlan({
      chapterId: "ch1",
      bookId: "book1",
      chapterCompositionPlan: composition,
      epicContinuityPack: orch.epicContinuityPack,
      epicEmotionalGravityPack: orch.epicEmotionalGravityPack,
    });
    assert.ok(plan.sceneEmergenceBySceneId.s1);
    assert.ok(plan.sceneEmergenceBySceneId.s2);
  });
});
