import type { BeatAssemblyChain } from "@/lib/domain/beat-assembly";
import type { ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import type { LiteraryDeviceControlSetting } from "@/lib/domain/literary-device-control";
import {
  GeneratedChapterSceneBundleSchema,
  GeneratedSceneArtifactSchema,
  type GeneratedChapterSceneBundle,
  type SceneGenerationValidationReport,
} from "@/lib/domain/scene-generation-engine";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";
import { GeneratedSceneBundleValidationService } from "@/lib/services/generated-scene-bundle-validation-service";
import {
  RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
  assertRuntimeCanDriveCanonicalArtifacts,
  createRuntimeAuthorityStamp,
} from "@/lib/services/runtime-authority-registry-service";
import { SceneGenerationRequestDerivationService } from "@/lib/services/scene-generation-request-derivation-service";
import { SceneToBeatPacketService } from "@/lib/services/scene-to-beat-packet-service";
import { SceneToLiteraryDevicePlanService } from "@/lib/services/scene-to-literary-device-plan-service";
import { SceneToProseConstraintsService } from "@/lib/services/scene-to-prose-constraints-service";
import { SceneTransitionPlanningService } from "@/lib/services/scene-transition-planning-service";

function pickPov(scene: ChapterCompositionPlan["sceneSequence"][number]): string {
  return scene.povCandidateWeights.sort((a, b) => b.weight - a.weight)[0]?.povId ?? "natchitoches-matriarch-keeper";
}

export class SceneGenerationEngineService {
  private readonly requestDerivation = new SceneGenerationRequestDerivationService();

  private readonly beatPackets = new SceneToBeatPacketService();

  private readonly prosePackets = new SceneToProseConstraintsService();

  private readonly literaryPackets = new SceneToLiteraryDevicePlanService();

  private readonly transitionPlanner = new SceneTransitionPlanningService();

  private readonly bundleValidation = new GeneratedSceneBundleValidationService();

  run(input: {
    chapterId: string;
    parentBookId: string;
    parentChapterStateId: string;
    parentNarrativePsychologyId: string;
    chapterCompositionPlan: ChapterCompositionPlan;
    sequencePlanId?: string;
    activeThreadPackId: string;
    routeLedgerSnapshot: Record<string, unknown>;
    philosophyPropagationPlanId: string;
    callbackPlanId: string;
    reinterpretationAnchorSetId: string;
    chapterLevelProseConstraints: ProseGenerationConstraints;
    chapterMode: string;
    chapterPsychologyMode: string;
    chapterLevelLiteraryControlSettings: LiteraryDeviceControlSetting[];
    chapterLevelLiteraryDevicePlan: Parameters<
      SceneGenerationRequestDerivationService["derive"]
    >[0]["chapterLevelLiteraryDevicePlan"];
    beatChain: BeatAssemblyChain;
    runtimeId?: string;
  }): {
    request: ReturnType<SceneGenerationRequestDerivationService["derive"]>;
    bundle: GeneratedChapterSceneBundle;
    validation: SceneGenerationValidationReport;
  } {
    const runtimeId = input.runtimeId ?? RUNTIME_ID_SCENE_CHAPTER_PRODUCTION;
    assertRuntimeCanDriveCanonicalArtifacts(runtimeId);
    const runtimeAuthority = createRuntimeAuthorityStamp(runtimeId);

    const request = this.requestDerivation.derive({
      chapterId: input.chapterId,
      parentBookId: input.parentBookId,
      parentChapterStateId: input.parentChapterStateId,
      parentNarrativePsychologyId: input.parentNarrativePsychologyId,
      chapterCompositionPlan: input.chapterCompositionPlan,
      sequencePlanId: input.sequencePlanId,
      activeThreadPackId: input.activeThreadPackId,
      routeLedgerSnapshot: input.routeLedgerSnapshot,
      philosophyPropagationPlanId: input.philosophyPropagationPlanId,
      callbackPlanId: input.callbackPlanId,
      reinterpretationAnchorSetId: input.reinterpretationAnchorSetId,
      chapterLevelProseConstraints: input.chapterLevelProseConstraints,
      chapterLevelLiteraryDevicePlan: input.chapterLevelLiteraryDevicePlan,
    });

    const transitionResult = this.transitionPlanner.derive({
      chapterId: input.chapterId,
      scenes: input.chapterCompositionPlan.sceneSequence,
    });
    const transitionsByFrom = new Map(transitionResult.transitions.map((transition) => [transition.fromScenePlanId, transition]));
    const transitionsByTo = new Map(transitionResult.transitions.map((transition) => [transition.toScenePlanId, transition]));

    const generatedScenes = input.chapterCompositionPlan.sceneSequence.map((scene, index) => {
      const beatPacket = this.beatPackets.derive({
        scene,
        beatChain: input.beatChain,
        sceneIndex: index,
      });
      const prosePacket = this.prosePackets.derive({
        chapterConstraints: input.chapterLevelProseConstraints,
        scene,
      });
      const literaryPacket = this.literaryPackets.derive({
        chapterId: input.chapterId,
        chapterPsychologyMode: input.chapterPsychologyMode,
        chapterMode: input.chapterMode,
        scene,
        beatTypes: beatPacket.selectedBeatTypes,
        activeThreadIds: scene.dominantThreadIds.concat(scene.secondaryThreadIds),
        settingThreadIds: scene.routeBindings,
        philosophyThreadIds: scene.philosophyBindings,
        compositionMode: input.chapterCompositionPlan.compositionMode,
        controlSettings: input.chapterLevelLiteraryControlSettings,
      });
      const generatedText = [
        `Scene ${scene.sceneOrder}: ${scene.sceneRole}.`,
        `POV ${pickPov(scene)} holds ${scene.dominantThreadIds.join(", ") || "continuity hold"} under ${scene.carryForwardPressureType}.`,
        `Route presence: ${scene.routeBindings.join(", ") || "indirect route signal only"}.`,
        scene.delayedConvergenceKeys.length > 0
          ? `Delayed convergence key(s) seeded: ${scene.delayedConvergenceKeys.join(", ")}.`
          : "Connection remains partial; full causality intentionally withheld.",
      ].join(" ");
      const reinterpretAnchors = input.chapterCompositionPlan.reinterpretationAnchors
        .filter((anchor) => anchor.sourceSceneId === scene.scenePlanId)
        .map((anchor) => anchor.reinterpretationAnchorId);

      return GeneratedSceneArtifactSchema.parse({
        artifact: "generated_scene_artifact",
        schemaVersion: "1.0.0",
        generatedSceneId: `${scene.scenePlanId}:generated`,
        chapterId: input.chapterId,
        scenePlanId: scene.scenePlanId,
        sceneOrder: scene.sceneOrder,
        sceneRole: scene.sceneRole,
        povResolved: pickPov(scene),
        activeThreads: scene.dominantThreadIds.concat(scene.secondaryThreadIds),
        latentThreads: scene.latentThreadIds,
        settingBindings: scene.settingBindings,
        routeBindings: scene.routeBindings,
        philosophyBindings: scene.philosophyBindings,
        appliedBeatChainId: beatPacket.packetId,
        appliedProseConstraintsId: prosePacket.proseConstraintId,
        appliedLiteraryDevicePlanId: literaryPacket.applicationPlanId,
        sceneTransitionIn: transitionsByTo.get(scene.scenePlanId) ?? null,
        sceneTransitionOut: transitionsByFrom.get(scene.scenePlanId) ?? null,
        callbackSeedsTriggered: scene.callbackSeeds,
        delayedConvergenceKeysPresent: scene.delayedConvergenceKeys,
        reinterpretationAnchorsPresent: reinterpretAnchors,
        unresolvedPressureOutput: [scene.carryForwardPressureType, scene.sceneClosureType],
        generatedText,
        generationWarnings: beatPacket.validationWarnings.concat(literaryPacket.densityWarnings, literaryPacket.misuseWarnings),
        runtimeAuthority,
        validationFlags: ["scene_generation_runtime", "composition_truth_consumed"],
      });
    });

    const routeDensity = generatedScenes.map((scene) => Math.min(1, scene.routeBindings.length / 2));
    const threadDensity = generatedScenes.map((scene) => Math.min(1, (scene.activeThreads.length + scene.latentThreads.length) / 5));
    const flatteningRisk = generatedScenes.length > 1 && new Set(generatedScenes.map((scene) => scene.sceneRole)).size <= 2 ? 0.82 : 0.31;

    const bundle = GeneratedChapterSceneBundleSchema.parse({
      artifact: "generated_chapter_scene_bundle",
      schemaVersion: "1.0.0",
      chapterId: input.chapterId,
      compositionPlanId: input.chapterCompositionPlan.compositionPlanId,
      generatedScenes,
      sceneOrderSummary: generatedScenes.map((scene) => `${scene.sceneOrder}:${scene.sceneRole}`),
      threadCoverageSummary: generatedScenes.map((scene) => `${scene.scenePlanId}:active=${scene.activeThreads.length},latent=${scene.latentThreads.length}`),
      routePresenceSummary: generatedScenes.map((scene) => `${scene.scenePlanId}:${scene.routeBindings.join("|") || "indirect_only"}`),
      philosophyEchoSummary: generatedScenes
        .filter((scene) => scene.philosophyBindings.length > 0)
        .map((scene) => `${scene.scenePlanId}:${scene.philosophyBindings.join("|")}`),
      callbackSummary: generatedScenes.flatMap((scene) => scene.callbackSeedsTriggered.map((seed) => `${scene.scenePlanId}:${seed}`)),
      delayedConvergenceSummary: generatedScenes
        .flatMap((scene) => scene.delayedConvergenceKeysPresent.map((key) => `${scene.scenePlanId}:${key}`)),
      reinterpretationSummary: generatedScenes
        .flatMap((scene) => scene.reinterpretationAnchorsPresent.map((anchor) => `${scene.scenePlanId}:${anchor}`)),
      adjacencySummary: transitionResult.transitions.map((transition) => `${transition.fromScenePlanId}->${transition.toScenePlanId}:${transition.strategy}`),
      densitySummary: {
        averageThreadDensity: Number((threadDensity.reduce((a, b) => a + b, 0) / Math.max(1, threadDensity.length)).toFixed(3)),
        averageRouteDensity: Number((routeDensity.reduce((a, b) => a + b, 0) / Math.max(1, routeDensity.length)).toFixed(3)),
        sceneCount: generatedScenes.length,
        flatteningRisk,
      },
      proseComplianceSummary: {
        compliantScenes: generatedScenes.filter((scene) => scene.generationWarnings.length === 0).length,
        driftWarnings: generatedScenes.flatMap((scene) =>
          scene.generationWarnings.filter((warning) => warning.includes("drift") || warning.includes("Missing required beat")),
        ),
        literaryWarnings: generatedScenes.flatMap((scene) =>
          scene.generationWarnings.filter((warning) => warning.includes("symbol") || warning.includes("alliteration") || warning.includes("Device")),
        ),
      },
      runtimeAuthority,
      generationWarnings: transitionResult.warnings.concat(transitionResult.blockedPairs.map((pair) => `blocked-adjacency:${pair}`)),
      validationFlags: transitionResult.blockedPairs.length === 0
        ? ["adjacency_valid", "scene_order_explicit"]
        : ["adjacency_blocked_pairs_present"],
    });

    const validation = this.bundleValidation.validate(bundle, runtimeId);
    return {
      request,
      bundle,
      validation,
    };
  }
}

