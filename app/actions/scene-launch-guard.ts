"use server";

import { revalidatePath } from "next/cache";

import type { SceneLaunchGuardResult } from "@/lib/domain/scene-launch-guard";
import {
  ConfirmAndLaunchSceneGenerationSchema,
  EvaluateSceneLaunchGuardSchema,
  RecordBlockedLaunchAcknowledgementSchema,
} from "@/lib/domain/scene-launch-guard-validation";
import { evaluateSceneLaunchGuard, executeSceneLaunchAfterGuard } from "@/lib/services/scene-launch-guard-service";
import { writeSceneLaunchAudit } from "@/lib/services/scene-launch-audit-service";

// TODO(auth): trusted admin surface — align with other scene admin actions.

export type EvaluateSceneLaunchGuardActionResult =
  | { ok: true; data: SceneLaunchGuardResult }
  | { ok: false; code: "validation" | "not_found"; message: string };

export async function evaluateSceneLaunchGuardAction(raw: unknown): Promise<EvaluateSceneLaunchGuardActionResult> {
  const parsed = EvaluateSceneLaunchGuardSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.flatten().fieldErrors.sceneId?.[0] ?? "Invalid input." };
  }
  const g = await evaluateSceneLaunchGuard(parsed.data.sceneId);
  if (!g) return { ok: false, code: "not_found", message: "Scene not found." };
  return { ok: true, data: g };
}

export type ConfirmAndLaunchSceneGenerationActionResult =
  | { ok: true; run: Awaited<ReturnType<typeof import("@/lib/services/scene-generation-service").runSceneGeneration>> }
  | { ok: false; code: string; message: string; guard?: SceneLaunchGuardResult };

export async function confirmAndLaunchSceneGenerationAction(
  raw: unknown,
  forwarded?: Omit<import("@/lib/services/scene-generation-service").RunSceneGenerationParams, "sceneId">,
): Promise<ConfirmAndLaunchSceneGenerationActionResult> {
  const parsed = ConfirmAndLaunchSceneGenerationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((e) => e.message).join("; ") };
  }
  const r = await executeSceneLaunchAfterGuard(parsed.data, forwarded);
  if (r.ok) {
    revalidatePath(`/admin/scenes/${parsed.data.sceneId}`);
    revalidatePath(`/admin/scenes/${parsed.data.sceneId}`, "page");
    revalidatePath(`/admin/narrative`, "page");
  }
  return r;
}

export async function recordBlockedLaunchAcknowledgementAction(raw: unknown) {
  const parsed = RecordBlockedLaunchAcknowledgementSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: "Invalid input." };
  }
  await writeSceneLaunchAudit({
    sceneId: parsed.data.sceneId,
    eventType: "launch_cancelled",
    freshnessDigestPrefix: parsed.data.freshnessDigest ? parsed.data.freshnessDigest.slice(0, 16) : null,
    finalAction: "operator_acknowledged_block",
    meta: parsed.data.note ? { note: parsed.data.note } : undefined,
  });
  return { ok: true as const };
}
