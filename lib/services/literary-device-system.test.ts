import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LiteraryDeviceControlSettingSchema } from "@/lib/domain/literary-device-control";
import { ProseGenerationConstraintDerivationService } from "@/lib/services/prose-generation-constraint-derivation-service";
import { NarrativePsychologyDerivationService } from "@/lib/services/narrative-psychology-derivation-service";
import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { ChapterStateToBeatAssemblyChainService } from "@/lib/services/chapter-state-to-beat-assembly-chain-service";
import { LiteraryDeviceCockpitService, mapNumericAlliterationDensity } from "@/lib/services/literary-device-cockpit-service";
import { LiteraryDeviceDerivationService } from "@/lib/services/literary-device-derivation-service";
import { LiteraryDeviceToProseConstraintsService } from "@/lib/services/literary-device-to-prose-constraints-service";
import { LiteraryDeviceValidationService } from "@/lib/services/literary-device-validation-service";

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
      labor_pressure: { score: 69, direction: "rising", rationale: "load increase" },
      signal_integrity: { score: 41, direction: "falling", rationale: "soft mismatch" },
      decision_pressure: { score: 63, direction: "rising", rationale: "local decisions matter" },
      movement_pressure: { score: 18, direction: "rising", rationale: "still low" },
      relational_heat: { score: 67, direction: "rising", rationale: "contained strain" },
      meaning_load: { score: 34, direction: "rising", rationale: "implicit meaning" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 84 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "storage", strength: 43 }],
    sourceBasis: ["test"],
  });
}

describe("literary device control system", () => {
  it("validates schema and control object", () => {
    const parsed = LiteraryDeviceControlSettingSchema.parse({
      controlId: "ctl-alliteration",
      deviceId: "alliteration",
      targetScope: "scene",
      targetId: "book1-ch01-sc01",
      activationMode: "subtle",
      densityBand: "rare",
      explicitnessBand: "implicit",
      priorityLevel: "medium",
      allowedContextsOverride: ["environment", "memory"],
      forbiddenContextsOverride: ["high_tension_decision"],
      targetCarrierModes: ["sound_pattern"],
      driftTolerance: 0.2,
      symbolismBindings: [],
      motifBindings: [],
      threadBindings: ["book1-continuity-survival"],
      settingBindings: ["natchitoches"],
      objectBindings: [],
      characterBindings: [],
      chapterBindings: ["book1-chapter-01"],
      sceneBindings: ["book1-ch01-sc01"],
      notes: [],
      validationFlags: [],
      alliterationPolicy: {
        allowedLineZones: ["descriptive_line"],
        forbiddenLineZones: ["high_tension_decision_line"],
        consonantClusteringTolerance: 0.22,
        descriptiveLineAllowance: true,
        ritualLineAllowance: true,
        memoryLineAllowance: true,
        transitionLineAllowance: true,
        highTensionDecisionLineAllowance: false,
      },
    });
    assert.equal(parsed.deviceId, "alliteration");
  });

  it("maps alliteration numeric input to semantic density bands", () => {
    assert.equal(mapNumericAlliterationDensity(10), "rare");
    assert.equal(mapNumericAlliterationDensity(35), "occasional");
    assert.equal(mapNumericAlliterationDensity(65), "patterned");
    assert.equal(mapNumericAlliterationDensity(90), "motif_driven");
  });

  it("derives application plan from psychology/state/thread inputs", () => {
    const service = new LiteraryDeviceDerivationService();
    const plan = service.deriveApplicationPlan({
      chapterId: "book1-chapter-01",
      sceneId: "book1-ch01-sc01",
      chapterPsychologyMode: "rooted_continuity",
      chapterMode: "continuity_chapter",
      psychologyAxes: { placeImmersion: 0.82, unresolvedPull: 0.72, signalIntegrity: 0.42, relationalHeat: 0.66, laborPressure: 0.68 },
      activeThreadIds: ["book1-continuity-survival", "book1-philosophy-reading-signs"],
      settingThreadIds: ["book1-red-river-route-setting"],
      philosophyThreadIds: ["book1-philosophy-reading-signs"],
      compositionMode: "delayed_convergence",
      sceneRoles: ["grounding_scene", "warning_scene"],
      beatTypes: ["salience_lock_beat", "consequence_seed_beat"],
      controlSettings: service.buildBook1SamplePack({
        chapterId: "book1-chapter-01",
        sceneId: "book1-ch01-sc01",
        sceneRoles: ["grounding_scene"],
        beatTypes: ["consequence_seed_beat"],
        chapterPsychologyMode: "rooted_continuity",
        chapterMode: "continuity_chapter",
      }).controlSettings,
    });
    assert.equal(plan.activeDeviceIds.includes("continuity_echo"), true);
    assert.equal(plan.activeDeviceIds.includes("place_memory"), true);
  });

  it("detects misuse and symbolism binding failures", () => {
    const service = new LiteraryDeviceDerivationService();
    const pack = service.buildBook1SamplePack({
      chapterId: "book1-chapter-01",
      sceneId: "book1-ch01-sc01",
      sceneRoles: ["grounding_scene"],
      beatTypes: ["consequence_seed_beat"],
      chapterPsychologyMode: "rooted_continuity",
      chapterMode: "continuity_chapter",
    });
    const badControls = pack.controlSettings.map((control) =>
      control.deviceId === "alliteration"
        ? {
            ...control,
            activationMode: "strong" as const,
            alliterationPolicy: {
              ...control.alliterationPolicy!,
              highTensionDecisionLineAllowance: true,
            },
          }
        : control.deviceId === "symbolism"
          ? { ...control, threadBindings: [], settingBindings: [] }
          : control,
    );
    const validation = new LiteraryDeviceValidationService().validate({
      plan: pack.scenePlans[0],
      controls: badControls,
      activeThreadIds: [],
      chapterMode: "continuity_chapter",
      chapterToneCeiling: "guarded",
    });
    assert.equal(validation.passesHardValidation, false);
    assert.equal(validation.hardFailures.length >= 2, true);
  });

  it("maps literary plan into prose constraints extension", () => {
    const state = sampleState();
    const chapterPsych = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const recommendation = deriveBeatProfileRecommendation(state);
    const beatResult = new ChapterStateToBeatAssemblyChainService().run({ chapterState: state, beatProfileRecommendation: recommendation });
    assert.equal(beatResult.status, "ready");
    if (beatResult.status !== "ready") return;
    const prose = new ProseGenerationConstraintDerivationService().derive({
      chapterPsychology: chapterPsych,
      chapterState: state,
      beatChain: beatResult.chain,
    });
    const ldService = new LiteraryDeviceDerivationService();
    const pack = ldService.buildBook1SamplePack({
      chapterId: "book1-chapter-01",
      sceneId: "book1-ch01-sc01",
      sceneRoles: ["grounding_scene"],
      beatTypes: beatResult.chain.beats.map((beat) => beat.beatType),
      chapterPsychologyMode: chapterPsych.chapterPsychologyMode,
      chapterMode: state.chapterMode,
    });
    const validation = new LiteraryDeviceValidationService().validate({
      plan: pack.scenePlans[0],
      controls: pack.controlSettings,
      activeThreadIds: ["book1-continuity-survival"],
      chapterMode: state.chapterMode,
      chapterToneCeiling: state.allowedMeaningIntensity,
    });
    const mapped = new LiteraryDeviceToProseConstraintsService().apply({
      constraints: prose,
      plan: pack.scenePlans[0],
      validation,
    });
    assert.equal(mapped.literaryDeviceConstraints.activeDeviceIds.length > 0, true);
    assert.equal(mapped.validationFlags.includes("literary_device_constraints_applied"), true);
  });

  it("builds cockpit summary with overload diagnostics", () => {
    const derivation = new LiteraryDeviceDerivationService();
    const pack = derivation.buildBook1SamplePack({
      chapterId: "book1-chapter-01",
      sceneId: "book1-ch01-sc01",
      sceneRoles: ["grounding_scene", "warning_scene"],
      beatTypes: ["consequence_seed_beat"],
      chapterPsychologyMode: "rooted_continuity",
      chapterMode: "continuity_chapter",
    });
    const validation = new LiteraryDeviceValidationService().validate({
      plan: pack.scenePlans[0],
      controls: pack.controlSettings,
      activeThreadIds: ["book1-continuity-survival"],
      chapterMode: "continuity_chapter",
      chapterToneCeiling: "guarded",
    });
    const cockpit = new LiteraryDeviceCockpitService().buildSummary({
      chapterId: "book1-chapter-01",
      plan: pack.scenePlans[0],
      controls: pack.controlSettings,
      symbols: pack.symbolRegistry,
      validation,
      sceneIds: ["book1-ch01-sc01", "book1-ch01-sc02"],
    });
    assert.equal(cockpit.activeDevices.length > 0, true);
    assert.equal(cockpit.alliterationControl.mappedDensityBand.length > 0, true);
  });

  it("validates book1 sample pack integrity", () => {
    const pack = new LiteraryDeviceDerivationService().buildBook1SamplePack({
      chapterId: "book1-chapter-01",
      sceneId: "book1-ch01-sc01",
      sceneRoles: ["grounding_scene", "warning_scene"],
      beatTypes: ["salience_lock_beat", "consequence_seed_beat"],
      chapterPsychologyMode: "rooted_continuity",
      chapterMode: "continuity_chapter",
    });
    assert.equal(pack.definitions.length >= 20, true);
    assert.equal(pack.validationExamples.overloadUse.passesHardValidation, false);
  });
});
