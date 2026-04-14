"use server";

import {
  markStuckRunningRevisionJobsFailed,
  processOnePendingRevisionJob,
  runRevisionJobById,
} from "@/lib/services/revision-job-runner";

/**
 * Operational entry: mark long-RUNNING jobs failed, then process one PENDING job (claim + execute).
 * Intended for cron or manual admin invocation — not a background daemon.
 */
export async function actionProcessRevisionJobsTick() {
  const stuck = await markStuckRunningRevisionJobsFailed();
  const processed = await processOnePendingRevisionJob();
  return { stuck, processed };
}

/** Run a single job by id (must be PENDING — RUNNING is rejected to avoid double execution). */
export async function actionRunRevisionJobById(jobId: string) {
  return runRevisionJobById(jobId);
}
