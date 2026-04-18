/**
 * Run Diff + Outcome Analytics — static verification.
 * Run: npx tsx scripts/verify-run-diff-outcome-analytics.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

async function main() {
  const diff = read("lib/services/scene-run-diff-service.ts");
  assert.ok(diff.includes("buildSceneRunDiffViewModel"), "diff service present");
  assert.ok(diff.includes("SceneRunGovernanceDelta"), "governance delta modeled");
  assert.ok(diff.includes("proseComparisonAvailable"), "output honesty flag");

  const analytics = read("lib/services/scene-run-outcome-analytics-service.ts");
  assert.ok(analytics.includes("buildSceneRunOutcomeAnalytics"), "analytics service present");
  assert.ok(analytics.includes("repeated_risky_launches"), "instability signal codes");

  const client = read("components/admin/scene-run-ledger-client.tsx");
  const actions = read("app/actions/scene-run-analytics.ts");
  assert.ok(actions.includes("loadSceneRunStructuredDiffAction"), "server diff action");
  assert.ok(client.includes("loadSceneRunStructuredDiffAction"), "UI calls server diff");
  assert.ok(client.includes("Outcome analytics"), "UI exposes analytics");
  assert.ok(client.includes("Structured run diff"), "UI exposes structured diff");

  console.log("[verify-run-diff-outcome-analytics] OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
