"use server";

import {
  orchestrateBookProductionPackage,
  orchestrateChapterProductionPackage,
  orchestrateSceneDraftPackage,
} from "@/lib/services/author-workflow-orchestration-service";
import type { RunSceneGenerationParams } from "@/lib/services/scene-generation-service";

export async function actionOrchestrateSceneDraftPackage(
  sceneId: string,
  params?: RunSceneGenerationParams
) {
  return orchestrateSceneDraftPackage(sceneId, params);
}

export async function actionOrchestrateChapterProductionPackage(
  chapterId: string,
  options?: { persistAssembly?: boolean; runAssembly?: boolean }
) {
  return orchestrateChapterProductionPackage(chapterId, options);
}

export async function actionOrchestrateBookProductionPackage(bookId: string) {
  return orchestrateBookProductionPackage(bookId);
}
