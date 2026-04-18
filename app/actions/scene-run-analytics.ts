"use server";

import {
  SceneRunDiffRequestSchema,
  SceneRunOutcomeAnalyticsRequestSchema,
} from "@/lib/domain/scene-run-analytics-validation";
import { buildSceneRunDiffViewModel } from "@/lib/services/scene-run-diff-service";
import { buildBoundedOutputDiffForLedgerKeys } from "@/lib/services/scene-run-output-delta-service";
import { buildSceneRunOutcomeAnalytics } from "@/lib/services/scene-run-outcome-analytics-service";
import { loadSceneRunLedger } from "@/lib/services/scene-run-ledger-service";

const LEDGER_WINDOW_FOR_DIFF = 120;

export async function loadSceneRunStructuredDiffAction(raw: unknown) {
  const parsed = SceneRunDiffRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, ledgerRunKeyA, ledgerRunKeyB } = parsed.data;
  const ledger = await loadSceneRunLedger(sceneId, LEDGER_WINDOW_FOR_DIFF);
  const a = ledger.entries.find((e) => e.ledgerRunKey === ledgerRunKeyA);
  const b = ledger.entries.find((e) => e.ledgerRunKey === ledgerRunKeyB);
  if (!a || !b) {
    return {
      ok: false as const,
      message:
        "One or both runs were not found in the loaded ledger window. Narrow the comparison or increase history coverage.",
    };
  }
  const bounded =
    a.output.linkageStatus === "linked_output" && b.output.linkageStatus === "linked_output"
      ? await buildBoundedOutputDiffForLedgerKeys(sceneId, ledgerRunKeyA, ledgerRunKeyB)
      : null;
  const vm = buildSceneRunDiffViewModel(a, b, bounded);
  if (!vm) {
    return { ok: false as const, message: "Comparison could not be built (same-scene validation failed)." };
  }
  return { ok: true as const, data: vm };
}

export async function loadSceneRunOutcomeAnalyticsAction(raw: unknown) {
  const parsed = SceneRunOutcomeAnalyticsRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const vm = await buildSceneRunOutcomeAnalytics(parsed.data.sceneId, parsed.data.maxEntries ?? 80);
  return { ok: true as const, data: vm };
}
