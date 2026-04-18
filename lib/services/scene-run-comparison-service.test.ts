/**
 * Run comparison (node:test).
 * Run: npx tsx --test lib/services/scene-run-comparison-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";
import { compareSceneRunEntries } from "@/lib/services/scene-run-comparison-service";

function entry(key: string, allowance: string | null): SceneRunLedgerEntry {
  return {
    ledgerRunKey: key,
    sceneId: "s",
    startedAtIso: "2026-04-18T10:00:00.000Z",
    endedAtIso: "2026-04-18T10:01:00.000Z",
    historyCompleteness: "full",
    historicalGuard: {
      launchAllowance: allowance as SceneRunLedgerEntry["historicalGuard"]["launchAllowance"],
      confirmationRequired: false,
      riskAcknowledged: false,
      blockerCount: 0,
      riskCount: 0,
      advisoryCount: 0,
      freshnessDigestPrefix: "a",
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
      cluster7RunId: null,
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
  };
}

describe("compareSceneRunEntries", () => {
  it("reports allowance change", () => {
    const d = compareSceneRunEntries(entry("k1", "allowed"), entry("k2", "blocked"));
    assert.ok(d.changedFields.includes("launchAllowance"));
  });
});
