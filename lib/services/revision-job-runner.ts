/**
 * RevisionJob execution — single in-repo worker contract (P1-D).
 *
 * **Operational model**
 * - Jobs are rows (`RevisionJob`) with `status` ∈ PENDING → RUNNING → COMPLETED | FAILED.
 * - **This module is the intended execution surface** for processing those rows (cron, script, or
 *   admin action should call `claimNextPendingRevisionJob` + `runClaimedRevisionJob`, or
 *   `runRevisionJobById` which wraps both).
 * - There is still **no long-running daemon in this repository**; something external must invoke
 *   the runner on a schedule or manually. This pass makes that invocation **safe and explicit**.
 *
 * **Claiming (no double execution)**
 * - `claimNextPendingRevisionJob` / `claimRevisionJobById` use `updateMany({ where: { id, status: PENDING }, ... })`
 *   so only one concurrent caller wins the transition to RUNNING. Losers get `null` / `not_pending`.
 * - `attemptCount` increments on each successful claim (each execution attempt).
 *
 * **Idempotency & honesty**
 * - **COMPLETED** / **FAILED** (terminal) jobs are never re-run by this runner (`runRevisionJobById` refuses).
 * - `executeSceneRepair` **re-plans from current DB state**; `RevisionJob.payload` (repair v1) is **audit
 *   context** from enqueue time. Execution may `no_op` or differ if the scene changed — this is
 *   documented, not hidden. Regeneration of `generationText` is only idempotent in the sense of
 *   “safe to overwrite draft”; semantic prose will change if upstream inputs changed.
 * - **Human columns** (`authoringText`, `publishedReaderText`) are never written here (delegates to
 *   existing repair services).
 *
 * **Retries**
 * - On handler failure: if `attemptCount < MAX_REVISION_JOB_ATTEMPTS`, status returns to **PENDING**
 *   for a later claim; `errorMessage` stores the last error. Otherwise **FAILED** (terminal).
 * - Stuck RUNNING rows (crash mid-flight) are surfaced via `markStuckRunningRevisionJobsFailed` (operator
 *   can re-enqueue manually if needed).
 *
 * **Logging**
 * - Structured JSON lines to `console` for claim / start / success / failure / retry / terminal / stuck.
 */

import { RevisionJobKind, RevisionJobStatus, type RevisionJob } from "@prisma/client";

import { isRevisionJobRepairPayloadV1 } from "@/lib/domain/scene-repair";
import { prisma } from "@/lib/prisma";
import { markNarrativeAssemblyStaleFromSceneIds } from "@/lib/services/narrative-revision-service";
import {
  executeChapterReassembly,
  executeSceneRepair,
} from "@/lib/services/scene-repair-execution-service";

/** Max automatic re-queues after failures (attemptCount is incremented on each claim). */
export const MAX_REVISION_JOB_ATTEMPTS = 5;

/** Default “stuck” threshold for RUNNING jobs (worker crash / hung process). */
export const DEFAULT_STUCK_RUNNING_THRESHOLD_MS = 30 * 60 * 1000;

export type RevisionJobClaimResult =
  | { ok: true; job: RevisionJob }
  | { ok: false; reason: "none_pending" | "lost_race" };

export type RevisionJobRunResult =
  | { ok: true; jobId: string; outcome: "completed" }
  | {
      ok: false;
      jobId: string;
      reason:
        | "not_found"
        | "terminal_status"
        | "already_running"
        | "claim_failed"
        | "execution_error"
        | "requeued_or_failed";
      errorMessage?: string;
    };

function logEvent(event: string, fields: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      component: "revision-job-runner",
      event,
      at: new Date().toISOString(),
      ...fields,
    })
  );
}

export function shouldRequeueAfterFailure(attemptCount: number, maxAttempts = MAX_REVISION_JOB_ATTEMPTS): boolean {
  return attemptCount < maxAttempts;
}

/**
 * Atomically move one PENDING job to RUNNING. Retries briefly if another worker wins the same row.
 */
export async function claimNextPendingRevisionJob(): Promise<RevisionJobClaimResult> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const next = await prisma.revisionJob.findFirst({
      where: { status: RevisionJobStatus.PENDING },
      orderBy: { createdAt: "asc" },
    });
    if (!next) {
      return { ok: false, reason: "none_pending" };
    }
    const claimed = await claimRevisionJobById(next.id);
    if (claimed.ok) {
      return claimed;
    }
  }
  return { ok: false, reason: "lost_race" };
}

/**
 * Claim a specific job if still PENDING (transactional single-winner update).
 */
export async function claimRevisionJobById(jobId: string): Promise<RevisionJobClaimResult> {
  const updated = await prisma.revisionJob.updateMany({
    where: { id: jobId, status: RevisionJobStatus.PENDING },
    data: {
      status: RevisionJobStatus.RUNNING,
      startedAt: new Date(),
      attemptCount: { increment: 1 },
    },
  });
  if (updated.count !== 1) {
    logEvent("revision_job.claim_lost_race", { jobId });
    return { ok: false, reason: "lost_race" };
  }
  const job = await prisma.revisionJob.findUniqueOrThrow({ where: { id: jobId } });
  logEvent("revision_job.claimed", {
    jobId: job.id,
    kind: job.kind,
    sceneId: job.sceneId,
    attemptCount: job.attemptCount,
  });
  return { ok: true, job };
}

async function markJobCompleted(jobId: string): Promise<void> {
  await prisma.revisionJob.update({
    where: { id: jobId },
    data: {
      status: RevisionJobStatus.COMPLETED,
      completedAt: new Date(),
      errorMessage: null,
    },
  });
  logEvent("revision_job.completed", { jobId });
}

async function markJobFailedTerminal(jobId: string, message: string): Promise<void> {
  await prisma.revisionJob.update({
    where: { id: jobId },
    data: {
      status: RevisionJobStatus.FAILED,
      completedAt: new Date(),
      errorMessage: message.slice(0, 16_000),
    },
  });
  logEvent("revision_job.failed_terminal", { jobId, errorMessage: message });
}

async function markJobRequeueOrTerminal(job: RevisionJob, error: unknown): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error);
  if (shouldRequeueAfterFailure(job.attemptCount)) {
    await prisma.revisionJob.update({
      where: { id: job.id },
      data: {
        status: RevisionJobStatus.PENDING,
        startedAt: null,
        errorMessage: msg.slice(0, 16_000),
      },
    });
    logEvent("revision_job.requeued_after_failure", {
      jobId: job.id,
      attemptCount: job.attemptCount,
      maxAttempts: MAX_REVISION_JOB_ATTEMPTS,
      errorMessage: msg,
    });
  } else {
    await markJobFailedTerminal(job.id, msg);
  }
}

/**
 * Core work for a RUNNING job row. Does not claim — caller must have claimed already.
 */
export async function runClaimedRevisionJob(job: RevisionJob): Promise<void> {
  logEvent("revision_job.execution_start", { jobId: job.id, kind: job.kind });

  if (job.kind === RevisionJobKind.MARK_STALE) {
    if (!job.sceneId) {
      throw new Error("MARK_STALE requires sceneId");
    }
    await markNarrativeAssemblyStaleFromSceneIds([job.sceneId]);
    return;
  }

  const payload = job.payload;

  if (isRevisionJobRepairPayloadV1(payload)) {
    if (payload.repairMode === "REASSEMBLE_CHAPTER_ONLY" && payload.chapterId) {
      await executeChapterReassembly(payload.chapterId, { persist: true, purpose: "reader_publish" });
      return;
    }
    if (payload.repairMode === "NO_AUTOMATIC_REPAIR") {
      throw new Error("NO_AUTOMATIC_REPAIR should not be enqueued as an executable job");
    }
    const sceneId = payload.sceneId ?? job.sceneId;
    if (!sceneId) {
      throw new Error("Repair payload missing sceneId");
    }
    await executeSceneRepair(sceneId, {
      saveGenerationText: true,
      runProseQuality: true,
      registerDependencies: true,
    });
    return;
  }

  /** Upstream invalidation jobs (`{ reason: "upstream_producer_changed" }`) — re-plan + execute. */
  if (job.sceneId) {
    await executeSceneRepair(job.sceneId, {
      saveGenerationText: true,
      runProseQuality: true,
      registerDependencies: true,
    });
    return;
  }

  throw new Error(
    `Unsupported RevisionJob: kind=${job.kind}, sceneId=${job.sceneId ?? "null"}, payload shape not executable`
  );
}

/**
 * Execute a claimed job and transition to COMPLETED, or FAILED / PENDING retry.
 */
export async function finalizeRevisionJobAfterRun(job: RevisionJob): Promise<void> {
  try {
    await runClaimedRevisionJob(job);
    await markJobCompleted(job.id);
  } catch (e) {
    logEvent("revision_job.execution_error", {
      jobId: job.id,
      error: e instanceof Error ? e.message : String(e),
    });
    await markJobRequeueOrTerminal(job, e);
  }
}

/**
 * Claim (if pending) and run one job by id — primary entry for targeted processing.
 */
export async function runRevisionJobById(jobId: string): Promise<RevisionJobRunResult> {
  const row = await prisma.revisionJob.findUnique({ where: { id: jobId } });
  if (!row) {
    return { ok: false, jobId, reason: "not_found" };
  }
  if (
    row.status === RevisionJobStatus.COMPLETED ||
    row.status === RevisionJobStatus.FAILED ||
    row.status === RevisionJobStatus.CANCELLED
  ) {
    logEvent("revision_job.skip_terminal", { jobId, status: row.status });
    return { ok: false, jobId, reason: "terminal_status" };
  }

  if (row.status === RevisionJobStatus.RUNNING) {
    logEvent("revision_job.skip_already_running", { jobId });
    return { ok: false, jobId, reason: "already_running" };
  }

  const claim = await claimRevisionJobById(jobId);
  if (!claim.ok) {
    return { ok: false, jobId, reason: "claim_failed" };
  }
  const job = claim.job;

  await finalizeRevisionJobAfterRun(job);
  const after = await prisma.revisionJob.findUnique({ where: { id: jobId } });
  if (after?.status === RevisionJobStatus.COMPLETED) {
    return { ok: true, jobId, outcome: "completed" };
  }
  return {
    ok: false,
    jobId,
    reason: "requeued_or_failed",
    errorMessage: after?.errorMessage ?? undefined,
  };
}

/**
 * Process at most one pending job: claim next → run → finalize.
 */
export async function processOnePendingRevisionJob(): Promise<
  RevisionJobRunResult | { ok: false; reason: "none_pending" | "lost_race" }
> {
  const claim = await claimNextPendingRevisionJob();
  if (!claim.ok) {
    return { ok: false, reason: claim.reason };
  }
  await finalizeRevisionJobAfterRun(claim.job);
  const after = await prisma.revisionJob.findUnique({ where: { id: claim.job.id } });
  if (after?.status === RevisionJobStatus.COMPLETED) {
    return { ok: true, jobId: claim.job.id, outcome: "completed" };
  }
  return {
    ok: false,
    jobId: claim.job.id,
    reason: "requeued_or_failed",
    errorMessage: after?.errorMessage ?? undefined,
  };
}

/**
 * Jobs stuck in RUNNING longer than `maxAgeMs` are marked FAILED (crash / lost worker).
 * Does not auto-requeue — avoids duplicate side effects without visibility.
 */
export async function markStuckRunningRevisionJobsFailed(
  maxAgeMs: number = DEFAULT_STUCK_RUNNING_THRESHOLD_MS
): Promise<{ markedFailed: number }> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const stuck = await prisma.revisionJob.findMany({
    where: {
      status: RevisionJobStatus.RUNNING,
      startedAt: { lt: cutoff },
    },
    select: { id: true },
  });
  let markedFailed = 0;
  for (const { id } of stuck) {
    await prisma.revisionJob.update({
      where: { id },
      data: {
        status: RevisionJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: `stuck_running_exceeded_${maxAgeMs}ms`,
      },
    });
    markedFailed++;
    logEvent("revision_job.stuck_marked_failed", { jobId: id, maxAgeMs });
  }
  return { markedFailed };
}
