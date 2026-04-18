import type { SceneRunFlatDiffSummary, SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";

function fieldChanged(label: string, a: unknown, b: unknown, changed: string[]): void {
  if (a !== b) changed.push(label);
}

export function compareSceneRunEntries(a: SceneRunLedgerEntry, b: SceneRunLedgerEntry): SceneRunFlatDiffSummary {
  const changed: string[] = [];
  if (a.sceneId !== b.sceneId) {
    return {
      ledgerRunKeyA: a.ledgerRunKey,
      ledgerRunKeyB: b.ledgerRunKey,
      changedFields: ["sceneId_mismatch"],
      summaryLine: "Cannot compare runs from different scenes in this view.",
    };
  }

  fieldChanged("launchClass", a.audit.launchClass, b.audit.launchClass, changed);
  fieldChanged("launchSource", a.audit.launchSource, b.audit.launchSource, changed);
  fieldChanged("launchAllowance", a.historicalGuard.launchAllowance, b.historicalGuard.launchAllowance, changed);
  fieldChanged("confirmationMode", a.audit.confirmationMode, b.audit.confirmationMode, changed);
  fieldChanged("blockerCount", a.historicalGuard.blockerCount, b.historicalGuard.blockerCount, changed);
  fieldChanged("riskCount", a.historicalGuard.riskCount, b.historicalGuard.riskCount, changed);
  fieldChanged("digestPrefix", a.historicalGuard.freshnessDigestPrefix, b.historicalGuard.freshnessDigestPrefix, changed);
  fieldChanged("hashPreview", a.historicalGuard.inputHashPreview, b.historicalGuard.inputHashPreview, changed);
  fieldChanged("generationFinished", a.output.generationFinished, b.output.generationFinished, changed);
  fieldChanged("generationFailed", a.output.generationFailed, b.output.generationFailed, changed);
  fieldChanged("cluster7RunId", a.output.cluster7RunId, b.output.cluster7RunId, changed);
  fieldChanged("replayEligibility", a.replayEligibility, b.replayEligibility, changed);

  const summaryLine =
    changed.length === 0
      ? "No material differences in summarized audit fields."
      : `Changed: ${changed.join(", ")}.`;

  return {
    ledgerRunKeyA: a.ledgerRunKey,
    ledgerRunKeyB: b.ledgerRunKey,
    changedFields: changed,
    summaryLine,
  };
}

export async function compareSceneRunsForScene(
  sceneId: string,
  ledgerRunKeyA: string,
  ledgerRunKeyB: string,
  loader: (sceneId: string, key: string) => Promise<SceneRunLedgerEntry | null>,
): Promise<SceneRunFlatDiffSummary | { ok: false; message: string }> {
  const [ea, eb] = await Promise.all([loader(sceneId, ledgerRunKeyA), loader(sceneId, ledgerRunKeyB)]);
  if (!ea || !eb) {
    return { ok: false, message: "One or both runs were not found for this scene." };
  }
  return compareSceneRunEntries(ea, eb);
}
