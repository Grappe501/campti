"use server";

import { revalidatePath } from "next/cache";

import { ReplaySceneRunActionSchema } from "@/lib/domain/scene-run-ledger-validation";
import { prisma } from "@/lib/prisma";
import { executeGuardedSceneLaunch } from "@/lib/services/scene-launch-guard-service";
import { writeSceneLaunchAudit } from "@/lib/services/scene-launch-audit-service";
import {
  intentForReplayFromEntry,
  loadSceneRunLedgerEntry,
} from "@/lib/services/scene-run-ledger-service";

export type ReplaySceneRunActionResult =
  | { ok: true; run: Awaited<ReturnType<typeof import("@/lib/services/scene-generation-service").runSceneGeneration>> }
  | { ok: false; code: string; message: string };

/**
 * Governed replay: uses **current** interactive guard (digest + risk acknowledgement).
 * Does **not** persist `generationText` — rehearsal-style execution only.
 */
export async function replaySceneRunAction(raw: unknown): Promise<ReplaySceneRunActionResult> {
  const parsed = ReplaySceneRunActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, sourceLedgerRunKey, freshnessDigest, riskAcknowledged } = parsed.data;

  const scene = await prisma.scene.findUnique({ where: { id: sceneId }, select: { id: true } });
  if (!scene) {
    return { ok: false, code: "scene_not_found", message: "Scene not found." };
  }

  const entry = await loadSceneRunLedgerEntry(sceneId, sourceLedgerRunKey);
  if (!entry) {
    await writeSceneLaunchAudit({
      sceneId,
      eventType: "replay_denied_by_policy",
      finalAction: "replay_unknown_run",
      launchClass: "rehearsal",
      launchSource: "run_ledger_replay",
      policyMode: "replay_interactive_guard",
      confirmationMode: "rehearsal_non_launch",
      meta: { sourceLedgerRunKey },
    });
    return { ok: false, code: "run_not_found", message: "Ledger run not found for this scene." };
  }

  if (
    entry.replayEligibility === "replay_blocked" ||
    entry.replayEligibility === "historical_only" ||
    entry.replayEligibility === "insufficient_history"
  ) {
    await writeSceneLaunchAudit({
      sceneId,
      eventType: "replay_denied_by_policy",
      finalAction: "replay_ineligible",
      launchAllowance: entry.historicalGuard.launchAllowance,
      freshnessDigestPrefix: entry.historicalGuard.freshnessDigestPrefix,
      launchClass: "rehearsal",
      launchSource: "run_ledger_replay",
      policyMode: "replay_interactive_guard",
      confirmationMode: "machine_policy_denied",
      meta: { sourceLedgerRunKey, eligibility: entry.replayEligibility },
    });
    return {
      ok: false,
      code: "replay_ineligible",
      message: `Replay not allowed for this history (${entry.replayEligibility}).`,
    };
  }

  if (entry.replayEligibility === "replay_allowed_with_risk" && !riskAcknowledged) {
    await writeSceneLaunchAudit({
      sceneId,
      eventType: "replay_blocked",
      finalAction: "replay_missing_risk_ack",
      launchClass: "rehearsal",
      launchSource: "run_ledger_replay",
      policyMode: "replay_interactive_guard",
      meta: { sourceLedgerRunKey },
    });
    return { ok: false, code: "confirmation_required", message: "Risk acknowledgement required before replay." };
  }

  await writeSceneLaunchAudit({
    sceneId,
    eventType: "replay_requested",
    launchAllowance: entry.historicalGuard.launchAllowance,
    freshnessDigestPrefix: freshnessDigest.slice(0, 16),
    launchClass: "rehearsal",
    launchSource: "run_ledger_replay",
    policyMode: "replay_interactive_guard",
    confirmationMode: riskAcknowledged ? "human_confirmed" : "human_not_required",
    intent: intentForReplayFromEntry(entry),
    meta: {
      sourceLedgerRunKey,
      historicalIntent: intentForReplayFromEntry(entry),
      saveGenerationText: false,
    },
  });

  const intent = intentForReplayFromEntry(entry);
  const guarded = await executeGuardedSceneLaunch(
    {
      sceneId,
      intent,
      launchClass: "interactive",
      launchSource: "run_ledger_replay",
      freshnessBasis: "interactive_client_digest",
      freshnessDigest,
      riskAcknowledged,
      saveGenerationText: false,
      registerDependencies: false,
      runProseQuality: false,
      policyMode: "replay_interactive_guard",
      auditMeta: { sourceLedgerRunKey, replay: true },
    },
    {},
  );

  if (!guarded.ok) {
    await writeSceneLaunchAudit({
      sceneId,
      eventType: "replay_blocked",
      finalAction: "replay_guard_rejected",
      errorMessage: guarded.message.slice(0, 2000),
      launchClass: "rehearsal",
      launchSource: "run_ledger_replay",
      policyMode: "replay_interactive_guard",
      meta: { sourceLedgerRunKey, code: guarded.code },
    });
    return { ok: false, code: guarded.code, message: guarded.message };
  }

  if (!guarded.run) {
    await writeSceneLaunchAudit({
      sceneId,
      eventType: "replay_failed",
      finalAction: "replay_no_run",
      launchClass: "rehearsal",
      launchSource: "run_ledger_replay",
      meta: { sourceLedgerRunKey },
    });
    return { ok: false, code: "internal_no_run", message: "Replay produced no generation run." };
  }

  await writeSceneLaunchAudit({
    sceneId,
    eventType: "replay_completed",
    launchAllowance: entry.historicalGuard.launchAllowance,
    freshnessDigestPrefix: freshnessDigest.slice(0, 16),
    launchClass: "rehearsal",
    launchSource: "run_ledger_replay",
    policyMode: "replay_interactive_guard",
    meta: {
      sourceLedgerRunKey,
      cluster7RunId: guarded.run.cluster7RuntimeTruth?.runId ?? null,
    },
  });

  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath(`/admin/scenes/${sceneId}`, "page");

  return { ok: true, run: guarded.run };
}
