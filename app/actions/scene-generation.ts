"use server";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { RunSceneGenerationParams } from "@/lib/services/scene-generation-service";
import {
  buildSceneGenerationInputForAction,
  generateSceneDraft,
  repairSceneContinuity,
  rewriteSceneDraft,
  runSceneGeneration,
} from "@/lib/services/scene-generation-service";

export async function actionBuildSceneGenerationInput(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: Parameters<typeof buildSceneGenerationInputForAction>[2]
) {
  return buildSceneGenerationInputForAction(sceneId, proseQaContext, options);
}

/** Full orchestration with optional save + dependency registration + prose QA. */
export async function actionRunSceneGeneration(params: RunSceneGenerationParams) {
  return runSceneGeneration(params);
}

export async function actionGenerateSceneDraft(sceneId: string, opts?: RunSceneGenerationParams) {
  return generateSceneDraft(sceneId, opts);
}

export async function actionRewriteSceneDraft(sceneId: string, opts?: RunSceneGenerationParams) {
  return rewriteSceneDraft(sceneId, opts);
}

export async function actionRepairSceneContinuity(sceneId: string, opts?: RunSceneGenerationParams) {
  return repairSceneContinuity(sceneId, opts);
}
