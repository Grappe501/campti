"use server";

import { revalidatePath } from "next/cache";

import { SceneGenerationPreflightSceneIdSchema } from "@/lib/domain/scene-generation-preflight-validation";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { evaluateSceneLaunchGuard } from "@/lib/services/scene-launch-guard-service";

// TODO(auth): trusted admin surface — align with other scene admin actions.

export async function loadSceneGenerationPreflightAction(sceneId: string) {
  const parsed = SceneGenerationPreflightSceneIdSchema.safeParse({ sceneId });
  if (!parsed.success) {
    return { ok: false as const, code: "validation" as const, message: parsed.error.flatten().fieldErrors.sceneId?.[0] ?? "sceneId invalid." };
  }
  const model = await buildSceneGenerationPreflight(parsed.data.sceneId);
  if (!model) return { ok: false as const, code: "not_found" as const, message: "Scene not found." };
  return { ok: true as const, data: model };
}

export async function recomputeSceneGenerationPreflightAction(sceneId: string) {
  const r = await loadSceneGenerationPreflightAction(sceneId);
  if (r.ok) {
    revalidatePath(`/admin/scenes/${r.data.sceneId}`);
    revalidatePath(`/admin/scenes/${r.data.sceneId}`, "page");
    revalidatePath(`/admin/scenes/${r.data.sceneId}/workspace`, "page");
  }
  return r;
}

/** Optional gate for server-side launch paths — uses canonical launch guard (same truth as Preflight). */
export async function assertSceneGenerationLaunchGateAction(sceneId: string) {
  const parsed = SceneGenerationPreflightSceneIdSchema.safeParse({ sceneId });
  if (!parsed.success) {
    return { ok: false as const, code: "validation" as const, message: "sceneId invalid." };
  }
  const g = await evaluateSceneLaunchGuard(parsed.data.sceneId);
  if (!g) return { ok: false as const, code: "not_found" as const, message: "Scene not found." };
  if (g.launchAllowance === "blocked") {
    return {
      ok: false as const,
      code: "launch_blocked" as const,
      launchAllowance: g.launchAllowance,
      blockers: g.blockers,
      message: `Launch blocked — ${g.blockers.length} blocker(s).`,
    };
  }
  return {
    ok: true as const,
    launchAllowance: g.launchAllowance,
    primaryRiskCount: g.risks.length,
    headline:
      g.launchAllowance === "allowed_with_risk"
        ? `Launch allowed with ${g.risks.length} documented downgrade risk(s) — confirmation required before run.`
        : "Launch allowed under current preflight snapshot.",
    freshnessDigest: g.freshnessDigest,
  };
}
