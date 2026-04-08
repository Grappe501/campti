"use server";

import { prisma } from "@/lib/prisma";
import { personCreateSchema, personUpdateSchema } from "@/lib/validation";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.HYBRID;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createPerson(formData: FormData) {
  const parsed = personCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    birthYear: formData.get("birthYear"),
    deathYear: formData.get("deathYear"),
    enneagram: formData.get("enneagram"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    redirect("/admin/people?error=validation");
  }

  const d = parsed.data;
  await prisma.person.create({
    data: {
      name: d.name,
      description: d.description?.length ? d.description : null,
      birthYear: d.birthYear ?? null,
      deathYear: d.deathYear ?? null,
      enneagram: d.enneagram ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/people");
  redirect("/admin/people");
}

export async function updatePerson(formData: FormData) {
  const parsed = personUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    birthYear: formData.get("birthYear"),
    deathYear: formData.get("deathYear"),
    enneagram: formData.get("enneagram"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/people/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.person.update({
    where: { id: d.id },
    data: {
      name: d.name,
      description: d.description?.length ? d.description : null,
      birthYear: d.birthYear ?? null,
      deathYear: d.deathYear ?? null,
      enneagram: d.enneagram ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${d.id}`);
  redirect(`/admin/people/${d.id}`);
}
