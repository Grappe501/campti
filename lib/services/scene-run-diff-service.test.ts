/**
 * Structured run diff (node:test).
 * Run: npx tsx --test lib/services/scene-run-diff-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneRunBoundedOutputDiff } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunLedgerEntry, SceneRunOutputSummary } from "@/lib/domain/scene-run-ledger";
import { buildSceneRunDiffViewModel, suggestDefaultComparison } from "@/lib/services/scene-run-diff-service";

function defaultOutput(over: Partial<SceneRunOutputSummary> = {}): SceneRunOutputSummary {
  return {
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
    ...over,
  };
}

function minimalBoundedDiff(): SceneRunBoundedOutputDiff {
  return {
    bothLinked: true,
    linkageNote: "Both runs have durable snapshots (test).",
    existence: { aPresent: true, bPresent: true, summary: "Both outputs present in linkage store." },
    length: { charDelta: 500, paragraphDelta: 1, charDeltaLabel: "material increase", kind: "fact" },
    opening: { changed: true, summary: "Opening slice fingerprint differs.", kind: "fact" },
    ending: { changed: false, summary: "Ending slice fingerprint matches.", kind: "fact" },
    structure: {
      paragraphCountChanged: true,
      beatMarkersChanged: false,
      summary: "Paragraphs A:2 B:3; beat-like markers A:false B:false.",
      kind: "fact",
    },
    entityMentions: [
      {
        entityId: "p1",
        kind: "person",
        label: "Cheesa",
        countA: 0,
        countB: 2,
        delta: 2,
        kind_note: "fact",
      },
    ],
    signals: [
      {
        code: "length_shift",
        label: "Length changed materially",
        description: "Character count delta +500.",
        derivation: "fact",
      },
    ],
  };
}

function entry(overrides: Partial<SceneRunLedgerEntry> = {}): SceneRunLedgerEntry {
  const { output: outputOver, ...rest } = overrides;
  return {
    ledgerRunKey: "k",
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
      freshnessDigestPrefix: "aaa",
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
    output: defaultOutput(outputOver ?? {}),
    replayEligibility: "replay_allowed",
    replayNotes: [],
    ...rest,
  };
}

describe("buildSceneRunDiffViewModel", () => {
  it("returns null for scene mismatch", () => {
    const a = entry({ sceneId: "s1", ledgerRunKey: "a" });
    const b = entry({ sceneId: "s2", ledgerRunKey: "b" });
    assert.equal(buildSceneRunDiffViewModel(a, b), null);
  });

  it("assembles governance delta", () => {
    const older = entry({
      ledgerRunKey: "o",
      startedAtIso: "2026-04-18T09:00:00.000Z",
      historicalGuard: {
        launchAllowance: "allowed_with_risk",
        confirmationRequired: true,
        riskAcknowledged: true,
        blockerCount: 2,
        riskCount: 1,
        advisoryCount: 0,
        freshnessDigestPrefix: "x",
        inputHashPreview: "h",
        guardEvaluatedAtIso: "2026-04-18T09:00:00.000Z",
        intent: "full_generation",
      },
    });
    const newer = entry({
      ledgerRunKey: "n",
      startedAtIso: "2026-04-18T11:00:00.000Z",
      historicalGuard: {
        launchAllowance: "allowed",
        confirmationRequired: false,
        riskAcknowledged: false,
        blockerCount: 0,
        riskCount: 0,
        advisoryCount: 0,
        freshnessDigestPrefix: "y",
        inputHashPreview: "h2",
        guardEvaluatedAtIso: "2026-04-18T11:00:00.000Z",
        intent: "full_generation",
      },
    });
    const vm = buildSceneRunDiffViewModel(newer, older);
    assert.ok(vm);
    assert.ok(vm!.diff.governance.fields.some((f) => f.field === "launchAllowance" && f.changed));
    assert.ok(vm!.diff.output.proseComparisonAvailable === false);
  });

  it("enables bounded output comparison when snapshots are provided", () => {
    const bounded = minimalBoundedDiff();
    const a = entry({
      ledgerRunKey: "a",
      output: defaultOutput({
        linkageStatus: "linked_output",
        storedCharacterCount: 100,
        storedParagraphCount: 2,
        openingFingerprint: "o1",
        endingFingerprint: "e1",
      }),
    });
    const b = entry({
      ledgerRunKey: "b",
      output: defaultOutput({
        linkageStatus: "linked_output",
        storedCharacterCount: 600,
        storedParagraphCount: 3,
        openingFingerprint: "o2",
        endingFingerprint: "e1",
      }),
    });
    const vm = buildSceneRunDiffViewModel(a, b, bounded);
    assert.ok(vm);
    assert.equal(vm!.diff.output.proseComparisonAvailable, true);
    assert.equal(vm!.diff.output.boundedComparison?.length.charDelta, 500);
    assert.ok(vm!.diff.outcomeSignals.heuristics.some((h) => h.id === "output_churn_bounded"));
  });

  it("labels partial history on legacy row", () => {
    const a = entry({ historyCompleteness: "legacy" });
    const b = entry({ ledgerRunKey: "k2" });
    const vm = buildSceneRunDiffViewModel(a, b);
    assert.ok(vm);
    assert.equal(vm!.diff.overallCompleteness, "legacy_run_history");
  });
});

describe("suggestDefaultComparison", () => {
  it("returns first two entries", () => {
    const p = suggestDefaultComparison([entry({ ledgerRunKey: "1" }), entry({ ledgerRunKey: "2" })]);
    assert.ok(p);
    assert.equal(p!.ledgerRunKeyA, "1");
    assert.equal(p!.ledgerRunKeyB, "2");
  });
});
