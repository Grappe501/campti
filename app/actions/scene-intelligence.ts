"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { persistSceneConstructionSuggestions } from "@/lib/scene-intelligence";
import {
  refreshSceneIntelligenceSchema,
  suggestionStatusSchema,
} from "@/lib/scene-intelligence-validation";

export async function refreshSceneIntelligenceSuggestionsAction(formData: FormData) {
  const parsed = refreshSceneIntelligenceSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
  });
  if (!parsed.success) {
    redirect("/admin/meta-scenes?error=validation");
  }
  try {
    await persistSceneConstructionSuggestions(parsed.data.metaSceneId);
  } catch {
    redirect(`/admin/meta-scenes/${parsed.data.metaSceneId}/compose?error=db`);
  }
  revalidatePath(`/admin/meta-scenes/${parsed.data.metaSceneId}/compose`);
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${parsed.data.metaSceneId}/compose?saved=intel`);
}

export async function updateSceneConstructionSuggestionStatusAction(formData: FormData) {
  const parsed = suggestionStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/meta-scenes?error=validation");
  }
  const d = parsed.data;
  const metaSceneIdHint = String(formData.get("metaSceneId") ?? "");
  const meta = await prisma.sceneConstructionSuggestion.findUnique({
    where: { id: d.id },
    select: { metaSceneId: true },
  });
  const targetMeta = meta?.metaSceneId ?? (metaSceneIdHint.length ? metaSceneIdHint : null);
  try {
    await prisma.sceneConstructionSuggestion.update({
      where: { id: d.id },
      data: {
        status: d.status,
        notes: d.notes?.length ? d.notes : null,
      },
    });
  } catch {
    redirect(targetMeta ? `/admin/meta-scenes/${targetMeta}/compose?error=db` : "/admin/meta-scenes?error=db");
  }
  if (targetMeta) {
    revalidatePath(`/admin/meta-scenes/${targetMeta}/compose`);
  }
  revalidatePath("/admin/brain");
  redirect(targetMeta ? `/admin/meta-scenes/${targetMeta}/compose?saved=suggestion` : "/admin/brain");
}
