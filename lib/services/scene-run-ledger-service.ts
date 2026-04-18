import type { SceneLaunchAllowance, SceneLaunchIntent } from "@/lib/domain/scene-launch-guard";
import type {
  SceneRunDetailViewModel,
  SceneRunHistoricalGuardSummary,
  SceneRunHistoricalPreflightSummary,
  SceneRunLedgerEntry,
  SceneRunLedgerSummary,
  SceneRunLedgerViewModel,
  SceneRunOutputSummary,
  SceneRunReplayFeasibilityNote,
} from "@/lib/domain/scene-run-ledger";
import { SCENE_RUN_LEDGER_CONTRACT_VERSION } from "@/lib/domain/scene-run-ledger";
import { historyCompletenessFromAuditRow, mergeReplayEligibilityIntoEntry } from "@/lib/domain/scene-run-replay-policy";
import { prisma } from "@/lib/prisma";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { preflightVmToGuardResult } from "@/lib/services/scene-launch-guard-service";
import { computeSceneLedgerRunKey } from "@/lib/utils/scene-ledger-run-key";

type AuditRow = Awaited<ReturnType<typeof loadAuditRowsForScene>>[number];

function loadAuditRowsForScene(sceneId: string, limit: number) {
  return prisma.sceneLaunchAuditLog.findMany({
    where: { sceneId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

function ledgerRunKey(sceneId: string, startId: string, startedAtMs: number): string {
  return computeSceneLedgerRunKey(sceneId, startId, startedAtMs);
}

function isTerminalEvent(eventType: string): boolean {
  return (
    eventType === "launch_allowed_clean_completed" ||
    eventType === "launch_allowed_with_risk_completed" ||
    eventType === "launch_generation_failed"
  );
}

function parseIntent(intent: string | null): SceneLaunchIntent | null {
  if (intent === "full_generation" || intent === "draft" || intent === "rewrite" || intent === "repair") return intent;
  return null;
}

function parseMeta(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) return meta as Record<string, unknown>;
  return {};
}

function cluster7FromMeta(meta: Record<string, unknown>): string | null {
  const v = meta.cluster7RunId;
  return typeof v === "string" ? v : null;
}

function guardFromRow(r: AuditRow): SceneRunHistoricalGuardSummary {
  return {
    launchAllowance: (r.launchAllowance as SceneLaunchAllowance | null) ?? null,
    confirmationRequired: r.confirmationRequired,
    riskAcknowledged: r.riskAcknowledged,
    blockerCount: r.blockerCount,
    riskCount: r.riskCount,
    advisoryCount: r.advisoryCount,
    freshnessDigestPrefix: r.freshnessDigestPrefix,
    inputHashPreview: r.inputHashPreview,
    guardEvaluatedAtIso: r.guardEvaluatedAtIso,
    intent: parseIntent(r.intent),
  };
}

function preflightSummaryFromRow(r: AuditRow): SceneRunHistoricalPreflightSummary {
  const meta = parseMeta(r.meta);
  const headline = typeof meta.headline === "string" ? meta.headline : null;
  return {
    headlineNote: headline,
    hashPreview: r.inputHashPreview,
  };
}

function completenessMerge(a: SceneRunLedgerEntry["historyCompleteness"], b: SceneRunLedgerEntry["historyCompleteness"]) {
  const rank = { insufficient: 0, legacy: 1, partial: 2, full: 3 };
  return rank[a] < rank[b] ? a : b;
}

function rowCompleteness(r: AuditRow): SceneRunLedgerEntry["historyCompleteness"] {
  const base = historyCompletenessFromAuditRow({
    launchClass: r.launchClass,
    freshnessDigestPrefix: r.freshnessDigestPrefix,
    launchSource: r.launchSource,
  });
  return base;
}

function outputDefaults(
  partial: Partial<SceneRunOutputSummary> &
    Pick<SceneRunOutputSummary, "generationStarted" | "generationFinished" | "generationFailed">,
): SceneRunOutputSummary {
  return {
    generationStarted: partial.generationStarted,
    generationFinished: partial.generationFinished,
    generationFailed: partial.generationFailed,
    cluster7RunId: partial.cluster7RunId ?? null,
    persistedOutputKnown: partial.persistedOutputKnown ?? false,
    errorMessagePreview: partial.errorMessagePreview ?? null,
    linkageStatus: partial.linkageStatus ?? "legacy_output_unknown",
    outputArtifactId: partial.outputArtifactId ?? null,
    storedCharacterCount: partial.storedCharacterCount ?? null,
    storedParagraphCount: partial.storedParagraphCount ?? null,
    outputCompleteness: partial.outputCompleteness ?? null,
    sceneGenerationTextSynced: partial.sceneGenerationTextSynced ?? null,
    openingFingerprint: partial.openingFingerprint ?? null,
    endingFingerprint: partial.endingFingerprint ?? null,
  };
}

function buildOutputSummary(start: AuditRow, end: AuditRow | null): SceneRunOutputSummary {
  if (!end) {
    return outputDefaults({
      generationStarted: true,
      generationFinished: false,
      generationFailed: false,
      linkageStatus: "unlinked_output",
    });
  }
  const meta = parseMeta(end.meta);
  const failed = end.eventType === "launch_generation_failed";
  return outputDefaults({
    generationStarted: true,
    generationFinished: !failed,
    generationFailed: failed,
    cluster7RunId: cluster7FromMeta(meta),
    linkageStatus: failed ? "unlinked_output" : "legacy_output_unknown",
    errorMessagePreview: end.errorMessage ? end.errorMessage.slice(0, 280) : null,
  });
}

function buildRehearsalNonLaunchEntry(sceneId: string, row: AuditRow): SceneRunLedgerEntry {
  const key = ledgerRunKey(sceneId, row.id, row.createdAt.getTime());
  const hc = rowCompleteness(row);
  const guard = guardFromRow(row);
  return {
    ledgerRunKey: key,
    sceneId,
    startedAtIso: row.createdAt.toISOString(),
    endedAtIso: row.createdAt.toISOString(),
    historyCompleteness: hc === "full" ? "partial" : hc,
    historicalGuard: guard,
    historicalPreflight: preflightSummaryFromRow(row),
    audit: {
      startAuditId: row.id,
      endAuditId: row.id,
      eventTypesObserved: [row.eventType],
      launchClass: row.launchClass,
      launchSource: row.launchSource,
      policyMode: row.policyMode,
      confirmationMode: row.confirmationMode,
    },
    output: outputDefaults({
      generationStarted: false,
      generationFinished: false,
      generationFailed: false,
      linkageStatus: "output_not_persisted_by_policy",
    }),
    replayEligibility: "historical_only",
    replayNotes: [],
  };
}

function buildCompletedEntry(sceneId: string, start: AuditRow, end: AuditRow): SceneRunLedgerEntry {
  const key = ledgerRunKey(sceneId, start.id, start.createdAt.getTime());
  const hc = completenessMerge(rowCompleteness(start), rowCompleteness(end));
  return {
    ledgerRunKey: key,
    sceneId,
    startedAtIso: start.createdAt.toISOString(),
    endedAtIso: end.createdAt.toISOString(),
    historyCompleteness: hc,
    historicalGuard: guardFromRow(start),
    historicalPreflight: preflightSummaryFromRow(start),
    audit: {
      startAuditId: start.id,
      endAuditId: end.id,
      eventTypesObserved: [start.eventType, end.eventType],
      launchClass: start.launchClass ?? end.launchClass,
      launchSource: start.launchSource ?? end.launchSource,
      policyMode: start.policyMode ?? end.policyMode,
      confirmationMode: start.confirmationMode ?? end.confirmationMode,
    },
    output: buildOutputSummary(start, end),
    replayEligibility: "historical_only",
    replayNotes: [],
  };
}

function buildOrphanEntry(sceneId: string, start: AuditRow): SceneRunLedgerEntry {
  const key = ledgerRunKey(sceneId, start.id, start.createdAt.getTime());
  return {
    ledgerRunKey: key,
    sceneId,
    startedAtIso: start.createdAt.toISOString(),
    endedAtIso: null,
    historyCompleteness: "partial",
    historicalGuard: guardFromRow(start),
    historicalPreflight: preflightSummaryFromRow(start),
    audit: {
      startAuditId: start.id,
      endAuditId: null,
      eventTypesObserved: [start.eventType],
      launchClass: start.launchClass,
      launchSource: start.launchSource,
      policyMode: start.policyMode,
      confirmationMode: start.confirmationMode,
    },
    output: buildOutputSummary(start, null),
    replayEligibility: "insufficient_history",
    replayNotes: ["Run has no completion audit — may have been interrupted."],
  };
}

/**
 * Assemble ledger entries from audit rows (newest-first for display after build).
 */
export function groupAuditRowsIntoLedgerEntries(sceneId: string, rows: AuditRow[]): SceneRunLedgerEntry[] {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const entries: SceneRunLedgerEntry[] = [];
  let pending: AuditRow | null = null;

  const flushOrphan = () => {
    if (!pending) return;
    entries.push(buildOrphanEntry(sceneId, pending));
    pending = null;
  };

  for (const row of sorted) {
    if (row.eventType === "rehearsal_non_launch_evaluated") {
      flushOrphan();
      entries.push(buildRehearsalNonLaunchEntry(sceneId, row));
      continue;
    }

    if (row.eventType === "launch_confirmed_and_started") {
      flushOrphan();
      pending = row;
      continue;
    }

    if (pending && isTerminalEvent(row.eventType)) {
      entries.push(buildCompletedEntry(sceneId, pending, row));
      pending = null;
      continue;
    }
  }
  flushOrphan();

  return entries.reverse();
}

async function buildRawLedgerEntries(sceneId: string, limit: number): Promise<SceneRunLedgerEntry[]> {
  const rows = await loadAuditRowsForScene(sceneId, Math.min(limit * 3, 500));
  return groupAuditRowsIntoLedgerEntries(sceneId, rows).slice(0, limit);
}

function withReplayContext(entries: SceneRunLedgerEntry[], vm: Awaited<ReturnType<typeof buildSceneGenerationPreflight>>, digestPrefix: string | null) {
  return entries.map((e) =>
    mergeReplayEligibilityIntoEntry(e, {
      currentPreflight: vm,
      currentFreshnessDigestPrefix: digestPrefix,
    }),
  );
}

type OutputRow = {
  id: string;
  ledgerRunKey: string;
  characterCount: number;
  paragraphCount: number;
  outputCompleteness: string;
  sceneGenerationTextSynced: boolean;
  openingFingerprint: string;
  endingFingerprint: string;
};

async function attachPersistedOutputs(sceneId: string, entries: SceneRunLedgerEntry[]): Promise<SceneRunLedgerEntry[]> {
  if (entries.length === 0) return entries;
  const keys = entries.map((e) => e.ledgerRunKey);
  let rows: OutputRow[] = [];
  try {
    rows = await prisma.sceneRunGenerationOutput.findMany({
      where: { sceneId, ledgerRunKey: { in: keys } },
      select: {
        id: true,
        ledgerRunKey: true,
        characterCount: true,
        paragraphCount: true,
        outputCompleteness: true,
        sceneGenerationTextSynced: true,
        openingFingerprint: true,
        endingFingerprint: true,
      },
    });
  } catch {
    return entries;
  }
  const map = new Map(rows.map((r) => [r.ledgerRunKey, r]));
  return entries.map((e) => mergeOutputRow(e, map.get(e.ledgerRunKey)));
}

function mergeOutputRow(entry: SceneRunLedgerEntry, row: OutputRow | undefined): SceneRunLedgerEntry {
  const o = entry.output;
  if (row) {
    return {
      ...entry,
      output: {
        ...o,
        persistedOutputKnown: true,
        linkageStatus: "linked_output",
        outputArtifactId: row.id,
        storedCharacterCount: row.characterCount,
        storedParagraphCount: row.paragraphCount,
        outputCompleteness: row.outputCompleteness,
        sceneGenerationTextSynced: row.sceneGenerationTextSynced,
        openingFingerprint: row.openingFingerprint,
        endingFingerprint: row.endingFingerprint,
      },
    };
  }
  if (entry.audit.eventTypesObserved.includes("rehearsal_non_launch_evaluated")) {
    return {
      ...entry,
      output: { ...o, linkageStatus: "output_not_persisted_by_policy" },
    };
  }
  if (o.generationFailed) {
    return { ...entry, output: { ...o, linkageStatus: "unlinked_output" } };
  }
  if (o.generationFinished && !o.generationFailed) {
    return { ...entry, output: { ...o, linkageStatus: "legacy_output_unknown", persistedOutputKnown: false } };
  }
  if (!o.generationFinished && o.generationStarted) {
    return { ...entry, output: { ...o, linkageStatus: "unlinked_output" } };
  }
  return entry;
}

export async function loadSceneRunLedger(sceneId: string, limit = 80): Promise<SceneRunLedgerViewModel> {
  const rawEntries = await buildRawLedgerEntries(sceneId, limit);
  const withOutputs = await attachPersistedOutputs(sceneId, rawEntries);

  const vm = await buildSceneGenerationPreflight(sceneId);
  const guard = vm ? preflightVmToGuardResult(null, vm) : null;
  const digestPrefix = vm && guard ? guard.freshnessDigest.slice(0, 16) : null;

  const entries = withReplayContext(withOutputs, vm, digestPrefix);

  const summary: SceneRunLedgerSummary = {
    sceneId,
    totalEntries: entries.length,
    entriesWithFullHistory: entries.filter((e) => e.historyCompleteness === "full").length,
    legacyOrPartialCount: entries.filter((e) => e.historyCompleteness !== "full").length,
    contractVersion: SCENE_RUN_LEDGER_CONTRACT_VERSION,
  };

  return { summary, entries };
}

export async function loadSceneRunLedgerEntry(sceneId: string, ledgerRunKey: string): Promise<SceneRunLedgerEntry | null> {
  const rawEntries = await buildRawLedgerEntries(sceneId, 160);
  const merged = await attachPersistedOutputs(sceneId, rawEntries);
  const raw = merged.find((e) => e.ledgerRunKey === ledgerRunKey);
  if (!raw) return null;
  const vm = await buildSceneGenerationPreflight(sceneId);
  const guard = vm ? preflightVmToGuardResult(null, vm) : null;
  const digestPrefix = vm && guard ? guard.freshnessDigest.slice(0, 16) : null;
  return mergeReplayEligibilityIntoEntry(raw, { currentPreflight: vm, currentFreshnessDigestPrefix: digestPrefix });
}

export async function loadSceneRunDetail(sceneId: string, ledgerRunKey: string): Promise<SceneRunDetailViewModel | null> {
  const entry = await loadSceneRunLedgerEntry(sceneId, ledgerRunKey);
  if (!entry) return null;

  const vm = await buildSceneGenerationPreflight(sceneId);
  const guard = vm ? preflightVmToGuardResult(null, vm) : null;
  const digestPrefix = vm && guard ? guard.freshnessDigest.slice(0, 16) : null;

  const feasibilityNotes: SceneRunReplayFeasibilityNote[] = [];
  if (vm && entry.historicalGuard.freshnessDigestPrefix && digestPrefix && entry.historicalGuard.freshnessDigestPrefix !== digestPrefix) {
    feasibilityNotes.push({
      code: "digest_divergence_expected",
      message: "Historical digest prefix differs from current preflight — replay uses **current** truth, not the old snapshot.",
    });
  }
  feasibilityNotes.push({
    code: "replay_not_deterministic",
    message: "Model output may differ from the historical run even under similar inputs.",
  });
  if (vm?.summary.launchAllowance === "blocked") {
    feasibilityNotes.push({
      code: "current_preflight_blocked",
      message: "Current preflight would block a new launch until remediated.",
    });
  } else if (vm?.summary.launchAllowance === "allowed_with_risk") {
    feasibilityNotes.push({
      code: "current_preflight_risky",
      message: "Current preflight requires explicit risk acknowledgement before replay.",
    });
  }

  return {
    entry,
    currentPreflightHeadline: vm?.summary.headline ?? null,
    currentLaunchAllowance: vm?.summary.launchAllowance ?? null,
    currentFreshnessDigestPrefix: digestPrefix,
    feasibilityNotes,
  };
}

export async function loadRecentSceneRunLedgers(limitScenes = 12, auditsPerScene = 40): Promise<{ sceneId: string; title: string | null; entries: SceneRunLedgerEntry[] }[]> {
  const recentScenes = await prisma.scene.findMany({
    orderBy: { updatedAt: "desc" },
    take: limitScenes,
    select: { id: true, description: true },
  });
  const out: { sceneId: string; title: string | null; entries: SceneRunLedgerEntry[] }[] = [];
  for (const s of recentScenes) {
    const rows = await loadAuditRowsForScene(s.id, auditsPerScene);
    if (rows.length === 0) continue;
    const entries = await groupAuditLinesIntoLedgerEntriesWithReplay(s.id, rows, auditsPerScene);
    out.push({ sceneId: s.id, title: s.description, entries });
  }
  return out;
}

async function groupAuditLinesIntoLedgerEntriesWithReplay(
  sceneId: string,
  rows: AuditRow[],
  cap: number,
): Promise<SceneRunLedgerEntry[]> {
  const raw = await attachPersistedOutputs(sceneId, groupAuditRowsIntoLedgerEntries(sceneId, rows).slice(0, cap));
  const vm = await buildSceneGenerationPreflight(sceneId);
  const guard = vm ? preflightVmToGuardResult(null, vm) : null;
  const digestPrefix = vm && guard ? guard.freshnessDigest.slice(0, 16) : null;
  return withReplayContext(raw, vm, digestPrefix);
}

/** Resolve historical intent for replay from ledger entry. */
export function intentForReplayFromEntry(entry: SceneRunLedgerEntry): SceneLaunchIntent {
  return entry.historicalGuard.intent ?? "full_generation";
}
