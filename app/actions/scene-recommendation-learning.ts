"use server";

import {
  LoadRecommendationEffectivenessInputSchema,
  LogRecommendationFollowupInputSchema,
} from "@/lib/domain/scene-recommendation-learning-validation";
import { buildSceneRecommendationEffectivenessViewModel } from "@/lib/services/scene-recommendation-effectiveness-service";
import { logRecommendationFollowupEvent } from "@/lib/services/scene-recommendation-learning-log-service";

export async function logRecommendationFollowupAction(raw: unknown) {
  const parsed = LogRecommendationFollowupInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const id = await logRecommendationFollowupEvent(parsed.data);
  return { ok: true as const, eventId: id };
}

export async function loadRecommendationEffectivenessAction(raw: unknown) {
  const parsed = LoadRecommendationEffectivenessInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const vm = await buildSceneRecommendationEffectivenessViewModel(parsed.data.sceneId, parsed.data.windowDays ?? 90);
  return { ok: true as const, data: vm };
}
