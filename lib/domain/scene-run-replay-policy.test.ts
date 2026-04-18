/**
 * Replay eligibility (node:test).
 * Run: npx tsx --test lib/domain/scene-run-replay-policy.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type { SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";
import { classifyReplayEligibility } from "@/lib/domain/scene-run-replay-policy";

function vm(allowance: SceneGenerationPreflightViewModel["summary"]["launchAllowance"]): SceneGenerationPreflightViewModel {
  const readiness: SceneGenerationPreflightViewModel["summary"]["overallReadinessClass"] =
    allowance === "blocked" ? "blocked" : allowance === "allowed_with_risk" ? "downgrade_risk" : "ready";
  return {
    contractVersion: "1",
    sceneId: "s",
    summary: {
      overallReadinessClass: readiness,
      launchAllowance: allowance,
      headline: "h",
      evaluatedAtIso: "2026-04-18T12:00:00.000Z",
      primaryBlockerCount: allowance === "blocked" ? 1 : 0,
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
      sceneId: "s",
      chapterId: "c",
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
      hashPreview: "x",
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
}

function baseEntry(overrides: Partial<SceneRunLedgerEntry> = {}): SceneRunLedgerEntry {
  return {
    ledgerRunKey: "k1",
    sceneId: "s",
    startedAtIso: "2026-04-18T10:00:00.000Z",
    endedAtIso: "2026-04-18T10:01:00.000Z",
    historyCompleteness: "full",
    historicalGuard: {
      launchAllowance: "allowed",
      confirmationRequired: false,
      riskAcknowledged: false,
      blockerCount: 0,
      riskCount: 0,
      advisoryCount: 0,
      freshnessDigestPrefix: "abc",
      inputHashPreview: "h",
      guardEvaluatedAtIso: "2026-04-18T10:00:00.000Z",
      intent: "full_generation",
    },
    historicalPreflight: { headlineNote: null, hashPreview: "h" },
    audit: {
      startAuditId: "a",
      endAuditId: "b",
      eventTypesObserved: [],
      launchClass: "interactive",
      launchSource: "interactive_server_action",
      policyMode: "interactive_default",
      confirmationMode: "human_not_required",
    },
    output: {
      generationStarted: true,
      generationFinished: true,
      generationFailed: false,
      cluster7RunId: "sg_x",
      persistedOutputKnown: false,
      errorMessagePreview: null,
      linkageStatus: "legacy_output_unknown",
      outputArtifactId: null,
      storedCharacterCount: null,
      storedParagraphCount: null,
      outputCompleteness: null,
      sceneGenerationTextSynced: null,
      openingFingerprint: null,
      endingFingerprint: null,
    },
    replayEligibility: "historical_only",
    replayNotes: [],
    ...overrides,
  };
}

describe("classifyReplayEligibility", () => {
  it("replay_blocked when current preflight blocked", () => {
    const r = classifyReplayEligibility(baseEntry(), { currentPreflight: vm("blocked"), currentFreshnessDigestPrefix: "abcd" });
    assert.equal(r.eligibility, "replay_blocked");
  });

  it("replay_allowed when clean and history full", () => {
    const r = classifyReplayEligibility(baseEntry(), { currentPreflight: vm("allowed"), currentFreshnessDigestPrefix: "abcd" });
    assert.equal(r.eligibility, "replay_allowed");
  });

  it("insufficient_history for legacy completeness", () => {
    const r = classifyReplayEligibility(baseEntry({ historyCompleteness: "legacy" }), {
      currentPreflight: vm("allowed"),
      currentFreshnessDigestPrefix: "abcd",
    });
    assert.equal(r.eligibility, "insufficient_history");
  });

  it("replay_allowed_with_risk when current preflight requires acknowledgement", () => {
    const r = classifyReplayEligibility(baseEntry(), {
      currentPreflight: vm("allowed_with_risk"),
      currentFreshnessDigestPrefix: "abcd",
    });
    assert.equal(r.eligibility, "replay_allowed_with_risk");
  });

  it("insufficient_history when run never terminated", () => {
    const r = classifyReplayEligibility(
      baseEntry({
        output: {
          generationStarted: true,
          generationFinished: false,
          generationFailed: false,
          cluster7RunId: null,
          persistedOutputKnown: false,
          errorMessagePreview: null,
          linkageStatus: "unlinked_output",
          outputArtifactId: null,
          storedCharacterCount: null,
          storedParagraphCount: null,
          outputCompleteness: null,
          sceneGenerationTextSynced: null,
          openingFingerprint: null,
          endingFingerprint: null,
        },
      }),
      { currentPreflight: vm("allowed"), currentFreshnessDigestPrefix: "abcd" },
    );
    assert.equal(r.eligibility, "insufficient_history");
  });

  it("historical_only for non-generation rehearsal row", () => {
    const r = classifyReplayEligibility(
      baseEntry({
        output: {
          generationStarted: false,
          generationFinished: false,
          generationFailed: false,
          cluster7RunId: null,
          persistedOutputKnown: false,
          errorMessagePreview: null,
          linkageStatus: "output_not_persisted_by_policy",
          outputArtifactId: null,
          storedCharacterCount: null,
          storedParagraphCount: null,
          outputCompleteness: null,
          sceneGenerationTextSynced: null,
          openingFingerprint: null,
          endingFingerprint: null,
        },
      }),
      { currentPreflight: vm("allowed"), currentFreshnessDigestPrefix: "abcd" },
    );
    assert.equal(r.eligibility, "historical_only");
  });
});
