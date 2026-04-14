/**
 * Enqueue-only: durable `RevisionJob` rows. **Execution** is separate — see
 * `lib/services/revision-job-runner.ts` (claim + run + retries).
 */
import { RevisionJobKind, RevisionJobStatus } from "@prisma/client";

import type {
  RevisionJobRepairPayloadV1,
  RevisionTriggerSource,
  SceneRepairMode,
  SceneRepairPlan,
  SceneStalenessReason,
} from "@/lib/domain/scene-repair";
import { SCENE_REPAIR_REVISION_PAYLOAD_VERSION } from "@/lib/domain/scene-repair";
import { prisma } from "@/lib/prisma";

export function buildRevisionJobPayloadForRepair(input: {
  sceneId: string | null;
  chapterId: string | null;
  repairMode: SceneRepairMode;
  stalenessReasons: SceneStalenessReason[];
  triggerSource: RevisionTriggerSource;
  inputSnapshotHash?: string | null;
}): RevisionJobRepairPayloadV1 {
  return {
    contractVersion: SCENE_REPAIR_REVISION_PAYLOAD_VERSION,
    sceneId: input.sceneId,
    chapterId: input.chapterId,
    repairMode: input.repairMode,
    stalenessReasons: input.stalenessReasons,
    triggerSource: input.triggerSource,
    plannedAtIso: new Date().toISOString(),
    inputSnapshotHash: input.inputSnapshotHash ?? null,
  };
}

function revisionKindForRepairMode(mode: SceneRepairMode): RevisionJobKind {
  if (mode === "REASSEMBLE_CHAPTER_ONLY") {
    return RevisionJobKind.REEVALUATE_SCENE;
  }
  if (mode === "NO_AUTOMATIC_REPAIR") {
    throw new Error("Cannot enqueue RevisionJob for NO_AUTOMATIC_REPAIR");
  }
  return RevisionJobKind.REGENERATE_SCENE_AI;
}

/**
 * Enqueues a durable repair job with an explicit, versioned payload.
 */
export async function enqueueSceneRepairJob(plan: SceneRepairPlan): Promise<{ jobId: string } | null> {
  if (plan.repairMode === "NO_AUTOMATIC_REPAIR" || plan.repairMode === "REASSEMBLE_CHAPTER_ONLY") {
    return null;
  }
  const payload = buildRevisionJobPayloadForRepair({
    sceneId: plan.sceneId,
    chapterId: plan.chapterId,
    repairMode: plan.repairMode,
    stalenessReasons: plan.reasons,
    triggerSource: plan.triggerSource,
    inputSnapshotHash: plan.inputSnapshotHash,
  });
  const job = await prisma.revisionJob.create({
    data: {
      kind: revisionKindForRepairMode(plan.repairMode),
      status: RevisionJobStatus.PENDING,
      sceneId: plan.sceneId,
      payload: payload as object,
    },
  });
  return { jobId: job.id };
}

/**
 * Chapter reassembly: `sceneId` is null; `chapterId` lives in the payload (FK is optional on RevisionJob).
 */
export async function enqueueChapterReassemblyJob(input: {
  chapterId: string;
  triggerSource: RevisionTriggerSource;
  stalenessReasons?: SceneStalenessReason[];
  inputSnapshotHash?: string | null;
}): Promise<{ jobId: string }> {
  const payload = buildRevisionJobPayloadForRepair({
    sceneId: null,
    chapterId: input.chapterId,
    repairMode: "REASSEMBLE_CHAPTER_ONLY",
    stalenessReasons: input.stalenessReasons ?? ["chapter_context_changed"],
    triggerSource: input.triggerSource,
    inputSnapshotHash: input.inputSnapshotHash ?? null,
  });
  const job = await prisma.revisionJob.create({
    data: {
      kind: RevisionJobKind.REEVALUATE_SCENE,
      status: RevisionJobStatus.PENDING,
      sceneId: null,
      payload: payload as object,
    },
  });
  return { jobId: job.id };
}

/**
 * Convenience: plan + enqueue when mode allows automated queueing.
 */
export async function enqueueSceneRepairJobFromPlan(plan: SceneRepairPlan): Promise<
  | { ok: true; jobId: string }
  | { ok: false; reason: string }
> {
  if (plan.repairMode === "NO_AUTOMATIC_REPAIR") {
    return { ok: false, reason: "repair_mode_is_no_automatic" };
  }
  if (plan.repairMode === "REASSEMBLE_CHAPTER_ONLY") {
    if (!plan.chapterId) {
      return { ok: false, reason: "chapter_id_required_for_reassembly" };
    }
    const r = await enqueueChapterReassemblyJob({
      chapterId: plan.chapterId,
      triggerSource: plan.triggerSource,
      stalenessReasons: plan.reasons,
      inputSnapshotHash: plan.inputSnapshotHash,
    });
    return { ok: true, jobId: r.jobId };
  }
  const r = await enqueueSceneRepairJob(plan);
  if (!r) {
    return { ok: false, reason: "enqueue_returned_null" };
  }
  return { ok: true, jobId: r.jobId };
}
