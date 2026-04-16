import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { NarrativePsychologyDerivationService } from "@/lib/services/narrative-psychology-derivation-service";
import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { ChapterCompositionDerivationService } from "@/lib/services/chapter-composition-derivation-service";
import { ChapterCompositionDensityService } from "@/lib/services/chapter-composition-density-service";
import { ChapterCompositionToBeatBiasService } from "@/lib/services/chapter-composition-to-beat-bias-service";
import { ChapterCompositionValidationService } from "@/lib/services/chapter-composition-validation-service";

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
    povWeightingCandidates: [{ characterId: "natchitoches-matriarch-keeper", weight: 0.6, rationale: "continuity anchor" }],
    axisInputs: {
      environmental_stability: { score: 63, direction: "falling", rationale: "riverline drift" },
      food_security: { score: 66, direction: "falling", rationale: "storage pressure" },
      social_cohesion: { score: 71, direction: "falling", rationale: "silent strain" },
      external_awareness: { score: 59, direction: "rising", rationale: "route rumors" },
      memory_continuity: { score: 80, direction: "flat", rationale: "memory authority holds" },
      identity_stability: { score: 65, direction: "falling", rationale: "identity pressure" },
      labor_pressure: { score: 62, direction: "rising", rationale: "workload rising" },
      signal_integrity: { score: 48, direction: "falling", rationale: "noisy cues" },
      decision_pressure: { score: 58, direction: "rising", rationale: "small choices matter" },
      movement_pressure: { score: 56, direction: "rising", rationale: "route stress" },
      relational_heat: { score: 61, direction: "rising", rationale: "contained tension rising" },
      meaning_load: { score: 62, direction: "rising", rationale: "meaning accumulation" },
    },
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 78 }],
    threatenedContinuityThreads: [{ threadId: "storage", label: "storage", strength: 44 }],
    sourceBasis: ["test"],
  });
}

describe("chapter-composition-derivation-service", () => {
  it("derives composition plan and validates schema", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const { plan } = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [
        { locationId: "natchitoches", locationName: "Natchitoches" },
        { locationId: "alexandria-portage", locationName: "Alexandria Portage" },
        { locationId: "lower-river-market", locationName: "Lower River Market" },
      ],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-continuity-survival"],
        },
      ],
    });
    const result = new ChapterCompositionValidationService().validate(plan);
    assert.equal(result.passesAll, true);
  });

  it("derives scene count and role spread in default 2-6 envelope", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const { plan } = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [{ locationId: "natchitoches", locationName: "Natchitoches" }],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-continuity-survival"],
        },
      ],
    });
    assert.equal(plan.sceneCountTarget >= 2 && plan.sceneCountTarget <= 6, true);
    assert.equal(plan.sceneSequence.length, plan.sceneCountTarget);
    assert.equal(new Set(plan.sceneSequence.map((scene) => scene.sceneRole)).size > 1, true);
  });

  it("flags suspiciously thin chapter density", () => {
    const density = new ChapterCompositionDensityService().analyze({
      sceneSequence: [
        {
          scenePlanId: "s1",
          chapterId: "c1",
          sceneOrder: 1,
          sceneRole: "grounding_scene",
          povCandidateWeights: [{ povId: "pov", weight: 1 }],
          dominantThreadIds: ["thread-a"],
          secondaryThreadIds: [],
          latentThreadIds: [],
          settingBindings: [],
          routeBindings: [],
          philosophyBindings: [],
          callbackSeeds: [],
          delayedConvergenceKeys: [],
          requiredBeatBiases: {},
          requiredStateBiases: {},
          apparentConnectionLevel: "indirectly_linked",
          actualConnectionLevel: "indirectly_linked",
          transitionStrategy: "none",
          carryForwardPressureType: "none",
          sceneClosureType: "flat",
          validationFlags: [],
        },
      ],
      activeThreadIds: ["thread-a"],
      latentThreadIds: [],
      callbackMarkersCount: 0,
      hasRoutePresence: false,
      hasUnresolvedCarryForward: false,
      hasDelayedConvergence: false,
    });
    assert.equal(density.hardThinChapterFlag, true);
  });

  it("supports delayed convergence and callback planning", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const { plan } = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [{ locationId: "natchitoches", locationName: "Natchitoches" }],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-continuity-survival"],
        },
      ],
    });
    assert.equal(plan.delayedConvergenceBindings.length > 0, true);
    assert.equal(plan.callbackMarkers.length > 0, true);
    assert.equal(plan.sceneSequence.some((scene) => scene.apparentConnectionLevel === "apparently_isolated"), true);
  });

  it("derives reinterpretation anchors for later multi-pov reentry", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const { plan } = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [{ locationId: "natchitoches", locationName: "Natchitoches" }],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-philosophy-reading-signs"],
        },
      ],
    });
    assert.equal(plan.reinterpretationAnchors.length > 0, true);
  });

  it("enforces route recurrence and philosophy propagation plans", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const result = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [
        { locationId: "natchitoches", locationName: "Natchitoches" },
        { locationId: "atchafalaya-fork", locationName: "Atchafalaya Fork" },
      ],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-continuity-survival"],
        },
      ],
    });
    assert.equal(result.routeLedger.enforcementWarnings.length > 0, true);
    assert.equal(result.philosophyPlan.activePhilosophyThreadIds.length > 0, true);
    assert.equal(result.philosophyPlan.explicitnessCeiling <= 0.5, true);
  });

  it("builds cockpit composition summary and beat/scene integration output", () => {
    const chapterState = buildChapterState();
    const chapterPsychology = new NarrativePsychologyDerivationService().buildBook1Architecture().chapters[0];
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const result = new ChapterCompositionDerivationService().derive({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterPsychology.chapterId,
      parentChapterStateId: chapterState.chapterId,
      chapterPsychology,
      chapterState,
      narrativeThreads: threads,
      requiredLocations: [{ locationId: "natchitoches", locationName: "Natchitoches" }],
      routePresenceEvents: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          chapterId: "book1-chapter-01",
          mode: "direct_scene_setting",
          associatedThreads: ["book1-continuity-survival"],
        },
      ],
    });
    const beatBias = new ChapterCompositionToBeatBiasService().derive({
      chapterId: result.plan.chapterId,
      sceneSequence: result.plan.sceneSequence,
    });
    assert.equal(result.cockpitSummary.sceneCount, result.plan.sceneSequence.length);
    assert.equal(result.cockpitSummary.densityScore, result.plan.densityScore);
    assert.equal(Object.keys(beatBias.chapterBeatBiasSummary).length > 0, true);
  });
});
