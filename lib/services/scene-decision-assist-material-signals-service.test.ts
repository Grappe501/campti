/**
 * Assist material signals (node:test). Governance branch only — bounded diff may return null without DB rows.
 * Run: npx tsx --test lib/services/scene-decision-assist-material-signals-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";
import { computeAssistMaterialSignals } from "@/lib/services/scene-decision-assist-material-signals-service";

function baseEntry(key: string, overrides: Partial<SceneRunLedgerEntry> = {}): SceneRunLedgerEntry {
  return {
    ledgerRunKey: key,
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
      freshnessDigestPrefix: "a",
      inputHashPreview: "h1",
      guardEvaluatedAtIso: "2026-04-18T10:00:00.000Z",
      intent: "full_generation",
    },
    historicalPreflight: { headlineNote: null, hashPreview: "h1" },
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
      cluster7RunId: "r1",
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
    replayEligibility: "replay_allowed",
    replayNotes: [],
    ...overrides,
  };
}

describe("computeAssistMaterialSignals", () => {
  it("marks output churn from hints when bounded diff is unavailable", async () => {
    const g0 = baseEntry("z").historicalGuard;
    const entries = [baseEntry("k1"), baseEntry("k2", { historicalGuard: { ...g0, launchAllowance: "blocked" } })];
    const sig = await computeAssistMaterialSignals("s", entries, [
      { code: "recent_opening_fingerprint_shift", text: "x", derivation: "fact" },
    ]);
    assert.equal(sig.outputChurnMaterial, true);
  });

  it("returns combined material when governance delta is material", async () => {
    const g0 = baseEntry("z").historicalGuard;
    const entries = [
      baseEntry("k1", { historicalGuard: { ...g0, blockerCount: 0, inputHashPreview: "h-a" } }),
      baseEntry("k2", {
        historicalGuard: {
          ...g0,
          launchAllowance: "allowed_with_risk",
          blockerCount: 3,
          riskCount: 2,
          inputHashPreview: "h-b",
        },
      }),
    ];
    const sig = await computeAssistMaterialSignals("s", entries, []);
    assert.equal(sig.governanceMaterial, true);
    assert.equal(sig.materialRunDiffCombined, true);
  });
});
