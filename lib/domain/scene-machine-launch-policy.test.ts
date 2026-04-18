/**
 * Machine / rehearsal launch policy (node:test).
 * Run: npx tsx --test lib/domain/scene-machine-launch-policy.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import { DEFAULT_SCENE_MACHINE_LAUNCH_POLICY } from "@/lib/domain/scene-guarded-launch";
import {
  decideInteractiveLaunchProceed,
  decideMachineLaunchProceed,
  machineLaunchRequiresRiskElevation,
} from "@/lib/domain/scene-machine-launch-policy";

function vm(overrides: Partial<SceneGenerationPreflightViewModel["summary"]> = {}): SceneGenerationPreflightViewModel {
  return {
    contractVersion: "1",
    sceneId: "s1",
    summary: {
      overallReadinessClass: "ready",
      launchAllowance: "allowed",
      headline: "ok",
      evaluatedAtIso: "2026-04-18T12:00:00.000Z",
      primaryBlockerCount: 0,
      primaryRiskCount: 0,
      advisoryCount: 0,
      observationalCount: 0,
      ...overrides,
    },
    subsystems: [],
    blockers: [],
    risks: [],
    advisories: [],
    observations: [],
    inputTruth: {
      loadSucceeded: true,
      loadError: null,
      sceneId: "s1",
      chapterId: "c1",
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
      hashPreview: "abc",
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
}

describe("machineLaunchRequiresRiskElevation", () => {
  it("is true for allowed_with_risk", () => {
    assert.equal(
      machineLaunchRequiresRiskElevation(vm({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" })),
      true,
    );
  });

  it("is true for rehearsal_incomplete even when allowance is allowed", () => {
    assert.equal(
      machineLaunchRequiresRiskElevation(vm({ launchAllowance: "allowed", overallReadinessClass: "rehearsal_incomplete" })),
      true,
    );
  });

  it("is false for clean allowed + ready", () => {
    assert.equal(machineLaunchRequiresRiskElevation(vm()), false);
  });
});

describe("decideMachineLaunchProceed", () => {
  it("denies blocked", () => {
    const d = decideMachineLaunchProceed(
      vm({ launchAllowance: "blocked", overallReadinessClass: "blocked", headline: "stop" }),
      DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
    );
    assert.equal(d.proceed, false);
    assert.equal(d.code, "launch_blocked");
  });

  it("denies allowed_with_risk by default (no human ack)", () => {
    const d = decideMachineLaunchProceed(
      vm({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" }),
      DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
    );
    assert.equal(d.proceed, false);
    assert.equal(d.code, "machine_policy_denied_risk");
    assert.equal(d.confirmationMode, "machine_policy_denied");
  });

  it("allows allowed_with_risk when machine policy explicitly elevates", () => {
    const d = decideMachineLaunchProceed(
      vm({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" }),
      { allowMachineRiskyLaunch: true },
    );
    assert.equal(d.proceed, true);
    assert.equal(d.confirmationMode, "machine_policy_allowed");
  });

  it("allows clean allowed", () => {
    const d = decideMachineLaunchProceed(vm(), DEFAULT_SCENE_MACHINE_LAUNCH_POLICY);
    assert.equal(d.proceed, true);
    assert.equal(d.confirmationMode, "machine_not_required");
  });

  it("denies rehearsal_incomplete elevation by default", () => {
    const d = decideMachineLaunchProceed(
      vm({ launchAllowance: "allowed", overallReadinessClass: "rehearsal_incomplete" }),
      DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
    );
    assert.equal(d.proceed, false);
    assert.equal(d.code, "machine_policy_denied_risk");
  });
});

describe("decideInteractiveLaunchProceed", () => {
  it("denies allowed_with_risk without acknowledgement", () => {
    const d = decideInteractiveLaunchProceed(
      vm({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" }),
      { riskAcknowledged: false },
    );
    assert.equal(d.proceed, false);
    assert.equal(d.code, "confirmation_required");
  });

  it("allows allowed_with_risk with acknowledgement", () => {
    const d = decideInteractiveLaunchProceed(
      vm({ launchAllowance: "allowed_with_risk", overallReadinessClass: "downgrade_risk" }),
      { riskAcknowledged: true },
    );
    assert.equal(d.proceed, true);
    assert.equal(d.confirmationMode, "human_confirmed");
  });
});
