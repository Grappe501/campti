"use server";

import { prisma } from "@/lib/prisma";
import { sourceCreateSchema } from "@/lib/validation";
import { RecordType, SourceType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSourceType(v: string): SourceType {
  const allowed = Object.values(SourceType) as string[];
  return allowed.includes(v) ? (v as SourceType) : SourceType.NOTE;
}

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.HISTORICAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createSource(formData: FormData) {
  const ingestionReady = formData.get("ingestionReady") === "on";
  const parsed = sourceCreateSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    sourceType: parseSourceType(String(formData.get("sourceType") ?? "")),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
    filePath: formData.get("filePath"),
    originalFilename: formData.get("originalFilename"),
    notes: formData.get("notes"),
    sourceDate: formData.get("sourceDate"),
    sourceYear: formData.get("sourceYear"),
    authorOrOrigin: formData.get("authorOrOrigin"),
    archiveStatus: formData.get("archiveStatus"),
    ingestionStatus: formData.get("ingestionStatus"),
  });

  if (!parsed.success) {
    redirect("/admin/sources?error=validation");
  }

  const d = parsed.data;
  await prisma.source.create({
    data: {
      title: d.title,
      summary: d.summary?.length ? d.summary : null,
      sourceType: d.sourceType,
      visibility: d.visibility,
      recordType: d.recordType,
      filePath: d.filePath?.length ? d.filePath : null,
      originalFilename: d.originalFilename?.length ? d.originalFilename : null,
      notes: d.notes?.length ? d.notes : null,
      sourceDate: d.sourceDate?.length ? d.sourceDate : null,
      sourceYear: d.sourceYear ?? null,
      authorOrOrigin: d.authorOrOrigin?.length ? d.authorOrOrigin : null,
      archiveStatus: d.archiveStatus?.length ? d.archiveStatus : null,
      ingestionStatus: d.ingestionStatus?.length ? d.ingestionStatus : null,
      ingestionReady,
    },
  });

  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function updateSource(id: string, formData: FormData) {
  const ingestionReady = formData.get("ingestionReady") === "on";
  const parsed = sourceCreateSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    sourceType: parseSourceType(String(formData.get("sourceType") ?? "")),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
    filePath: formData.get("filePath"),
    originalFilename: formData.get("originalFilename"),
    notes: formData.get("notes"),
    sourceDate: formData.get("sourceDate"),
    sourceYear: formData.get("sourceYear"),
    authorOrOrigin: formData.get("authorOrOrigin"),
    archiveStatus: formData.get("archiveStatus"),
    ingestionStatus: formData.get("ingestionStatus"),
  });

  if (!parsed.success) {
    redirect(`/admin/sources/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.source.update({
    where: { id },
    data: {
      title: d.title,
      summary: d.summary?.length ? d.summary : null,
      sourceType: d.sourceType,
      visibility: d.visibility,
      recordType: d.recordType,
      filePath: d.filePath?.length ? d.filePath : null,
      originalFilename: d.originalFilename?.length ? d.originalFilename : null,
      notes: d.notes?.length ? d.notes : null,
      sourceDate: d.sourceDate?.length ? d.sourceDate : null,
      sourceYear: d.sourceYear ?? null,
      authorOrOrigin: d.authorOrOrigin?.length ? d.authorOrOrigin : null,
      archiveStatus: d.archiveStatus?.length ? d.archiveStatus : null,
      ingestionStatus: d.ingestionStatus?.length ? d.ingestionStatus : null,
      ingestionReady,
    },
  });

  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${id}`);
  redirect(`/admin/sources/${id}`);
}
