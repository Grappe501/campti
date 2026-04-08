"use server";

import { prisma } from "@/lib/prisma";
import { openQuestionSchema, openQuestionUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function optId(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createOpenQuestion(formData: FormData) {
  const parsed = openQuestionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    linkedPersonId: optId(formData.get("linkedPersonId")),
    linkedPlaceId: optId(formData.get("linkedPlaceId")),
    linkedEventId: optId(formData.get("linkedEventId")),
    linkedSourceId: optId(formData.get("linkedSourceId")),
  });

  if (!parsed.success) {
    redirect("/admin/questions?error=validation");
  }

  const d = parsed.data;
  await prisma.openQuestion.create({
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      status: d.status,
      priority: d.priority ?? null,
      linkedPersonId: d.linkedPersonId ?? null,
      linkedPlaceId: d.linkedPlaceId ?? null,
      linkedEventId: d.linkedEventId ?? null,
      linkedSourceId: d.linkedSourceId ?? null,
    },
  });

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function updateOpenQuestion(formData: FormData) {
  const parsed = openQuestionUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    linkedPersonId: optId(formData.get("linkedPersonId")),
    linkedPlaceId: optId(formData.get("linkedPlaceId")),
    linkedEventId: optId(formData.get("linkedEventId")),
    linkedSourceId: optId(formData.get("linkedSourceId")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/questions/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.openQuestion.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      status: d.status,
      priority: d.priority ?? null,
      linkedPersonId: d.linkedPersonId ?? null,
      linkedPlaceId: d.linkedPlaceId ?? null,
      linkedEventId: d.linkedEventId ?? null,
      linkedSourceId: d.linkedSourceId ?? null,
    },
  });

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${d.id}`);
  redirect(`/admin/questions/${d.id}`);
}
