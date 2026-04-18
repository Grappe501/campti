import type {
  DiffFactKind,
  SceneRunComparisonCompleteness,
  SceneRunDiffViewModel,
  SceneRunExecutionDelta,
  SceneRunFieldDelta,
  SceneRunGovernanceDelta,
  SceneRunOutcomeSignals,
  SceneRunOutputDelta,
  SceneRunPreflightDelta,
  SceneRunQualityHeuristic,
  SceneRunStructuredDiffSummary,
} from "@/lib/domain/scene-run-diff-analytics";
import { SCENE_RUN_DIFF_ANALYTICS_VERSION } from "@/lib/domain/scene-run-diff-analytics";
import type { SceneRunBoundedOutputDiff } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunLedgerEntry, SceneRunReplayEligibility } from "@/lib/domain/scene-run-ledger";
import { SceneRunDiffRequestSchema } from "@/lib/domain/scene-run-analytics-validation";

function fd<T extends string | number | boolean | null>(
  field: string,
  before: T,
  after: T,
  kind: DiffFactKind,
  significance: string | null,
): SceneRunFieldDelta<T> {
  return {
    field,
    before,
    after,
    changed: before !== after,
    kind,
    significance: before !== after ? significance : null,
  };
}

function minCompleteness(a: SceneRunComparisonCompleteness, b: SceneRunComparisonCompleteness): SceneRunComparisonCompleteness {
  const rank: Record<SceneRunComparisonCompleteness, number> = {
    full: 4,
    partial_comparison: 3,
    insufficient_output_linkage: 2,
    legacy_run_history: 1,
  };
  return rank[a] < rank[b] ? a : b;
}

function historyCompletenessToOverall(h: SceneRunLedgerEntry["historyCompleteness"]): SceneRunComparisonCompleteness {
  if (h === "legacy") return "legacy_run_history";
  if (h === "insufficient") return "partial_comparison";
  if (h === "partial") return "partial_comparison";
  return "full";
}

function buildGovernanceDelta(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry): SceneRunGovernanceDelta {
  const comp = minCompleteness(historyCompletenessToOverall(a.historyCompleteness), historyCompletenessToOverall(b.historyCompleteness));
  const fields: SceneRunFieldDelta[] = [
    fd("launchClass", a.audit.launchClass, b.audit.launchClass, "fact", "Launch classification changed."),
    fd("launchSource", a.audit.launchSource, b.audit.launchSource, "fact", "Originating surface changed (interactive vs machine vs replay)."),
    fd("policyMode", a.audit.policyMode, b.audit.policyMode, "fact", "Policy bundle changed."),
    fd("launchAllowance", a.historicalGuard.launchAllowance, b.historicalGuard.launchAllowance, "fact", "Preflight allowance at launch differed."),
    fd("confirmationMode", a.audit.confirmationMode, b.audit.confirmationMode, "fact", "How confirmation was recorded changed."),
    fd("riskAcknowledged", a.historicalGuard.riskAcknowledged, b.historicalGuard.riskAcknowledged, "fact", "Human risk acknowledgement flag differs."),
    fd("blockerCount", a.historicalGuard.blockerCount, b.historicalGuard.blockerCount, "fact", "Blocker pressure changed."),
    fd("riskCount", a.historicalGuard.riskCount, b.historicalGuard.riskCount, "fact", "Downgrade risk count changed."),
    fd("advisoryCount", a.historicalGuard.advisoryCount, b.historicalGuard.advisoryCount, "fact", "Advisory count changed."),
    fd("intent", a.historicalGuard.intent, b.historicalGuard.intent, "fact", "Generation intent (full/draft/rewrite/repair) changed."),
  ];
  const summaryLines = fields.filter((f) => f.changed && f.significance).map((f) => `${f.field}: ${f.significance}`);
  return { completeness: comp, fields, summaryLines };
}

function buildPreflightDelta(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry): SceneRunPreflightDelta {
  const comp: SceneRunComparisonCompleteness =
    a.historyCompleteness === "legacy" || b.historyCompleteness === "legacy"
      ? "legacy_run_history"
      : "partial_comparison";
  const fields: SceneRunFieldDelta[] = [
    fd("freshnessDigestPrefix", a.historicalGuard.freshnessDigestPrefix, b.historicalGuard.freshnessDigestPrefix, "fact", "Preflight snapshot digest prefix differed."),
    fd("inputHashPreview", a.historicalGuard.inputHashPreview, b.historicalGuard.inputHashPreview, "fact", "Canonical input hash preview differed."),
    fd("guardEvaluatedAtIso", a.historicalGuard.guardEvaluatedAtIso, b.historicalGuard.guardEvaluatedAtIso, "fact", "Guard evaluation timestamp differed."),
  ];
  const summaryLines = [
    "Preflight comparison uses audit proxies only — not a full subsystem-level preflight diff (stored snapshots are a future enhancement).",
    ...fields.filter((f) => f.changed).map((f) => f.significance).filter(Boolean),
  ].filter(Boolean) as string[];
  return { completeness: comp, fields, summaryLines };
}

function buildExecutionDelta(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry): SceneRunExecutionDelta {
  const comp = minCompleteness(historyCompletenessToOverall(a.historyCompleteness), historyCompletenessToOverall(b.historyCompleteness));
  const fields: SceneRunFieldDelta[] = [
    fd("generationStarted", a.output.generationStarted, b.output.generationStarted, "fact", "Model path start differed."),
    fd("generationFinished", a.output.generationFinished, b.output.generationFinished, "fact", "Terminal success differed."),
    fd("generationFailed", a.output.generationFailed, b.output.generationFailed, "fact", "Failure flag differed."),
    fd("cluster7RunId", a.output.cluster7RunId, b.output.cluster7RunId, "fact", "Execution correlation id differed."),
  ];
  const summaryLines = fields.filter((f) => f.changed && f.significance).map((f) => `${f.field}: ${f.significance}`);
  return { completeness: comp, fields, summaryLines };
}

function buildOutputDelta(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry, bounded: SceneRunBoundedOutputDiff | null): SceneRunOutputDelta {
  const bothLinked = a.output.linkageStatus === "linked_output" && b.output.linkageStatus === "linked_output";
  const proseAvailable = bounded !== null;
  const comp: SceneRunComparisonCompleteness = proseAvailable
    ? "full"
    : bothLinked
      ? "partial_comparison"
      : a.output.linkageStatus === "linked_output" || b.output.linkageStatus === "linked_output"
        ? "partial_comparison"
        : "insufficient_output_linkage";
  const fields: SceneRunFieldDelta[] = [
    fd("linkageStatus", a.output.linkageStatus, b.output.linkageStatus, "fact", "Durable output linkage status differs."),
    fd("storedCharacterCount", a.output.storedCharacterCount, b.output.storedCharacterCount, "fact", "Linked snapshot character counts differ."),
    fd("storedParagraphCount", a.output.storedParagraphCount, b.output.storedParagraphCount, "fact", "Linked snapshot paragraph counts differ."),
    fd("outputCompleteness", a.output.outputCompleteness, b.output.outputCompleteness, "fact", "How prose was persisted for this run differs."),
    fd("sceneGenerationTextSynced", a.output.sceneGenerationTextSynced, b.output.sceneGenerationTextSynced, "fact", "Scene `generationText` sync flag differs."),
    fd("openingFingerprint", a.output.openingFingerprint, b.output.openingFingerprint, "fact", "Opening slice fingerprint differs."),
    fd("endingFingerprint", a.output.endingFingerprint, b.output.endingFingerprint, "fact", "Ending slice fingerprint differs."),
    fd("errorMessagePresent", Boolean(a.output.errorMessagePreview), Boolean(b.output.errorMessagePreview), "fact", "Error text presence changed."),
    fd("persistedOutputKnown", a.output.persistedOutputKnown, b.output.persistedOutputKnown, "fact", "Durable output row presence changed."),
  ];
  const summaryLines = [
    proseAvailable
      ? "Bounded output comparison uses `SceneRunGenerationOutput` snapshots (no subjective quality score)."
      : bothLinked
        ? "Both runs report linkage, but full bounded comparison could not be loaded — treat as partial."
        : "No durable dual-linkage for both runs — output delta is limited to audit-level signals.",
    ...fields.filter((f) => f.changed).map((f) => f.significance).filter(Boolean),
  ].filter(Boolean) as string[];
  return { completeness: comp, fields, summaryLines, proseComparisonAvailable: proseAvailable, boundedComparison: bounded };
}

function replayDelta(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry): SceneRunFieldDelta<SceneRunReplayEligibility>[] {
  return [
    fd<SceneRunReplayEligibility>(
      "replayEligibility",
      a.replayEligibility,
      b.replayEligibility,
      "heuristic",
      "Replay eligibility is evaluated against **today’s** preflight when the ledger loads — both values share that snapshot; differences usually mean the two runs had different historical shapes affecting classification.",
    ),
  ];
}

function buildHeuristics(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry, bounded: SceneRunBoundedOutputDiff | null): SceneRunOutcomeSignals {
  const heuristics: SceneRunQualityHeuristic[] = [];
  const factualNotes: string[] = [];

  const newer = a.startedAtIso >= b.startedAtIso ? a : b;
  const older = a.startedAtIso >= b.startedAtIso ? b : a;
  const bcN = newer.historicalGuard.blockerCount ?? 0;
  const bcO = older.historicalGuard.blockerCount ?? 0;
  if (bcN < bcO) {
    heuristics.push({
      id: "governance_cleanliness_improved",
      label: "Fewer blockers in chronologically later run",
      basis: `Blockers ${bcO} → ${bcN} (audit counts, newer vs older by start time).`,
      strength: bcO - bcN >= 2 ? "medium" : "low",
      derivedFrom: "fact",
    });
  } else if (bcN > bcO) {
    heuristics.push({
      id: "governance_cleanliness_declined",
      label: "More blockers in chronologically later run",
      basis: `Blockers ${bcO} → ${bcN}.`,
      strength: "medium",
      derivedFrom: "fact",
    });
  }

  const rN = newer.historicalGuard.riskCount ?? 0;
  const rO = older.historicalGuard.riskCount ?? 0;
  if (rN > rO) {
    heuristics.push({
      id: "stability_declined",
      label: "Downgrade risks increased over time",
      basis: `Risk count ${rO} → ${rN} (newer vs older).`,
      strength: rN - rO >= 2 ? "medium" : "low",
      derivedFrom: "heuristic",
    });
  } else if (rO > rN) {
    heuristics.push({
      id: "stability_improved",
      label: "Downgrade risks decreased over time",
      basis: `Risk count ${rO} → ${rN}.`,
      strength: "low",
      derivedFrom: "heuristic",
    });
  }

  const replayA = a.audit.launchSource === "run_ledger_replay";
  const replayB = b.audit.launchSource === "run_ledger_replay";
  if (replayA !== replayB) {
    factualNotes.push("One run is anchored as ledger replay (`run_ledger_replay`); compare governance carefully — replay uses current guard.");
  }

  if (
    a.output.generationFinished &&
    b.output.generationFinished &&
    a.output.cluster7RunId &&
    b.output.cluster7RunId &&
    a.output.cluster7RunId !== b.output.cluster7RunId
  ) {
    heuristics.push({
      id: "replay_divergence_risk",
      label: "Distinct execution ids",
      basis: "Both runs completed but cluster7 run ids differ — expected when re-executing; not a quality judgment.",
      strength: "low",
      derivedFrom: "heuristic",
    });
  }

  const repairLike = (e: SceneRunLedgerEntry) =>
    e.audit.launchSource === "revision_job" || e.audit.launchSource === "scene_repair_service";
  if (repairLike(a) && repairLike(b)) {
    heuristics.push({
      id: "repair_loop_risk",
      label: "Both runs are repair/machine paths",
      basis: "Repeated automation/repair launches may indicate churn — review preflight root causes (advisory).",
      strength: "medium",
      derivedFrom: "heuristic",
    });
  }

  if (bounded?.signals.some((s) => s.code === "length_shift" || s.code === "opening_shift" || s.code === "ending_shift")) {
    heuristics.push({
      id: "output_churn_bounded",
      label: "Linked prose snapshots differ materially (bounded signals)",
      basis: "Length/opening/ending fingerprints moved — not a verdict on literary merit.",
      strength: "low",
      derivedFrom: "heuristic",
    });
  }

  return { heuristics, factualNotes };
}

function headlineFrom(g: SceneRunGovernanceDelta, ex: SceneRunExecutionDelta): string {
  const govChanged = g.fields.some((f) => f.changed);
  const exChanged = ex.fields.some((f) => f.changed);
  if (!govChanged && !exChanged) return "No material governance or execution deltas in summarized audit fields.";
  const parts: string[] = [];
  if (govChanged) parts.push("Governance/preflight signals changed");
  if (exChanged) parts.push("execution outcome changed");
  return `${parts.join("; ")} — see sections below.`;
}

export function buildSceneRunDiffViewModel(
  a: SceneRunLedgerEntry,
  b: SceneRunLedgerEntry,
  boundedComparison: SceneRunBoundedOutputDiff | null = null,
): SceneRunDiffViewModel | null {
  const parsed = SceneRunDiffRequestSchema.safeParse({
    sceneId: a.sceneId,
    ledgerRunKeyA: a.ledgerRunKey,
    ledgerRunKeyB: b.ledgerRunKey,
  });
  if (!parsed.success || a.sceneId !== b.sceneId) return null;

  const governance = buildGovernanceDelta(a, b);
  const preflight = buildPreflightDelta(a, b);
  const execution = buildExecutionDelta(a, b);
  const output = buildOutputDelta(a, b, boundedComparison);
  const replayEligibilityDelta = replayDelta(a, b);
  const outcomeSignals = buildHeuristics(a, b, boundedComparison);

  let overall: SceneRunComparisonCompleteness = "full";
  for (const part of [governance.completeness, preflight.completeness, execution.completeness, output.completeness]) {
    overall = minCompleteness(overall, part);
  }

  const diff: SceneRunStructuredDiffSummary = {
    ledgerRunKeyA: a.ledgerRunKey,
    ledgerRunKeyB: b.ledgerRunKey,
    sceneId: a.sceneId,
    headline: headlineFrom(governance, execution),
    governance,
    preflight,
    execution,
    output,
    replayEligibilityDelta,
    outcomeSignals,
    overallCompleteness: overall,
  };

  return { contractVersion: SCENE_RUN_DIFF_ANALYTICS_VERSION, diff };
}

export function suggestDefaultComparison(entries: SceneRunLedgerEntry[]): { ledgerRunKeyA: string; ledgerRunKeyB: string; preset: "latest_vs_previous" } | null {
  if (entries.length < 2) return null;
  return {
    preset: "latest_vs_previous",
    ledgerRunKeyA: entries[0]!.ledgerRunKey,
    ledgerRunKeyB: entries[1]!.ledgerRunKey,
  };
}

export function suggestMachineVsInteractiveComparison(entries: SceneRunLedgerEntry[]): {
  ledgerRunKeyA: string;
  ledgerRunKeyB: string;
  preset: "latest_machine_vs_latest_interactive";
} | null {
  const machine = entries.find((e) => e.audit.launchClass === "machine");
  const interactive = entries.find((e) => e.audit.launchClass === "interactive");
  if (!machine || !interactive || machine.ledgerRunKey === interactive.ledgerRunKey) return null;
  return {
    preset: "latest_machine_vs_latest_interactive",
    ledgerRunKeyA: interactive.ledgerRunKey,
    ledgerRunKeyB: machine.ledgerRunKey,
  };
}
