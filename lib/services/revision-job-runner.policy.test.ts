/**
 * Revision job runner policy (pure helpers). Run: npx tsx --test lib/services/revision-job-runner.policy.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_REVISION_JOB_ATTEMPTS, shouldRequeueAfterFailure } from "@/lib/services/revision-job-runner";

describe("shouldRequeueAfterFailure", () => {
  it("requeues when below max attempts", () => {
    assert.equal(shouldRequeueAfterFailure(1, MAX_REVISION_JOB_ATTEMPTS), true);
    assert.equal(shouldRequeueAfterFailure(MAX_REVISION_JOB_ATTEMPTS - 1, MAX_REVISION_JOB_ATTEMPTS), true);
  });

  it("terminal when at or past max attempts", () => {
    assert.equal(shouldRequeueAfterFailure(MAX_REVISION_JOB_ATTEMPTS, MAX_REVISION_JOB_ATTEMPTS), false);
    assert.equal(shouldRequeueAfterFailure(MAX_REVISION_JOB_ATTEMPTS + 1, MAX_REVISION_JOB_ATTEMPTS), false);
  });
});
