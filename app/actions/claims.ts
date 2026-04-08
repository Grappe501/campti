"use server";

import { prisma } from "@/lib/prisma";
import { claimCreateSchema, claimUpdateSchema } from "@/lib/validation";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.HISTORICAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createClaim(formData: FormData) {
  const parsed = claimCreateSchema.safeParse({
    description: formData.get("description"),
    sourceId: formData.get("sourceId"),
    confidence: formData.get("confidence"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
    quoteExcerpt: formData.get("quoteExcerpt"),
    notes: formData.get("notes"),
    needsReview: formData.get("needsReview") === "on",
  });

  if (!parsed.success) {
    redirect("/admin/claims?error=validation");
  }

  const d = parsed.data;
  await prisma.claim.create({
    data: {
      description: d.description,
      sourceId: d.sourceId,
      confidence: d.confidence,
      visibility: d.visibility,
      recordType: d.recordType,
      quoteExcerpt: d.quoteExcerpt?.length ? d.quoteExcerpt : null,
      notes: d.notes?.length ? d.notes : null,
      needsReview: d.needsReview ?? true,
    },
  });

  revalidatePath("/admin/claims");
  redirect("/admin/claims");
}

export async function updateClaim(formData: FormData) {
  const parsed = claimUpdateSchema.safeParse({
    id: formData.get("id"),
    description: formData.get("description"),
    sourceId: formData.get("sourceId"),
    confidence: formData.get("confidence"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
    quoteExcerpt: formData.get("quoteExcerpt"),
    notes: formData.get("notes"),
    needsReview: formData.get("needsReview") === "on",
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/claims/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.claim.update({
    where: { id: d.id },
    data: {
      description: d.description,
      sourceId: d.sourceId,
      confidence: d.confidence,
      visibility: d.visibility,
      recordType: d.recordType,
      quoteExcerpt: d.quoteExcerpt?.length ? d.quoteExcerpt : null,
      notes: d.notes?.length ? d.notes : null,
      needsReview: d.needsReview ?? true,
    },
  });

  revalidatePath("/admin/claims");
  revalidatePath(`/admin/claims/${d.id}`);
  redirect(`/admin/claims/${d.id}`);
}
