/**
 * Run Ledger + Replay Panel — static verification.
 * Run: npx tsx scripts/verify-run-ledger-replay-panel.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

async function main() {
  const action = read("app/actions/scene-run-ledger.ts");
  assert.ok(action.includes("replaySceneRunAction"), "replay action present");
  assert.ok(action.includes("executeGuardedSceneLaunch"), "replay must use guarded launch");
  assert.ok(!action.includes("runSceneGeneration("), "replay action must not call runSceneGeneration directly");

  const policy = read("lib/domain/scene-run-replay-policy.ts");
  assert.ok(policy.includes("replay_blocked"), "replay policy defines blocked path");
  assert.ok(policy.includes("replay_allowed"), "replay policy defines allowed path");

  const svc = read("lib/services/scene-run-ledger-service.ts");
  assert.ok(svc.includes("groupAuditRowsIntoLedgerEntries"), "ledger assembly exported");
  assert.ok(svc.includes("sceneLaunchAuditLog"), "ledger reads audit log");

  const page = read("app/admin/scenes/[id]/page.tsx");
  assert.ok(page.includes("tab=runs") || page.includes('"runs"'), "scene detail exposes runs tab");

  console.log("[verify-run-ledger-replay-panel] OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
