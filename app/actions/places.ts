"use server";

import { prisma } from "@/lib/prisma";
import { placeCreateSchema, placeUpdateSchema } from "@/lib/validation";
import { PlaceType, RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parsePlaceType(v: string): PlaceType {
  const allowed = Object.values(PlaceType) as string[];
  return allowed.includes(v) ? (v as PlaceType) : PlaceType.OTHER;
}

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.HISTORICAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createPlace(formData: FormData) {
  const parsed = placeCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    placeType: parsePlaceType(String(formData.get("placeType") ?? "")),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    redirect("/admin/places?error=validation");
  }

  const d = parsed.data;
  await prisma.place.create({
    data: {
      name: d.name,
      description: d.description?.length ? d.description : null,
      placeType: d.placeType,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function updatePlace(formData: FormData) {
  const parsed = placeUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    placeType: parsePlaceType(String(formData.get("placeType") ?? "")),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/places/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.place.update({
    where: { id: d.id },
    data: {
      name: d.name,
      description: d.description?.length ? d.description : null,
      placeType: d.placeType,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/places");
  revalidatePath(`/admin/places/${d.id}`);
  redirect(`/admin/places/${d.id}`);
}
