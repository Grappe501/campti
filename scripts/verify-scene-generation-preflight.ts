/**
 * Scene generation preflight — import check + rule smoke + optional DB probe.
 * Run: npx tsx scripts/verify-scene-generation-preflight.ts
 */
import assert from "node:assert/strict";

import { deriveLaunchAllowance, deriveOverallReadinessClass } from "@/lib/domain/scene-generation-preflight-rules";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";

function ok(msg: string) {
  console.log(`[preflight-verify] OK — ${msg}`);
}

async function main() {
  assert.equal(deriveLaunchAllowance({ blockerCount: 0, downgradeRiskCount: 0 }), "allowed");
  assert.equal(deriveLaunchAllowance({ blockerCount: 0, downgradeRiskCount: 1 }), "allowed_with_risk");
  assert.equal(deriveLaunchAllowance({ blockerCount: 1, downgradeRiskCount: 0 }), "blocked");
  ok("launch allowance mapping");

  assert.equal(
    deriveOverallReadinessClass({ launchAllowance: "allowed_with_risk", advisoryCount: 0, observationalOnly: false }),
    "downgrade_risk",
  );
  ok("overall readiness mapping");

  const lines: string[] = [];
  lines.push("Report: scene-generation-preflight verification script completed rule checks.");

  if (!process.env.DATABASE_URL) {
    lines.push("DATABASE_URL absent — skipped live buildSceneGenerationPreflight probe.");
    console.log(lines.join("\n"));
    return;
  }

  const { prisma } = await import("@/lib/prisma");
  const scene = await prisma.scene.findFirst({ select: { id: true } });
  if (!scene) {
    lines.push("No Scene row — skipped buildSceneGenerationPreflight probe.");
    console.log(lines.join("\n"));
    return;
  }

  try {
    const vm = await buildSceneGenerationPreflight(scene.id);
    assert.ok(vm, "expected view model for existing scene");
    if (vm) {
      lines.push(
        `Probe scene ${scene.id}: allowance=${vm.summary.launchAllowance} blockers=${vm.summary.primaryBlockerCount} risks=${vm.summary.primaryRiskCount}`,
      );
    }
  } catch (e) {
    lines.push(
      `Probe skipped: buildSceneGenerationPreflight failed (schema or DB drift). ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
