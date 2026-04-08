"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePersonPair } from "@/lib/enneagram-engine";
import { buildSceneSoulSuggestionPayloads } from "@/lib/scene-composition";
import {
  metaSceneIdSchema,
  relationshipUpsertSchema,
  soulSuggestionStatusSchema,
} from "@/lib/scene-soul-validation";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

function strNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function refreshSceneSoulSuggestionsAction(formData: FormData) {
  const parsed = metaSceneIdSchema.safeParse({ metaSceneId: formData.get("metaSceneId") });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const { metaSceneId } = parsed.data;

  let payloads: Awaited<ReturnType<typeof buildSceneSoulSuggestionPayloads>>;
  try {
    payloads = await buildSceneSoulSuggestionPayloads(metaSceneId);
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }

  try {
    await prisma.$transaction(
      payloads.map((p) =>
        prisma.sceneSoulSuggestion.create({
          data: {
            metaSceneId,
            title: p.title,
            suggestionType: p.suggestionType,
            summary: p.summary,
            confidence: p.confidence ?? null,
            status: "suggested",
          },
        }),
      ),
    );
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }

  revalidatePath(`/admin/meta-scenes/${metaSceneId}/compose`);
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=soul`);
}

export async function updateSceneSoulSuggestionStatusAction(formData: FormData) {
  const parsed = soulSuggestionStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const d = parsed.data;
  const metaSceneIdHint = String(formData.get("metaSceneId") ?? "");
  const row = await prisma.sceneSoulSuggestion.findUnique({
    where: { id: d.id },
    select: { metaSceneId: true },
  });
  const targetMeta = row?.metaSceneId ?? (metaSceneIdHint.length ? metaSceneIdHint : null);
  try {
    await prisma.sceneSoulSuggestion.update({
      where: { id: d.id },
      data: {
        status: d.status,
        notes: d.notes?.length ? d.notes : null,
      },
    });
  } catch {
    redirect(targetMeta ? `/admin/meta-scenes/${targetMeta}/compose?error=db` : "/admin/meta-scenes?error=db");
  }
  if (targetMeta) revalidatePath(`/admin/meta-scenes/${targetMeta}/compose`);
  revalidatePath("/admin/brain");
  redirect(targetMeta ? `/admin/meta-scenes/${targetMeta}/compose?saved=soulsug` : "/admin/brain");
}

export async function upsertCharacterRelationshipAction(formData: FormData) {
  const raw = {
    personAId: str(formData.get("personAId")),
    personBId: str(formData.get("personBId")),
    relationshipType: str(formData.get("relationshipType")),
    relationshipSummary: strNull(formData.get("relationshipSummary")),
    emotionalPattern: strNull(formData.get("emotionalPattern")),
    conflictPattern: strNull(formData.get("conflictPattern")),
    attachmentPattern: strNull(formData.get("attachmentPattern")),
    powerDynamic: strNull(formData.get("powerDynamic")),
    enneagramDynamic: strNull(formData.get("enneagramDynamic")),
    notes: strNull(formData.get("notes")),
  };
  const ec = strNull(formData.get("confidence"));
  const confidence = ec != null && ec !== "" ? Math.min(5, Math.max(1, Number.parseInt(ec, 10))) : null;

  const pair = normalizePersonPair(raw.personAId ?? "", raw.personBId ?? "");
  if (pair.personAId === pair.personBId) redirect("/admin/relationships?error=validation");
  const parsed = relationshipUpsertSchema.safeParse({
    ...raw,
    personAId: pair.personAId,
    personBId: pair.personBId,
    confidence: Number.isFinite(confidence as number) ? confidence : null,
  });
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const id = str(formData.get("id"));
  const d = parsed.data;

  try {
    if (id) {
      await prisma.characterRelationship.update({
        where: { id },
        data: {
          ...d,
          confidence: d.confidence ?? null,
        },
      });
    } else {
      await prisma.characterRelationship.create({
        data: {
          ...d,
          confidence: d.confidence ?? null,
        },
      });
    }
  } catch {
    redirect("/admin/relationships?error=db");
  }

  revalidatePath("/admin/relationships");
  revalidatePath("/admin/brain");
  if (id) redirect(`/admin/relationships/${id}?saved=1`);
  redirect("/admin/relationships?saved=1");
}

export async function deleteCharacterRelationshipAction(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) redirect("/admin/relationships?error=validation");
  try {
    await prisma.characterRelationship.delete({ where: { id } });
  } catch {
    redirect("/admin/relationships?error=db");
  }
  revalidatePath("/admin/relationships");
  revalidatePath("/admin/brain");
  redirect("/admin/relationships?saved=del");
}
