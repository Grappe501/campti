/**
 * Caller-path wiring for machine guarded launch (node:test).
 * Run: npx tsx --test lib/services/machine-guarded-launch-path.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = path.join(process.cwd(), "lib", "services");

describe("machine guarded launch caller paths", () => {
  it("wires revision jobs through executeSceneRepair with revision_job launchSource", () => {
    const body = readFileSync(path.join(root, "revision-job-runner.ts"), "utf-8");
    assert.ok(body.includes('launchSource: "revision_job"'));
    assert.ok(body.includes("auditMeta: { revisionJobId: job.id"));
  });

  it("wires draft package orchestration through executeMachineGuardedSceneLaunch", () => {
    const body = readFileSync(path.join(root, "author-workflow-orchestration-service.ts"), "utf-8");
    assert.ok(body.includes("executeMachineGuardedSceneLaunch"));
    assert.ok(body.includes('launchSource: "draft_package_orchestration"'));
  });
});
