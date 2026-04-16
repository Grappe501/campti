import {
  SceneGenerationValidationReportSchema,
  type GeneratedChapterSceneBundle,
  type SceneGenerationValidationReport,
} from "@/lib/domain/scene-generation-engine";
import {
  assertClaimedAuthorityClass,
  createRuntimeAuthorityStamp,
} from "@/lib/services/runtime-authority-registry-service";

export class GeneratedSceneBundleValidationService {
  validate(bundle: GeneratedChapterSceneBundle, runtimeId: string): SceneGenerationValidationReport {
    const hardFailures: string[] = [];
    const softWarnings: string[] = [];
    const sceneLevelDiagnostics: SceneGenerationValidationReport["sceneLevelDiagnostics"] = [];
    const runtimeAuthority = createRuntimeAuthorityStamp(runtimeId);
    assertClaimedAuthorityClass(runtimeId, bundle.runtimeAuthority.authorityClass);

    const uniqueRoles = new Set(bundle.generatedScenes.map((scene) => scene.sceneRole));
    if (uniqueRoles.size <= 1) hardFailures.push("scene_flattening_detected");

    const hasCallback = bundle.generatedScenes.some((scene) => scene.callbackSeedsTriggered.length > 0);
    if (!hasCallback) hardFailures.push("callback_plan_loss");

    const hasDelayed = bundle.generatedScenes.some((scene) => scene.delayedConvergenceKeysPresent.length > 0);
    if (!hasDelayed) hardFailures.push("delayed_convergence_loss");

    const hasReinterpret = bundle.generatedScenes.some((scene) => scene.reinterpretationAnchorsPresent.length > 0);
    if (!hasReinterpret) softWarnings.push("reinterpretation_anchor_loss");

    if (!bundle.runtimeAuthority.isCanonicalProduction) {
      hardFailures.push("noncanonical_runtime_claimed_generated_bundle");
    }
    if (bundle.runtimeAuthority.runtimeId !== runtimeId) {
      hardFailures.push("runtime_id_mismatch_for_bundle_authority");
    }

    for (const scene of bundle.generatedScenes) {
      const warnings: string[] = [];
      if (scene.activeThreads.length === 0) warnings.push("missing_thread_coverage");
      if (scene.routeBindings.length === 0) warnings.push("missing_route_presence");
      if (scene.generationWarnings.length > 2) warnings.push("high_generation_warning_density");
      if (scene.runtimeAuthority.runtimeId !== runtimeId) warnings.push("scene_runtime_authority_mismatch");
      if (!scene.runtimeAuthority.isCanonicalProduction) warnings.push("scene_noncanonical_generation");
      if (warnings.length > 0) {
        sceneLevelDiagnostics.push({ scenePlanId: scene.scenePlanId, warnings });
      }
    }

    if (bundle.generatedScenes.length < 3) softWarnings.push("thin_chapter_output_vs_multiscene_target");
    if (bundle.densitySummary.flatteningRisk > 0.7) softWarnings.push("high_flattening_risk");
    if (bundle.proseComplianceSummary.compliantScenes < bundle.generatedScenes.length) softWarnings.push("prose_constraint_noncompliance");

    return SceneGenerationValidationReportSchema.parse({
      artifact: "scene_generation_validation_report",
      schemaVersion: "1.0.0",
      chapterId: bundle.chapterId,
      hardFailures,
      softWarnings,
      sceneLevelDiagnostics,
      chapterBundleDiagnostics: [
        `generatedScenes=${bundle.generatedScenes.length}`,
        `flatteningRisk=${bundle.densitySummary.flatteningRisk}`,
        `routeCoverage=${bundle.routePresenceSummary.length}`,
      ],
      runtimeAuthority,
    });
  }
}

