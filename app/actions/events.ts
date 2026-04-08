"use server";

import { prisma } from "@/lib/prisma";
import { eventCreateSchema, eventUpdateSchema } from "@/lib/validation";
import { EventType, RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseEventType(v: string): EventType {
  const allowed = Object.values(EventType) as string[];
  return allowed.includes(v) ? (v as EventType) : EventType.OTHER;
}

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.HISTORICAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createEvent(formData: FormData) {
  const parsed = eventCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    eventType: parseEventType(String(formData.get("eventType") ?? "")),
    startYear: formData.get("startYear"),
    endYear: formData.get("endYear"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    redirect("/admin/events?error=validation");
  }

  const d = parsed.data;
  await prisma.event.create({
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      eventType: d.eventType,
      startYear: d.startYear ?? null,
      endYear: d.endYear ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(formData: FormData) {
  const parsed = eventUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    eventType: parseEventType(String(formData.get("eventType") ?? "")),
    startYear: formData.get("startYear"),
    endYear: formData.get("endYear"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/events/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.event.update({
    where: { id: d.id },
    data: {
      title: d.title,
      description: d.description?.length ? d.description : null,
      eventType: d.eventType,
      startYear: d.startYear ?? null,
      endYear: d.endYear ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${d.id}`);
  redirect(`/admin/events/${d.id}`);
}
