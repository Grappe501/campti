"use server";

import { prisma } from "@/lib/prisma";
import { continuityNoteSchema, continuityNoteUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function optId(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createContinuityNote(formData: FormData) {
  const parsed = continuityNoteSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    status: formData.get("status"),
    linkedChapterId: optId(formData.get("linkedChapterId")),
    linkedSceneId: optId(formData.get("linkedSceneId")),
    linkedPersonId: optId(formData.get("linkedPersonId")),
    linkedEventId: optId(formData.get("linkedEventId")),
  });

  if (!parsed.success) {
    redirect("/admin/continuity?error=validation");
  }

  const d = parsed.data;
  await prisma.continuityNote.create({
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      severity: d.severity,
      status: d.status,
      linkedChapterId: d.linkedChapterId ?? null,
      linkedSceneId: d.linkedSceneId ?? null,
      linkedPersonId: d.linkedPersonId ?? null,
      linkedEventId: d.linkedEventId ?? null,
    },
  });

  revalidatePath("/admin/continuity");
  redirect("/admin/continuity");
}

export async function updateContinuityNote(formData: FormData) {
  const parsed = continuityNoteUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    status: formData.get("status"),
    linkedChapterId: optId(formData.get("linkedChapterId")),
    linkedSceneId: optId(formData.get("linkedSceneId")),
    linkedPersonId: optId(formData.get("linkedPersonId")),
    linkedEventId: optId(formData.get("linkedEventId")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/continuity/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.continuityNote.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      severity: d.severity,
      status: d.status,
      linkedChapterId: d.linkedChapterId ?? null,
      linkedSceneId: d.linkedSceneId ?? null,
      linkedPersonId: d.linkedPersonId ?? null,
      linkedEventId: d.linkedEventId ?? null,
    },
  });

  revalidatePath("/admin/continuity");
  revalidatePath(`/admin/continuity/${d.id}`);
  redirect(`/admin/continuity/${d.id}`);
}
