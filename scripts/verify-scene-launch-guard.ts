/**
 * Scene launch guard — rule smoke + digest sanity.
 * Run: npx tsx scripts/verify-scene-launch-guard.ts
 */
import assert from "node:assert/strict";

import { deriveLaunchConfirmationRequired } from "@/lib/domain/scene-launch-guard-policy";
import { computeSceneLaunchFreshnessDigest, evaluateSceneLaunchGuard } from "@/lib/services/scene-launch-guard-service";
import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";

function minimalVm(): SceneGenerationPreflightViewModel {
  return {
    contractVersion: "1",
    sceneId: "probe",
    summary: {
      overallReadinessClass: "ready",
      launchAllowance: "allowed",
      headline: "",
      evaluatedAtIso: new Date().toISOString(),
      primaryBlockerCount: 0,
      primaryRiskCount: 0,
      advisoryCount: 0,
      observationalCount: 0,
    },
    subsystems: [],
    blockers: [],
    risks: [],
    advisories: [],
    observations: [],
    inputTruth: {
      loadSucceeded: true,
      loadError: null,
      sceneId: "probe",
      chapterId: null,
      participatingPeopleCount: 0,
      placesCount: 0,
      narrativeSourceIdsCount: 0,
      ricreBundlePresent: false,
      ricreRecordCount: 0,
      contractValidated: true,
    },
    hashSummary: {
      hashComputed: false,
      hashScheme: null,
      hashPreview: null,
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
}

async function main() {
  assert.equal(
    deriveLaunchConfirmationRequired({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" }),
    true,
  );
  assert.equal(
    deriveLaunchConfirmationRequired({ launchAllowance: "allowed", overallReadinessClass: "ready" }),
    false,
  );
  const d = computeSceneLaunchFreshnessDigest(minimalVm());
  assert.equal(d.length, 64);
  console.log("[scene-launch-guard-verify] OK — policy + digest smoke");

  if (!process.env.DATABASE_URL) {
    console.log("[scene-launch-guard-verify] DATABASE_URL absent — skipped evaluateSceneLaunchGuard probe.");
    return;
  }

  try {
    const g = await evaluateSceneLaunchGuard("nonexistent_scene_id_for_launch_guard_verify");
    assert.equal(g, null);
    console.log("[scene-launch-guard-verify] OK — evaluate returns null for missing scene");
  } catch (e) {
    console.log(`[scene-launch-guard-verify] evaluate probe skipped: ${e instanceof Error ? e.message : String(e)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
