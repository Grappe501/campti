"use server";

import type { SceneGenerationLaunchGuardPayload } from "@/lib/domain/scene-launch-guard";
import type { SceneLaunchGuardResult } from "@/lib/domain/scene-launch-guard";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import {
  buildSceneGenerationInputForAction,
  type RunSceneGenerationParams,
} from "@/lib/services/scene-generation-service";
import { executeSceneLaunchAfterGuard } from "@/lib/services/scene-launch-guard-service";

export type GuardedSceneGenerationActionResult =
  | { ok: true; run: Awaited<ReturnType<typeof import("@/lib/services/scene-generation-service").runSceneGeneration>> }
  | { ok: false; code: string; message: string; guard?: SceneLaunchGuardResult };

function stripSceneId(params?: RunSceneGenerationParams): Omit<RunSceneGenerationParams, "sceneId"> | undefined {
  if (!params) return undefined;
  const { sceneId: _sid, ...rest } = params;
  void _sid;
  return rest;
}

export async function actionBuildSceneGenerationInput(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: Parameters<typeof buildSceneGenerationInputForAction>[2]
) {
  return buildSceneGenerationInputForAction(sceneId, proseQaContext, options);
}

/** Full orchestration — requires prior `evaluateSceneLaunchGuardAction` + matching `freshnessDigest`. */
export async function actionRunSceneGeneration(
  params: RunSceneGenerationParams & { launchGuard: SceneGenerationLaunchGuardPayload },
): Promise<GuardedSceneGenerationActionResult> {
  const { launchGuard, sceneId, ...forwarded } = params;
  return executeSceneLaunchAfterGuard(
    {
      sceneId,
      freshnessDigest: launchGuard.freshnessDigest,
      riskAcknowledged: launchGuard.riskAcknowledged,
      intent: "full_generation",
      saveGenerationText: params.saveGenerationText,
      registerDependencies: params.registerDependencies,
      runProseQuality: params.runProseQuality,
    },
    forwarded,
  );
}

export async function actionGenerateSceneDraft(input: {
  sceneId: string;
  launchGuard: SceneGenerationLaunchGuardPayload;
  opts?: RunSceneGenerationParams;
}): Promise<GuardedSceneGenerationActionResult> {
  return executeSceneLaunchAfterGuard(
    {
      sceneId: input.sceneId,
      freshnessDigest: input.launchGuard.freshnessDigest,
      riskAcknowledged: input.launchGuard.riskAcknowledged,
      intent: "draft",
    },
    stripSceneId(input.opts),
  );
}

export async function actionRewriteSceneDraft(input: {
  sceneId: string;
  launchGuard: SceneGenerationLaunchGuardPayload;
  opts?: RunSceneGenerationParams;
}): Promise<GuardedSceneGenerationActionResult> {
  return executeSceneLaunchAfterGuard(
    {
      sceneId: input.sceneId,
      freshnessDigest: input.launchGuard.freshnessDigest,
      riskAcknowledged: input.launchGuard.riskAcknowledged,
      intent: "rewrite",
    },
    stripSceneId(input.opts),
  );
}

export async function actionRepairSceneContinuity(input: {
  sceneId: string;
  launchGuard: SceneGenerationLaunchGuardPayload;
  opts?: RunSceneGenerationParams;
}): Promise<GuardedSceneGenerationActionResult> {
  return executeSceneLaunchAfterGuard(
    {
      sceneId: input.sceneId,
      freshnessDigest: input.launchGuard.freshnessDigest,
      riskAcknowledged: input.launchGuard.riskAcknowledged,
      intent: "repair",
    },
    stripSceneId(input.opts),
  );
}
