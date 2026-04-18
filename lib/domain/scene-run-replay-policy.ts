import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type { SceneRunHistoryCompleteness, SceneRunLedgerEntry, SceneRunReplayEligibility } from "@/lib/domain/scene-run-ledger";

export type ReplayPolicyContext = {
  /** Live preflight for the scene (current truth). */
  currentPreflight: SceneGenerationPreflightViewModel | null;
  currentFreshnessDigestPrefix: string | null;
};

/**
 * Historical inspection is always allowed when an entry exists.
 * Replay eligibility answers: **under current guard**, can we execute a governed replay?
 *
 * Replay execution uses the **interactive** guarded path with `launchSource: run_ledger_replay`
 * and `saveGenerationText: false` (no silent production mutation).
 */
export function classifyReplayEligibility(
  entry: Pick<
    SceneRunLedgerEntry,
    "historyCompleteness" | "historicalGuard" | "output" | "audit" | "replayNotes"
  >,
  ctx: ReplayPolicyContext,
): { eligibility: SceneRunReplayEligibility; notes: string[] } {
  const notes: string[] = [...entry.replayNotes];

  if (entry.historyCompleteness === "insufficient" || entry.historyCompleteness === "legacy") {
    notes.push(
      entry.historyCompleteness === "legacy"
        ? "Legacy audit row — launch classification fields may be missing."
        : "Insufficient linkage — cannot anchor a governed replay to this history.",
    );
    return { eligibility: "insufficient_history", notes };
  }

  if (entry.output.generationStarted && !entry.output.generationFinished && !entry.output.generationFailed) {
    notes.push("Run has no terminal completion audit — cannot classify a faithful replay anchor.");
    return { eligibility: "insufficient_history", notes };
  }

  if (!entry.output.generationStarted && entry.output.generationFailed === false) {
    notes.push("This record did not start model generation (e.g. rehearsal non-launch). Replay would be a new governed launch, not a repeat of the same execution shape.");
    return { eligibility: "historical_only", notes };
  }

  if (!ctx.currentPreflight) {
    notes.push("Current preflight could not be built — replay blocked.");
    return { eligibility: "replay_blocked", notes };
  }

  const allowance = ctx.currentPreflight.summary.launchAllowance;
  if (allowance === "blocked") {
    notes.push("Current preflight blocks launch — replay cannot proceed under today’s rules.");
    return { eligibility: "replay_blocked", notes };
  }

  if (allowance === "allowed_with_risk") {
    notes.push("Current preflight allows only with explicit risk acknowledgement — operator must confirm in the replay flow.");
    return { eligibility: "replay_allowed_with_risk", notes };
  }

  notes.push(
    "Replay is not a deterministic reproduction — it re-executes generation under **current** preflight truth with guarded policy.",
  );
  return { eligibility: "replay_allowed", notes };
}

export function mergeReplayEligibilityIntoEntry(
  entry: SceneRunLedgerEntry,
  ctx: ReplayPolicyContext,
): SceneRunLedgerEntry {
  const { eligibility, notes } = classifyReplayEligibility(entry, ctx);
  return {
    ...entry,
    replayEligibility: eligibility,
    replayNotes: notes,
  };
}

export function historyCompletenessFromAuditRow(row: {
  launchClass: string | null;
  freshnessDigestPrefix: string | null;
  launchSource: string | null;
}): SceneRunHistoryCompleteness {
  if (!row.launchClass && !row.launchSource) return "legacy";
  if (!row.freshnessDigestPrefix) return "partial";
  return "full";
}
