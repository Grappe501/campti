import type { SceneRunBoundedOutputDiff } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunOutputChurnHint } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";
import { buildSceneRunDiffViewModel } from "@/lib/services/scene-run-diff-service";
import { buildBoundedOutputDiffForLedgerKeys } from "@/lib/services/scene-run-output-delta-service";

export type AssistMaterialSignals = {
  /** Governance / preflight / execution delta material (legacy heuristic). */
  governanceMaterial: boolean;
  boundedLatestPairDiff: SceneRunBoundedOutputDiff | null;
  /** Durable output or hint-based prose churn between latest pair. */
  outputChurnMaterial: boolean;
  /** Used by Decision Assist churn rules — governance OR output. */
  materialRunDiffCombined: boolean;
};

function governanceMaterialDiff(entries: SceneRunLedgerEntry[]): boolean {
  if (entries.length < 2) return false;
  const a = entries[0];
  const b = entries[1];
  const d = buildSceneRunDiffViewModel(a, b);
  if (!d) return false;
  const changedSlices =
    (d.diff.governance.fields.some((f) => f.changed) ? 1 : 0) +
    (d.diff.preflight.fields.some((f) => f.changed) ? 1 : 0) +
    (d.diff.execution.fields.some((f) => f.changed) ? 1 : 0);
  return changedSlices >= 2;
}

function outputSignalsMaterial(signals: SceneRunBoundedOutputDiff["signals"]): boolean {
  return signals.some(
    (s) =>
      s.code === "length_shift" ||
      s.code === "opening_shift" ||
      s.code === "ending_shift" ||
      s.code === "paragraph_structure_shift" ||
      s.code === "beat_marker_presence_shift",
  );
}

function hintsIndicateOutputChurn(hints: SceneRunOutputChurnHint[]): boolean {
  return hints.some(
    (h) =>
      h.code === "recent_linked_output_length_shift" ||
      h.code === "recent_opening_fingerprint_shift" ||
      h.code === "recent_ending_fingerprint_shift" ||
      h.code === "repeated_blocked_save_outputs",
  );
}

/**
 * DB-backed bounded output diff for the latest two ledger rows when both are `linked_output`.
 * Combines with governance diff for material churn signals used in recommendations.
 */
export async function computeAssistMaterialSignals(
  sceneId: string,
  entries: SceneRunLedgerEntry[],
  outputChurnHints: SceneRunOutputChurnHint[],
): Promise<AssistMaterialSignals> {
  const governanceMaterial = governanceMaterialDiff(entries);
  let boundedLatestPairDiff: SceneRunBoundedOutputDiff | null = null;
  if (entries.length >= 2) {
    const a = entries[0];
    const b = entries[1];
    if (a.output.linkageStatus === "linked_output" && b.output.linkageStatus === "linked_output") {
      boundedLatestPairDiff = await buildBoundedOutputDiffForLedgerKeys(sceneId, a.ledgerRunKey, b.ledgerRunKey);
    }
  }
  const outputChurnMaterial =
    (boundedLatestPairDiff ? outputSignalsMaterial(boundedLatestPairDiff.signals) : false) || hintsIndicateOutputChurn(outputChurnHints);

  return {
    governanceMaterial,
    boundedLatestPairDiff,
    outputChurnMaterial,
    materialRunDiffCombined: governanceMaterial || outputChurnMaterial,
  };
}
