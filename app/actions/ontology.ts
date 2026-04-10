"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  confidenceProfileCreateSchema,
  confidenceProfileSaveSchema,
  idOnlySchema,
  narrativePermissionCreateSchema,
  narrativePermissionSaveSchema,
  ontologyTypeCreateSchema,
  ontologyTypeSaveSchema,
  parseJsonObjectField,
  registryValueCreateSchema,
  registryValueSaveSchema,
  sceneReadinessCreateSchema,
  sceneReadinessSaveSchema,
} from "@/lib/ontology-schemas";

function revAll() {
  revalidatePath("/admin/ontology");
  revalidatePath("/admin/registries");
  revalidatePath("/admin/registries/values");
  revalidatePath("/admin/permissions");
  revalidatePath("/admin/confidence");
  revalidatePath("/admin/readiness");
}

export async function createOntologyType(formData: FormData) {
  const appliesRaw = String(formData.get("appliesToJson") ?? "");
  const appliesTo = parseJsonObjectField(appliesRaw);
  if (appliesTo === null) redirect("/admin/ontology/new?error=validation");
  const parsed = ontologyTypeCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    family: String(formData.get("family") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    appliesTo,
    sourceTraceNote: String(formData.get("sourceTraceNote") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/admin/ontology/new?error=validation");
  const d = parsed.data;
  try {
    await prisma.ontologyType.create({
      data: {
        key: d.key,
        name: d.name,
        description: d.description,
        family: d.family,
        isActive: d.isActive,
        recordType: d.recordType,
        visibility: d.visibility,
        appliesTo: d.appliesTo as Prisma.InputJsonValue | undefined,
        sourceTraceNote: d.sourceTraceNote,
        notes: d.notes,
      },
    });
  } catch {
    redirect("/admin/ontology/new?error=db");
  }
  revAll();
  redirect("/admin/ontology?saved=1");
}

export async function updateOntologyType(formData: FormData) {
  const applies = parseJsonObjectField(String(formData.get("appliesToJson") ?? ""));
  if (applies === null) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/ontology/${id}?error=validation`);
  }
  const parsed = ontologyTypeSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    family: String(formData.get("family") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    appliesTo: applies,
    sourceTraceNote: String(formData.get("sourceTraceNote") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) {
    redirect(`/admin/ontology/${String(formData.get("id") ?? "")}?error=validation`);
  }
  const d = parsed.data;
  const { id, appliesTo, ...rest } = d;
  try {
    await prisma.ontologyType.update({
      where: { id },
      data: {
        ...rest,
        appliesTo: appliesTo === undefined ? Prisma.JsonNull : (appliesTo as Prisma.InputJsonValue),
      },
    });
  } catch {
    redirect(`/admin/ontology/${id}?error=db`);
  }
  revAll();
  redirect(`/admin/ontology/${id}?saved=1`);
}

export async function toggleOntologyTypeActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = idOnlySchema.safeParse({ id });
  if (!parsed.success) redirect("/admin/ontology?error=validation");
  try {
    const row = await prisma.ontologyType.findUnique({ where: { id: parsed.data.id } });
    if (!row) redirect("/admin/ontology?error=notfound");
    await prisma.ontologyType.update({
      where: { id: row.id },
      data: { isActive: !row.isActive },
    });
  } catch {
    redirect("/admin/ontology?error=db");
  }
  revAll();
  redirect("/admin/ontology");
}

export async function createRegistryValue(formData: FormData) {
  const cfg = parseJsonObjectField(String(formData.get("configJson") ?? ""));
  const app = parseJsonObjectField(String(formData.get("appliesToJson") ?? ""));
  if (cfg === null || app === null) redirect("/admin/registries/values/new?error=validation");
  const parsed = registryValueCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    registryType: String(formData.get("registryType") ?? "default").trim() || "default",
    family: String(formData.get("family") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    config: cfg,
    appliesTo: app,
    sourceTraceNote: String(formData.get("sourceTraceNote") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/admin/registries/values/new?error=validation");
  const d = parsed.data;
  try {
    await prisma.registryValue.create({
      data: {
        key: d.key,
        label: d.label,
        description: d.description,
        registryType: d.registryType,
        family: d.family,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        config: d.config as Prisma.InputJsonValue | undefined,
        appliesTo: d.appliesTo as Prisma.InputJsonValue | undefined,
        sourceTraceNote: d.sourceTraceNote,
        notes: d.notes,
      },
    });
  } catch {
    redirect("/admin/registries/values/new?error=db");
  }
  revAll();
  redirect("/admin/registries/values?saved=1");
}

export async function updateRegistryValue(formData: FormData) {
  const cfg = parseJsonObjectField(String(formData.get("configJson") ?? ""));
  const app = parseJsonObjectField(String(formData.get("appliesToJson") ?? ""));
  if (cfg === null || app === null) {
    redirect(`/admin/registries/values/${String(formData.get("id") ?? "")}?error=validation`);
  }
  const parsed = registryValueSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    registryType: String(formData.get("registryType") ?? "default").trim() || "default",
    family: String(formData.get("family") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    config: cfg,
    appliesTo: app,
    sourceTraceNote: String(formData.get("sourceTraceNote") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) {
    redirect(`/admin/registries/values/${String(formData.get("id") ?? "")}?error=validation`);
  }
  const d = parsed.data;
  const { id, config, appliesTo, ...rest } = d;
  try {
    await prisma.registryValue.update({
      where: { id },
      data: {
        ...rest,
        config: config === undefined ? Prisma.JsonNull : (config as Prisma.InputJsonValue),
        appliesTo: appliesTo === undefined ? Prisma.JsonNull : (appliesTo as Prisma.InputJsonValue),
      },
    });
  } catch {
    redirect(`/admin/registries/values/${id}?error=db`);
  }
  revAll();
  redirect(`/admin/registries/values/${id}?saved=1`);
}

export async function toggleRegistryValueActive(formData: FormData) {
  const parsed = idOnlySchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) redirect("/admin/registries/values?error=validation");
  try {
    const row = await prisma.registryValue.findUnique({ where: { id: parsed.data.id } });
    if (!row) redirect("/admin/registries/values?error=notfound");
    await prisma.registryValue.update({
      where: { id: row.id },
      data: { isActive: !row.isActive },
    });
  } catch {
    redirect("/admin/registries/values?error=db");
  }
  revAll();
  redirect("/admin/registries/values");
}

export async function createNarrativePermissionProfile(formData: FormData) {
  const parsed = narrativePermissionCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    isActive: String(formData.get("isActive") ?? "true") === "true",
    allowsDirectNarrativeUse: String(formData.get("allowsDirectNarrativeUse") ?? "false") === "true",
    allowsSceneSupport: String(formData.get("allowsSceneSupport") ?? "false") === "true",
    allowsAtmosphereSupport: String(formData.get("allowsAtmosphereSupport") ?? "false") === "true",
    allowsCanonicalReveal: String(formData.get("allowsCanonicalReveal") ?? "false") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/admin/permissions/new?error=validation");
  const d = parsed.data;
  try {
    await prisma.narrativePermissionProfile.create({
      data: {
        key: d.key,
        name: d.name,
        description: d.description,
        isActive: d.isActive,
        allowsDirectNarrativeUse: d.allowsDirectNarrativeUse,
        allowsSceneSupport: d.allowsSceneSupport,
        allowsAtmosphereSupport: d.allowsAtmosphereSupport,
        allowsCanonicalReveal: d.allowsCanonicalReveal,
        recordType: d.recordType,
        visibility: d.visibility,
        notes: d.notes,
      },
    });
  } catch {
    redirect("/admin/permissions/new?error=db");
  }
  revAll();
  redirect("/admin/permissions?saved=1");
}

export async function updateNarrativePermissionProfile(formData: FormData) {
  const parsed = narrativePermissionSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    isActive: String(formData.get("isActive") ?? "true") === "true",
    allowsDirectNarrativeUse: String(formData.get("allowsDirectNarrativeUse") ?? "false") === "true",
    allowsSceneSupport: String(formData.get("allowsSceneSupport") ?? "false") === "true",
    allowsAtmosphereSupport: String(formData.get("allowsAtmosphereSupport") ?? "false") === "true",
    allowsCanonicalReveal: String(formData.get("allowsCanonicalReveal") ?? "false") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect(`/admin/permissions/${String(formData.get("id") ?? "")}?error=validation`);
  const d = parsed.data;
  const { id, ...rest } = d;
  try {
    await prisma.narrativePermissionProfile.update({
      where: { id },
      data: rest,
    });
  } catch {
    redirect(`/admin/permissions/${id}?error=db`);
  }
  revAll();
  redirect(`/admin/permissions/${id}?saved=1`);
}

export async function createConfidenceProfile(formData: FormData) {
  const parsed = confidenceProfileCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    numericValue: String(formData.get("numericValue") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/admin/confidence/new?error=validation");
  const d = parsed.data;
  try {
    await prisma.confidenceProfile.create({ data: d });
  } catch {
    redirect("/admin/confidence/new?error=db");
  }
  revAll();
  redirect("/admin/confidence?saved=1");
}

export async function updateConfidenceProfile(formData: FormData) {
  const parsed = confidenceProfileSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    numericValue: String(formData.get("numericValue") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect(`/admin/confidence/${String(formData.get("id") ?? "")}?error=validation`);
  const d = parsed.data;
  const { id, ...rest } = d;
  try {
    await prisma.confidenceProfile.update({ where: { id }, data: rest });
  } catch {
    redirect(`/admin/confidence/${id}?error=db`);
  }
  revAll();
  redirect(`/admin/confidence/${id}?saved=1`);
}

export async function createSceneReadinessProfile(formData: FormData) {
  const parsed = sceneReadinessCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    isDraftable: String(formData.get("isDraftable") ?? "false") === "true",
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/admin/readiness/new?error=validation");
  const d = parsed.data;
  try {
    await prisma.sceneReadinessProfile.create({ data: d });
  } catch {
    redirect("/admin/readiness/new?error=db");
  }
  revAll();
  redirect("/admin/readiness?saved=1");
}

export async function updateSceneReadinessProfile(formData: FormData) {
  const parsed = sceneReadinessSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    isDraftable: String(formData.get("isDraftable") ?? "false") === "true",
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (!parsed.success) redirect(`/admin/readiness/${String(formData.get("id") ?? "")}?error=validation`);
  const d = parsed.data;
  const { id, ...rest } = d;
  try {
    await prisma.sceneReadinessProfile.update({ where: { id }, data: rest });
  } catch {
    redirect(`/admin/readiness/${id}?error=db`);
  }
  revAll();
  redirect(`/admin/readiness/${id}?saved=1`);
}
