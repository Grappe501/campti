/**
 * Run ledger assembly from audit rows (node:test).
 * Run: npx tsx --test lib/services/scene-run-ledger-assembly.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groupAuditRowsIntoLedgerEntries } from "@/lib/services/scene-run-ledger-service";

type Row = Parameters<typeof groupAuditRowsIntoLedgerEntries>[1][number];

function baseRow(id: string, eventType: string, t: string, overrides: Partial<Row> = {}): Row {
  return {
    id,
    createdAt: new Date(t),
    sceneId: "sc1",
    eventType,
    launchAllowance: "allowed",
    freshnessDigestPrefix: "abcd1234efgh5678",
    blockerCount: 0,
    riskCount: 0,
    advisoryCount: 0,
    confirmationRequired: false,
    riskAcknowledged: false,
    guardEvaluatedAtIso: t,
    inputHashPreview: "hash-prev",
    finalAction: null,
    errorMessage: null,
    intent: "full_generation",
    meta: null,
    launchClass: "interactive",
    launchSource: "interactive_server_action",
    policyMode: "interactive_default",
    confirmationMode: "human_not_required",
    ...overrides,
  } as Row;
}

describe("groupAuditRowsIntoLedgerEntries", () => {
  it("pairs start and completion into one entry (newest first)", () => {
    const rows = [
      baseRow("a1", "launch_confirmed_and_started", "2026-04-18T10:00:00.000Z"),
      baseRow("a2", "launch_allowed_clean_completed", "2026-04-18T10:00:05.000Z"),
    ];
    const entries = groupAuditRowsIntoLedgerEntries("sc1", rows);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.output.generationFinished, true);
    assert.equal(entries[0]?.audit.startAuditId, "a1");
    assert.equal(entries[0]?.audit.endAuditId, "a2");
    assert.equal(entries[0]?.output.linkageStatus, "legacy_output_unknown");
  });

  it("emits orphan when no completion", () => {
    const rows = [baseRow("b1", "launch_confirmed_and_started", "2026-04-18T11:00:00.000Z")];
    const entries = groupAuditRowsIntoLedgerEntries("sc1", rows);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.endedAtIso, null);
    assert.equal(entries[0]?.output.generationFinished, false);
  });

  it("handles rehearsal non-launch row", () => {
    const rows = [
      baseRow("c1", "rehearsal_non_launch_evaluated", "2026-04-18T12:00:00.000Z", {
        launchClass: "rehearsal",
        launchSource: "cluster9_dry_run",
      }),
    ];
    const entries = groupAuditRowsIntoLedgerEntries("sc1", rows);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.output.generationStarted, false);
    assert.equal(entries[0]?.output.linkageStatus, "output_not_persisted_by_policy");
  });
});
