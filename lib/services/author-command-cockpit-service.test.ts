import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { RUNTIME_ID_SCENE_CHAPTER_PRODUCTION } from "@/lib/services/runtime-authority-registry-service";

describe("author-command-cockpit-service", () => {
  it("builds bounded cockpit bundle with contextual actions", () => {
    const bundle = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "chapter-1" }),
      labels: { chapterLabel: "Chapter One" },
      metrics: {
        chapterProgressionState: 0.7,
        contradictionRisk: 0.6,
        chapterReadiness: 0.5,
      },
      beatAssembly: {
        chapter: 1,
        beatCount: 10,
        validationPassed: true,
        highestPressureLoad: 0.76,
        salienceCoverage: 1,
        memoryLinkedBeats: 10,
        socialFeedbackBeats: 2,
        meaningTraceBeats: 1,
        summaryLine: "Order-under-pressure chain active.",
      },
      chapterState: {
        chapterId: "book1-chapter-01",
        chapterMode: "continuity_chapter",
        dominantPressures: ["labor_pressure", "signal_integrity"],
        suppressedPressures: ["movement_pressure"],
        movementPressure: 14,
        decisionPressure: 34,
        meaningLoad: 26,
        allowedMeaningIntensity: "guarded",
        validationPassed: true,
        riskFlags: [],
        summaryLine: "Continuity still leads, but pressure readability has softened.",
      },
      narrativePsychology: {
        chapterId: "book1-chapter-01",
        chapterPsychologyMode: "rooted_continuity",
        emotionalObjective: "Bond reader to place and duty before fracture.",
        pullScore: 0.58,
        carryForwardHook: "unresolved_operational_branch",
        driftWarnings: [],
      },
      proseConstraints: {
        proseMode: "rooted_continuity",
        narrativeDistance: "close_externalized_embodied",
        sensoryDensityTarget: "high",
        expositionAllowance: 0.12,
        emotionalExplicitnessCeiling: 0.14,
        ambiguityAllowance: 0.52,
        endingMomentumProfile: "consequence-seeded",
        attachmentTarget: 0.71,
        placeImmersionTarget: 0.84,
        compliant: true,
        driftWarnings: [],
      },
      beatGating: {
        required: true,
        blocked: false,
        reason: "State-driven beat chain validated.",
      },
      narrativeThreads: {
        chapterId: "book1-chapter-01",
        activeThreadIds: ["book1-continuity-survival", "book1-red-river-route-setting"],
        latentThreadIds: ["book1-philosophy-reading-signs"],
        callbackMarkers: ["storage-knot-gesture"],
        delayedConvergenceMarkers: ["route-pressure-cluster-a"],
        reinterpretationCandidates: ["reinterpret-book1-warning-gesture"],
        philosophyThreadIds: ["book1-philosophy-reading-signs"],
        unresolvedThreadCount: 3,
        resolvedThreadCount: 0,
        sceneDensity: [
          { sceneId: "book1-ch01-sc01", activeThreadCount: 1, latentThreadCount: 1, densityScore: 0.44 },
          { sceneId: "book1-ch01-sc02", activeThreadCount: 1, latentThreadCount: 1, densityScore: 0.47 },
        ],
        warnings: [],
      },
      chapterComposition: {
        chapterId: "book1-chapter-01",
        compositionMode: "delayed_convergence",
        sceneCount: 4,
        sceneRoleSpread: ["grounding_scene", "relational_scene", "rumor_scene", "closure_scene"],
        dominantThreadFamilies: ["book1-continuity-survival", "book1-red-river-route-setting"],
        latentThreadFamilies: ["book1-philosophy-reading-signs"],
        delayedConvergenceMarkers: ["book1-ch01:route-pressure-cluster"],
        callbackMarkers: ["book1-ch01:seed:2"],
        reinterpretationAnchorIds: ["book1-chapter-01:book1-chapter-01-scene-02:reinterpret"],
        routeCoverageStatus: "satisfied",
        philosophyPropagationStatus: "active_non_preachy",
        densityScore: 0.72,
        thinnessWarnings: [],
        chapterClosureProfile: "convergence_teased",
        carryForwardUnresolvedPressureSummary: ["Keep route pressure unresolved at chapter close."],
      },
      sequenceArchitecture: {
        chapterId: "book1-chapter-01",
        dominantFunction: "grounding",
        secondaryFunctions: ["disturbance"],
        readerEnergyRole: "expansion_push",
        functionTimeline: [
          { chapterId: "book1-chapter-01", dominantFunction: "grounding" },
          { chapterId: "book1-chapter-02", dominantFunction: "disturbance" },
        ],
        convergenceWindows: ["chapter-07", "chapter-08"],
        recallWindows: ["chapter-03", "chapter-06"],
        sequenceWarnings: [],
        sequenceScore: 0.84,
      },
      sceneGeneration: {
        generatedSceneCount: 4,
        sceneRolesInRuntimeOrder: ["grounding_scene", "warning_scene", "rumor_scene", "closure_scene"],
        sceneThreadMix: [{ scenePlanId: "book1-chapter-01-scene-01", activeThreadCount: 2, latentThreadCount: 1 }],
        sceneRoutePresence: [{ scenePlanId: "book1-chapter-01-scene-01", routeBindings: ["natchitoches"] }],
        sceneProseModes: [{ scenePlanId: "book1-chapter-01-scene-01", proseConstraintId: "constraints-scene-01" }],
        sceneLiteraryProfiles: [{ scenePlanId: "book1-chapter-01-scene-01", literaryPlanId: "literary-scene-01" }],
        transitionTypes: ["soft_echo", "delayed_bind_cut", "closure_open_cut"],
        callbackMarkersTriggered: ["book1-chapter-01-scene-02:seed"],
        delayedConvergenceMarkersPresent: ["book1-chapter-01-scene-02:key"],
        reinterpretationAnchorsPresent: ["book1-chapter-01:anchor"],
        sceneBundleWarnings: [],
        chapterRuntimeDensitySummary: "threads=0.7,routes=0.5,flattening=0.2",
      },
      literaryDevices: {
        chapterId: "book1-chapter-01",
        activeDevicePanel: [
          {
            deviceId: "alliteration",
            activationMode: "subtle",
            densityBand: "rare",
            scope: "scene",
            contexts: ["environment", "memory"],
            misuseRisk: "low",
            currentChapterApplicationStatus: "active",
          },
        ],
        symbolRegistry: [
          {
            symbolId: "sym-riverline",
            symbolName: "Riverline Height",
            carriers: ["place", "weather"],
            threadBindings: ["book1-red-river-route-setting"],
            settingBindings: ["red-river-edge"],
            payoffWindow: "chapter_04_to_05",
            callbackWindow: "chapter_02_opening",
          },
        ],
        motifRegistry: [
          {
            motifId: "motif-water-warning",
            motifName: "Water warning",
            boundThreadIds: ["book1-warning-under-routine"],
            recurrenceTarget: "patterned",
          },
        ],
        routeEchoControls: {
          activationMode: "moderate",
          densityBand: "patterned",
          boundRoutes: ["red-river-corridor"],
        },
        philosophyEchoControls: {
          activationMode: "moderate",
          explicitnessCeiling: "low",
          carrierModes: ["action", "warning_sign"],
        },
        alliterationControl: {
          activationMode: "subtle",
          densityBand: "rare",
          numericInput: 31,
          mappedDensityBand: "occasional",
          allowedLineZones: ["descriptive_line"],
          forbiddenLineZones: ["high_tension_decision_line"],
          consonantClusteringTolerance: 0.32,
        },
        densityWarnings: [],
        misuseWarnings: [],
        chapterLiteraryProfileSummary: "Bound symbolic profile active.",
        perSceneDeviceDistribution: [{ sceneId: "book1-ch01-sc01", activeDeviceCount: 4, overloadRisk: "moderate" }],
        literaryDriftWarnings: [],
      },
      epicContinuity: {
        epicId: "campti-epic",
        chapterId: "book1-chapter-01",
        currentQuestionExpression: "How do people preserve belonging when place destabilizes?",
        activeAnchorIds: ["anchor-river-witness", "anchor-phrase-warning"],
        anchorRecurrenceHealth: 0.84,
        identityPersistenceStatus: "strained_but_persistent",
        meaningEscalationStatus: "early-book-seeding-active",
        readerMemoryTargets: ["memory-target-warning-phrase"],
        hookLayerStatus: ["line_scene_curiosity:active", "epic_question_curiosity:active"],
        temporalTransitionHealth: "transition-continuity-healthy",
        disconnectionWarnings: [],
        unresolvedEpicContinuityRisks: [],
      },
      emotionalGravity: {
        epicId: "campti-epic",
        chapterId: "book1-chapter-01",
        attachmentStatusByCharacter: ["natchitoches-matriarch-keeper:bond=protectiveness|grief_attachment:intensity=0.9"],
        activeFearDesireVulnerabilityLines: ["fear-mk-1", "desire-mk-1", "exposure-mk-1"],
        consequenceIrreversibilityMarkers: ["irr-1:emotionally_irreversible:trust fracture shadow"],
        fateAgencyPressureMap: ["patterns=2", "break_attempts=1"],
        relationalStakesMap: ["bond-keeper-younger:strength=0.86"],
        generationalBurdenStatus: ["burdens=2", "silences=1", "reclaims=1"],
        emotionalCarryForwardSummary: ["carry-era-1650-1960:dread=0.7:hope=0.49:ache=0.78"],
        temporalEmotionalContinuityHealth: "temporal-emotional-continuity-healthy",
        emotionallyThinWarnings: [],
        resetHeavyWarnings: [],
        epicEmotionalGravityScore: 0.82,
        diagnostics: ["attachment lines active", "consequence shadow tracked"],
      },
      narratorPresence: {
        chapterId: "book1-chapter-01",
        currentNarratorPresenceLevel: "reflective",
        narratorAuthorityMode: "lineage_aware",
        narratorKnowledgeMode: "inherited",
        convergenceStage: "lineage_aware_guide",
        upcomingConvergenceTriggers: ["approaching_grandfather_line", "approaching_father_line"],
        narratorHookContinuityContribution: 0.67,
        narratorCharacterBoundaryWarnings: [],
        temporalBridgeStatus: "narrator-bridge-healthy",
        firstPersonReadinessStatus: "not-yet-ready",
        voiceShiftRisks: ["avoid abrupt first-person jump without trigger chain"],
      },
    });

    assert.equal(bundle.context.scope, "chapter");
    assert.equal(bundle.runtimeAuthority.runtimeId, RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
    assert.equal(bundle.bounded, true);
    assert.equal(bundle.explainable, true);
    assert.equal(bundle.availableActions.includes("escalate_scope"), true);
    assert.equal(bundle.indicatorBank.scope, "chapter");
    assert.equal(bundle.beatAssembly?.beatCount, 10);
    assert.equal(bundle.chapterState?.chapterId, "book1-chapter-01");
    assert.equal(bundle.narrativePsychology?.chapterPsychologyMode, "rooted_continuity");
    assert.equal(bundle.proseConstraints?.compliant, true);
    assert.equal(bundle.beatGating?.blocked, false);
    assert.equal(bundle.narrativeThreads?.activeThreadIds.length, 2);
    assert.equal(bundle.narrativeThreads?.sceneDensity.length, 2);
    assert.equal(bundle.chapterComposition?.compositionMode, "delayed_convergence");
    assert.equal(bundle.chapterComposition?.sceneCount, 4);
    assert.equal(bundle.sequenceArchitecture?.dominantFunction, "grounding");
    assert.equal(bundle.sceneGeneration?.generatedSceneCount, 4);
    assert.equal(bundle.literaryDevices?.activeDevicePanel.length, 1);
    assert.equal(bundle.epicContinuity?.epicId, "campti-epic");
    assert.equal(bundle.epicContinuity?.anchorRecurrenceHealth, 0.84);
    assert.equal(bundle.emotionalGravity?.epicId, "campti-epic");
    assert.equal(bundle.emotionalGravity?.epicEmotionalGravityScore, 0.82);
    assert.equal(bundle.narratorPresence?.currentNarratorPresenceLevel, "reflective");
    assert.equal(bundle.narratorPresence?.convergenceStage, "lineage_aware_guide");
  });
});
