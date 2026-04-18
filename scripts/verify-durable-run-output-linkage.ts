/**
 * Durable run ↔ output linkage + bounded delta — static verification.
 * Run: npx tsx scripts/verify-durable-run-output-linkage.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

async function main() {
  const schema = read("prisma/schema.prisma");
  assert.ok(schema.includes("model SceneRunGenerationOutput"), "Prisma model SceneRunGenerationOutput");
  assert.ok(schema.includes("ledgerRunKey"), "ledgerRunKey on output model");

  const persist = read("lib/services/scene-run-generation-output-persist-service.ts");
  assert.ok(persist.includes("persistSceneRunGenerationOutputRecord"), "persist service entrypoint");

  const delta = read("lib/services/scene-run-output-delta-service.ts");
  assert.ok(delta.includes("computeBoundedSceneRunOutputDiff"), "bounded diff compute");
  assert.ok(delta.includes("buildBoundedOutputDiffForLedgerKeys"), "ledger-key diff loader");

  const ledger = read("lib/services/scene-run-ledger-service.ts");
  assert.ok(ledger.includes("attachPersistedOutputs"), "ledger attaches persisted outputs");
  assert.ok(ledger.includes("linked_output"), "ledger linkage vocabulary");

  const diffSvc = read("lib/services/scene-run-diff-service.ts");
  assert.ok(diffSvc.includes("boundedComparison"), "diff VM carries bounded comparison");

  const action = read("app/actions/scene-run-analytics.ts");
  assert.ok(action.includes("buildBoundedOutputDiffForLedgerKeys"), "server action loads bounded diff");

  const linkageDomain = read("lib/domain/scene-run-output-linkage.ts");
  assert.ok(linkageDomain.includes("legacy_output_unknown"), "honest legacy status in domain");

  const ui = read("components/admin/scene-run-ledger-client.tsx");
  assert.ok(ui.includes("Bounded prose comparison"), "ledger UI surfaces bounded panel");

  console.log("[verify-durable-run-output-linkage] OK — linkage model, delta service, ledger merge, diff action, UI present.");
  console.log("Run: npm run verify:durable-run-output-linkage (includes unit tests)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
