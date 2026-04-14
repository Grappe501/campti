/**
 * One-shot revision job processor for cron / manual ops.
 *
 * Usage: npx tsx scripts/process-revision-jobs-once.ts
 *
 * 1. Marks RUNNING jobs stuck longer than the default threshold as FAILED.
 * 2. Claims and executes at most one PENDING job.
 *
 * Exit 0 always (inspect JSON stdout). Does not loop — schedule multiple invocations externally.
 */

import {
  markStuckRunningRevisionJobsFailed,
  processOnePendingRevisionJob,
} from "@/lib/services/revision-job-runner";

async function main(): Promise<void> {
  const stuck = await markStuckRunningRevisionJobsFailed();
  const processed = await processOnePendingRevisionJob();
  console.log(JSON.stringify({ stuckMarkedFailed: stuck.markedFailed, processed }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
