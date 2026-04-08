"use server";

import { prisma } from "@/lib/prisma";
import {
  extractedEntityIdSchema,
  extractedEntityReviewSchema,
} from "@/lib/ingestion-validation";
import { promoteExtractedAsNewCanonical } from "@/lib/entity-merge";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateExtractedEntityReview(formData: FormData) {
  const parsed = extractedEntityReviewSchema.safeParse({
    id: formData.get("id"),
    reviewStatus: formData.get("reviewStatus"),
    reviewerNotes: formData.get("reviewerNotes"),
    matchedRecordId: formData.get("matchedRecordId"),
    matchedRecordType: formData.get("matchedRecordType"),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(
      id ? `/admin/extracted/${id}?error=validation` : "/admin/extracted?error=validation",
    );
  }

  const d = parsed.data;
  const data: {
    reviewStatus: typeof d.reviewStatus;
    reviewerNotes?: string | null;
    matchedRecordId?: string | null;
    matchedRecordType?: string | null;
  } = { reviewStatus: d.reviewStatus };

  if (d.reviewerNotes !== undefined && d.reviewerNotes !== null) {
    data.reviewerNotes = d.reviewerNotes.length ? d.reviewerNotes : null;
  }
  if (d.matchedRecordId !== undefined) {
    data.matchedRecordId = d.matchedRecordId?.length ? d.matchedRecordId : null;
  }
  if (d.matchedRecordType !== undefined) {
    data.matchedRecordType = d.matchedRecordType?.length ? d.matchedRecordType : null;
  }

  await prisma.extractedEntity.update({
    where: { id: d.id },
    data,
  });

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${d.id}`);
  redirect(`/admin/extracted/${d.id}?saved=1`);
}

export async function addReviewerNoteAction(formData: FormData) {
  const parsed = extractedEntityIdSchema.safeParse({ id: formData.get("id") });
  const note = String(formData.get("reviewerNotes") ?? "").trim();
  if (!parsed.success || !note.length) {
    const id = String(formData.get("id") ?? "");
    redirect(id ? `/admin/extracted/${id}?error=validation` : "/admin/extracted");
  }

  const existing = await prisma.extractedEntity.findUnique({
    where: { id: parsed.data.id },
  });
  const prev = existing?.reviewerNotes?.trim() ?? "";
  const merged = prev.length ? `${prev}\n\n${note}` : note;

  await prisma.extractedEntity.update({
    where: { id: parsed.data.id },
    data: { reviewerNotes: merged },
  });

  revalidatePath(`/admin/extracted/${parsed.data.id}`);
  redirect(`/admin/extracted/${parsed.data.id}?saved=note`);
}

export async function promoteExtractedEntityAction(formData: FormData) {
  const parsed = extractedEntityIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/extracted?error=validation");

  const entity = await prisma.extractedEntity.findUnique({ where: { id: parsed.data.id } });
  if (!entity) redirect("/admin/extracted?error=notfound");
  if (entity.matchedRecordId || entity.canonicalRecordId) redirect(`/admin/extracted/${entity.id}?error=already_linked`);

  const result = await promoteExtractedAsNewCanonical({ extractedEntityId: entity.id });
  if (!result.ok) redirect(`/admin/extracted/${entity.id}?error=${encodeURIComponent(result.reason)}`);

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${entity.id}`);
  revalidatePath(`/admin/ingestion/${entity.sourceId}`);
  redirect(`/admin/extracted/${entity.id}?promoted=${encodeURIComponent(result.recordType)}`);
}
