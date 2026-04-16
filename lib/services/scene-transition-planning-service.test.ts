import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ChapterCompositionPlanSchema } from "@/lib/domain/chapter-composition";
import { SceneTransitionPlanningService } from "@/lib/services/scene-transition-planning-service";

describe("scene-transition-planning-service", () => {
  it("builds explicit transition plans for each scene adjacency", () => {
    const plan = ChapterCompositionPlanSchema.parse({
      artifact: "chapter_composition_plan",
      schemaVersion: "1.0.0",
      compositionPlanId: "composition-1",
      chapterId: "book1-chapter-01",
      parentBookId: "book1",
      parentNarrativePsychologyId: "book1",
      parentChapterStateId: "book1-chapter-01",
      activeThreadIds: ["thread-a"],
      latentThreadIds: [],
      callbackThreadIds: [],
      routeRequirementStatus: {
        requiredLocationIds: ["natchitoches"],
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
      sceneCountTarget: 3,
      sceneSequence: [
        {
          scenePlanId: "scene-01",
          chapterId: "book1-chapter-01",
          sceneOrder: 1,
          sceneRole: "grounding_scene",
          povCandidateWeights: [{ povId: "pov-a", weight: 1 }],
          dominantThreadIds: ["thread-a"],
          secondaryThreadIds: [],
          latentThreadIds: [],
          settingBindings: ["natchitoches"],
          routeBindings: ["natchitoches"],
          philosophyBindings: [],
          callbackSeeds: [],
          delayedConvergenceKeys: ["key-a"],
          requiredBeatBiases: {},
          requiredStateBiases: {},
          apparentConnectionLevel: "apparently_isolated",
          actualConnectionLevel: "convergent_later",
          transitionStrategy: "soft_echo",
          carryForwardPressureType: "threaded_pressure",
          sceneClosureType: "open_knot",
          validationFlags: [],
        },
        {
          scenePlanId: "scene-02",
          chapterId: "book1-chapter-01",
          sceneOrder: 2,
          sceneRole: "rumor_scene",
          povCandidateWeights: [{ povId: "pov-a", weight: 1 }],
          dominantThreadIds: ["thread-a"],
          secondaryThreadIds: [],
          latentThreadIds: [],
          settingBindings: ["natchitoches"],
          routeBindings: ["natchitoches"],
          philosophyBindings: [],
          callbackSeeds: [],
          delayedConvergenceKeys: ["key-a"],
          requiredBeatBiases: {},
          requiredStateBiases: {},
          apparentConnectionLevel: "apparently_isolated",
          actualConnectionLevel: "convergent_later",
          transitionStrategy: "delayed_bind",
          carryForwardPressureType: "threaded_pressure",
          sceneClosureType: "open_knot",
          validationFlags: [],
        },
        {
          scenePlanId: "scene-03",
          chapterId: "book1-chapter-01",
          sceneOrder: 3,
          sceneRole: "closure_scene",
          povCandidateWeights: [{ povId: "pov-a", weight: 1 }],
          dominantThreadIds: ["thread-a"],
          secondaryThreadIds: [],
          latentThreadIds: [],
          settingBindings: ["natchitoches"],
          routeBindings: ["natchitoches"],
          philosophyBindings: [],
          callbackSeeds: [],
          delayedConvergenceKeys: [],
          requiredBeatBiases: {},
          requiredStateBiases: {},
          apparentConnectionLevel: "indirectly_linked",
          actualConnectionLevel: "hidden_linked",
          transitionStrategy: "closure_open",
          carryForwardPressureType: "threaded_pressure",
          sceneClosureType: "pressure_forward",
          validationFlags: [],
        },
      ],
      sceneContrastProfile: {
        tonalContrast: 0.6,
        pressureContrast: 0.6,
        threadMixContrast: 0.5,
        settingContrast: 0.3,
        notes: [],
      },
      delayedConvergenceBindings: [],
      callbackMarkers: [],
      reinterpretationAnchors: [],
      densityScore: 0.7,
      densityWarnings: [],
      routeCoverageNotes: [],
      continuityCarryForwardPlan: ["carry"],
      unresolvedPressurePlan: ["pressure"],
      chapterClosureProfile: "convergence_teased",
      validationFlags: [],
    });

    const result = new SceneTransitionPlanningService().derive({
      chapterId: "book1-chapter-01",
      scenes: plan.sceneSequence,
    });

    assert.equal(result.transitions.length, 2);
    assert.equal(result.transitions[0]?.fromScenePlanId, "scene-01");
    assert.equal(result.transitions[0]?.toScenePlanId, "scene-02");
    assert.equal(result.transitions[0]?.strategy, "delayed_bind_cut");
  });
});

