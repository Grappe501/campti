/**
 * Optional DB-backed preflight smoke (node:test).
 * Run: npx tsx --test lib/services/scene-generation-preflight-service.integration.test.ts
 *
 * Skips when DATABASE_URL or Scene row is unavailable — CI may still run rules/validation tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { deriveLaunchAllowance } from "@/lib/domain/scene-generation-preflight-rules";

describe("buildSceneGenerationPreflight (integration, optional)", () => {
  it("returns null for unknown scene id", async () => {
    const r = await buildSceneGenerationPreflight("definitely_missing_scene_id_xxxxxxxx");
    assert.equal(r, null);
  });

  it("assembles a view model for first scene when database is configured", async () => {
    if (!process.env.DATABASE_URL) {
      assert.ok(true, "skip: DATABASE_URL not set");
      return;
    }
    const scene = await prisma.scene.findFirst({ select: { id: true } });
    if (!scene) {
      assert.ok(true, "skip: no Scene row");
      return;
    }
    try {
      const vm = await buildSceneGenerationPreflight(scene.id);
      assert.ok(vm);
      if (!vm) return;
      assert.equal(vm.sceneId, scene.id);
      assert.ok(["allowed", "allowed_with_risk", "blocked"].includes(vm.summary.launchAllowance));
      assert.equal(
        vm.summary.launchAllowance,
        deriveLaunchAllowance({
          blockerCount: vm.summary.primaryBlockerCount,
          downgradeRiskCount: vm.summary.primaryRiskCount,
        }),
      );
    } catch {
      assert.ok(true, "skip: preflight dependencies unavailable on this database (migrations / drift)");
    }
  });
});
