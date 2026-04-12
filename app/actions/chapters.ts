"use server";

import { DEFAULT_BOOK_ID } from "@/lib/constants/narrative-defaults";
import { prisma } from "@/lib/prisma";
import { chapterCreateSchema, chapterUpdateSchema } from "@/lib/validation";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.FICTIONAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createChapter(formData: FormData) {
  const parsed = chapterCreateSchema.safeParse({
    title: formData.get("title"),
    bookId: formData.get("bookId"),
    summary: formData.get("summary"),
    timePeriod: formData.get("timePeriod"),
    chapterNumber: formData.get("chapterNumber"),
    status: formData.get("status"),
    pov: formData.get("pov"),
    historicalAnchor: formData.get("historicalAnchor"),
    privateNotes: formData.get("privateNotes"),
    publicNotes: formData.get("publicNotes"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    redirect("/admin/chapters?error=validation");
  }

  const d = parsed.data;
  await prisma.chapter.create({
    data: {
      bookId: d.bookId?.trim() || DEFAULT_BOOK_ID,
      title: d.title,
      summary: d.summary?.length ? d.summary : null,
      timePeriod: d.timePeriod?.length ? d.timePeriod : null,
      chapterNumber: d.chapterNumber ?? null,
      status: d.status?.length ? d.status : null,
      pov: d.pov?.length ? d.pov : null,
      historicalAnchor: d.historicalAnchor?.length ? d.historicalAnchor : null,
      privateNotes: d.privateNotes?.length ? d.privateNotes : null,
      publicNotes: d.publicNotes?.length ? d.publicNotes : null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/chapters");
  redirect("/admin/chapters");
}

export async function updateChapter(formData: FormData) {
  const parsed = chapterUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    timePeriod: formData.get("timePeriod"),
    chapterNumber: formData.get("chapterNumber"),
    status: formData.get("status"),
    pov: formData.get("pov"),
    historicalAnchor: formData.get("historicalAnchor"),
    privateNotes: formData.get("privateNotes"),
    publicNotes: formData.get("publicNotes"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/chapters/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.chapter.update({
    where: { id: d.id },
    data: {
      title: d.title,
      summary: d.summary?.length ? d.summary : null,
      timePeriod: d.timePeriod?.length ? d.timePeriod : null,
      chapterNumber: d.chapterNumber ?? null,
      status: d.status?.length ? d.status : null,
      pov: d.pov?.length ? d.pov : null,
      historicalAnchor: d.historicalAnchor?.length ? d.historicalAnchor : null,
      privateNotes: d.privateNotes?.length ? d.privateNotes : null,
      publicNotes: d.publicNotes?.length ? d.publicNotes : null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/chapters");
  revalidatePath(`/admin/chapters/${d.id}`);
  redirect(`/admin/chapters/${d.id}`);
}
