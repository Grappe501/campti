/**
 * P3-B — Run the deterministic interaction harness (DB required; no LLM / no ElevenLabs).
 *
 * Usage: npx tsx scripts/run-deterministic-interaction-harness.ts
 */

import { runDeterministicInteractionHarness } from "@/lib/testing/interaction-harness";

void (async () => {
  const summary = await runDeterministicInteractionHarness({ cleanup: true });
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.success ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
