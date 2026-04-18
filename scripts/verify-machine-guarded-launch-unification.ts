/**
 * Machine Guarded Launch Unification — static perimeter check.
 * Run: npx tsx scripts/verify-machine-guarded-launch-unification.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

function assertContains(file: string, needle: string, message: string) {
  const body = read(file);
  assert.ok(body.includes(needle), `${file}: ${message}`);
}

function assertLacksDirectRunSceneGeneration(file: string, message: string) {
  const body = read(file);
  const re = /\brunSceneGeneration\s*\(/g;
  if (!re.test(body)) return;
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.includes("runSceneGeneration(") && !line.trim().startsWith("//")) {
      throw new Error(`${file}:${i + 1} — ${message}\n${line.trim()}`);
    }
  }
}

async function main() {
  assertContains(
    "lib/services/scene-repair-execution-service.ts",
    "executeMachineGuardedSceneLaunch",
    "scene repair must use machine guarded launch",
  );
  assertLacksDirectRunSceneGeneration(
    "lib/services/scene-repair-execution-service.ts",
    "repair service must not call runSceneGeneration directly",
  );

  assertContains(
    "lib/services/author-workflow-orchestration-service.ts",
    "executeMachineGuardedSceneLaunch",
    "draft package orchestration must use machine guarded launch",
  );
  assertLacksDirectRunSceneGeneration(
    "lib/services/author-workflow-orchestration-service.ts",
    "orchestration must not call runSceneGeneration directly",
  );

  assertContains(
    "scripts/cluster9-final-dry-run.ts",
    "executeRehearsalGuardedSceneLaunch",
    "cluster9 dry-run must use rehearsal guarded launch",
  );
  assertLacksDirectRunSceneGeneration(
    "scripts/cluster9-final-dry-run.ts",
    "cluster9 script must not call runSceneGeneration directly",
  );

  assertContains(
    "lib/services/scene-launch-guard-service.ts",
    "executeGuardedSceneLaunch",
    "guard service must expose unified execution core",
  );

  const guardSvc = read("lib/services/scene-launch-guard-service.ts");
  const runCount = (guardSvc.match(/\brunSceneGeneration\s*\(/g) ?? []).length;
  assert.equal(runCount, 1, "scene-launch-guard-service should have a single runSceneGeneration call site");

  console.log("[verify-machine-guarded-launch-unification] OK — canonical bypass callers refactored");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
