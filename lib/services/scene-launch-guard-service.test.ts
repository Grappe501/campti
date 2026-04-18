/**
 * Scene launch guard — freshness digest stability (node:test).
 * Run: npx tsx --test lib/services/scene-launch-guard-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import { computeSceneLaunchFreshnessDigest } from "@/lib/services/scene-launch-guard-service";

function baseVm(overrides: Partial<SceneGenerationPreflightViewModel> = {}): SceneGenerationPreflightViewModel {
  const vm: SceneGenerationPreflightViewModel = {
    contractVersion: "1",
    sceneId: "scene_test",
    summary: {
      overallReadinessClass: "ready",
      launchAllowance: "allowed",
      headline: "ok",
      evaluatedAtIso: "2026-04-18T12:00:00.000Z",
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
      sceneId: "scene_test",
      chapterId: "ch1",
      participatingPeopleCount: 0,
      placesCount: 0,
      narrativeSourceIdsCount: 0,
      ricreBundlePresent: false,
      ricreRecordCount: 0,
      contractValidated: true,
    },
    hashSummary: {
      hashComputed: true,
      hashScheme: "v1",
      hashPreview: "abc…",
      hashError: null,
      protectsSummary: "test",
    },
    honestyBanner: "test",
    ...overrides,
  };
  return vm;
}

describe("computeSceneLaunchFreshnessDigest", () => {
  it("is stable for identical snapshots", () => {
    const a = baseVm();
    const b = baseVm();
    assert.equal(computeSceneLaunchFreshnessDigest(a), computeSceneLaunchFreshnessDigest(b));
  });

  it("changes when evaluatedAtIso changes", () => {
    const a = baseVm();
    const b = baseVm({
      summary: {
        ...baseVm().summary,
        evaluatedAtIso: "2026-04-18T13:00:00.000Z",
      },
    });
    assert.notEqual(computeSceneLaunchFreshnessDigest(a), computeSceneLaunchFreshnessDigest(b));
  });

  it("changes when launch allowance changes", () => {
    const a = baseVm();
    const b = baseVm({
      summary: {
        ...baseVm().summary,
        launchAllowance: "blocked",
        primaryBlockerCount: 1,
      },
    });
    assert.notEqual(computeSceneLaunchFreshnessDigest(a), computeSceneLaunchFreshnessDigest(b));
  });
});
