"use server";

import type { RevisionTriggerSource, SceneRepairPlan } from "@/lib/domain/scene-repair";
import type { SceneRepairPlanHints } from "@/lib/services/scene-repair-planning-service";
import {
  enqueueChapterReassemblyJob,
  enqueueSceneRepairJobFromPlan,
} from "@/lib/services/scene-repair-revision-service";
import {
  executeChapterReassembly,
  executeSceneRepair,
  planSceneRepair,
  type ExecuteSceneRepairOptions,
  type SceneRepairExecutionResult,
} from "@/lib/services/scene-repair-execution-service";

export async function actionPlanSceneRepair(
  sceneId: string,
  hints?: SceneRepairPlanHints
): Promise<SceneRepairPlan> {
  return planSceneRepair(sceneId, hints);
}

export async function actionExecuteSceneRepair(
  sceneId: string,
  options?: ExecuteSceneRepairOptions
): Promise<SceneRepairExecutionResult> {
  return executeSceneRepair(sceneId, options);
}

export async function actionEnqueueSceneRepair(sceneId: string, hints?: SceneRepairPlanHints): Promise<
  | { ok: true; jobId: string; plan: SceneRepairPlan }
  | { ok: false; reason: string; plan: SceneRepairPlan }
> {
  const plan = await planSceneRepair(sceneId, hints);
  const r = await enqueueSceneRepairJobFromPlan(plan);
  if (!r.ok) {
    return { ok: false, reason: r.reason, plan };
  }
  return { ok: true, jobId: r.jobId, plan };
}

export async function actionExecuteChapterReassembly(
  chapterId: string,
  options?: { persist?: boolean; purpose?: "author_draft" | "reader_publish" }
) {
  return executeChapterReassembly(chapterId, options);
}

export async function actionEnqueueChapterReassemblyJob(input: {
  chapterId: string;
  triggerSource?: RevisionTriggerSource;
}) {
  return enqueueChapterReassemblyJob({
    chapterId: input.chapterId,
    triggerSource: input.triggerSource ?? "manual_author",
  });
}
