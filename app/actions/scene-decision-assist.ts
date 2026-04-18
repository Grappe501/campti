"use server";

import { SceneDecisionAssistRequestSchema } from "@/lib/domain/scene-decision-assist-validation";
import { buildSceneDecisionAssistViewModel } from "@/lib/services/scene-decision-assist-service";

export async function loadSceneDecisionAssistAction(raw: unknown) {
  const parsed = SceneDecisionAssistRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const vm = await buildSceneDecisionAssistViewModel(parsed.data.sceneId, {
    ledgerRunKey: parsed.data.ledgerRunKey,
    maxLedgerEntries: parsed.data.maxLedgerEntries,
  });
  if (!vm) {
    return { ok: false as const, message: "Scene not found or preflight unavailable." };
  }
  return { ok: true as const, data: vm };
}
