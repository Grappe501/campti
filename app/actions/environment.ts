"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  environmentNodeCreateSchema,
  environmentNodeUpdateSchema,
  nodeConnectionCreateSchema,
  nodeConnectionUpdateSchema,
  parseEnvJson,
  placeEnvironmentProfileUpsertSchema,
  placeMemoryProfileCreateSchema,
  placeMemoryProfileUpdateSchema,
  placeStateCreateSchema,
  placeStateUpdateSchema,
  riskRegimeCreateSchema,
  riskRegimeUpdateSchema,
} from "@/lib/environment-schemas";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

function envRevalidatePlace(placeId: string) {
  revalidatePath(`/admin/places/${placeId}/environment`);
  revalidatePath(`/admin/places/${placeId}`);
}

export async function createPlaceEnvironmentProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = placeEnvironmentProfileUpsertSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  try {
    await prisma.placeEnvironmentProfile.upsert({
      where: { placeId: d.placeId },
      create: {
        placeId: d.placeId,
        terrainType: d.terrainType ?? null,
        hydrologyType: d.hydrologyType ?? null,
        fertilityProfile: d.fertilityProfile ?? null,
        floodRiskLevel: d.floodRiskLevel ?? undefined,
        droughtRiskLevel: d.droughtRiskLevel ?? undefined,
        mobilityProfile: d.mobilityProfile ?? null,
        sensoryProfile: parseEnvJson(d.sensoryProfileJson ?? undefined),
        resourceProfile: parseEnvJson(d.resourceProfileJson ?? undefined),
        sacredProfile: parseEnvJson(d.sacredProfileJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
      update: {
        terrainType: d.terrainType ?? null,
        hydrologyType: d.hydrologyType ?? null,
        fertilityProfile: d.fertilityProfile ?? null,
        floodRiskLevel: d.floodRiskLevel ?? undefined,
        droughtRiskLevel: d.droughtRiskLevel ?? undefined,
        mobilityProfile: d.mobilityProfile ?? null,
        sensoryProfile: parseEnvJson(d.sensoryProfileJson ?? undefined),
        resourceProfile: parseEnvJson(d.resourceProfileJson ?? undefined),
        sacredProfile: parseEnvJson(d.sacredProfileJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  envRevalidatePlace(placeId);
  redirect(`/admin/places/${placeId}/environment?saved=1`);
}

export async function updatePlaceEnvironmentProfile(formData: FormData) {
  return createPlaceEnvironmentProfile(formData);
}

export async function createPlaceState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = placeStateCreateSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  try {
    await prisma.placeState.create({
      data: {
        placeId: d.placeId,
        label: d.label,
        worldStateId: d.worldStateId ?? null,
        settlementPattern: d.settlementPattern ?? null,
        strategicValue: d.strategicValue ?? undefined,
        riskLevel: d.riskLevel ?? undefined,
        controlProfile: parseEnvJson(d.controlProfileJson ?? undefined),
        accessProfile: parseEnvJson(d.accessProfileJson ?? undefined),
        transportProfile: parseEnvJson(d.transportProfileJson ?? undefined),
        economicProfile: parseEnvJson(d.economicProfileJson ?? undefined),
        pressureProfile: parseEnvJson(d.pressureProfileJson ?? undefined),
        memoryLoad: parseEnvJson(d.memoryLoadJson ?? undefined),
        activePopulationEstimate: d.activePopulationEstimate ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  envRevalidatePlace(placeId);
  redirect(`/admin/places/${placeId}/environment?saved=state`);
}

export async function updatePlaceState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = placeStateUpdateSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  try {
    await prisma.placeState.update({
      where: { id: d.id },
      data: {
        label: d.label,
        worldStateId: d.worldStateId ?? null,
        settlementPattern: d.settlementPattern ?? null,
        strategicValue: d.strategicValue ?? undefined,
        riskLevel: d.riskLevel ?? undefined,
        controlProfile: parseEnvJson(d.controlProfileJson ?? undefined),
        accessProfile: parseEnvJson(d.accessProfileJson ?? undefined),
        transportProfile: parseEnvJson(d.transportProfileJson ?? undefined),
        economicProfile: parseEnvJson(d.economicProfileJson ?? undefined),
        pressureProfile: parseEnvJson(d.pressureProfileJson ?? undefined),
        memoryLoad: parseEnvJson(d.memoryLoadJson ?? undefined),
        activePopulationEstimate: d.activePopulationEstimate ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  envRevalidatePlace(placeId);
  redirect(`/admin/places/${placeId}/environment?saved=state`);
}

export async function createEnvironmentNode(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = environmentNodeCreateSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/nodes?error=validation");

  const d = parsed.data;
  try {
    const node = await prisma.environmentNode.create({
      data: {
        placeId: d.placeId,
        key: d.key,
        label: d.label,
        nodeType: d.nodeType ?? null,
        isCoreNode: d.isCoreNode,
        regionLabel: d.regionLabel ?? null,
        summary: d.summary ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/nodes");
    envRevalidatePlace(placeId);
    redirect(`/admin/nodes/${node.id}?saved=1`);
  } catch {
    redirect(`/admin/nodes/new?error=db`);
  }
}

export async function updateEnvironmentNode(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = environmentNodeUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/nodes?error=validation");

  const d = parsed.data;
  try {
    const existing = await prisma.environmentNode.findUnique({ where: { id: d.id } });
    if (!existing) redirect("/admin/nodes?error=validation");

    await prisma.environmentNode.update({
      where: { id: d.id },
      data: {
        key: d.key,
        label: d.label,
        nodeType: d.nodeType ?? null,
        isCoreNode: d.isCoreNode,
        regionLabel: d.regionLabel ?? null,
        summary: d.summary ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/nodes");
    revalidatePath(`/admin/nodes/${d.id}`);
    envRevalidatePlace(existing.placeId);
    redirect(`/admin/nodes/${d.id}?saved=1`);
  } catch {
    redirect(`/admin/nodes/${d.id}?error=db`);
  }
}

export async function createNodeConnection(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = nodeConnectionCreateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/connections?error=validation");

  const d = parsed.data;
  try {
    const row = await prisma.nodeConnection.create({
      data: {
        fromNodeId: d.fromNodeId,
        toNodeId: d.toNodeId,
        connectionType: d.connectionType,
        bidirectional: d.bidirectional,
        travelRisk: d.travelRisk ?? undefined,
        travelDifficulty: d.travelDifficulty ?? undefined,
        seasonalModifier: parseEnvJson(d.seasonalModifierJson ?? undefined),
        worldStateId: d.worldStateId ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/connections");
    revalidatePath(`/admin/connections/${row.id}`);
    redirect(`/admin/connections/${row.id}?saved=1`);
  } catch {
    redirect("/admin/connections/new?error=db");
  }
}

export async function updateNodeConnection(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = nodeConnectionUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/connections?error=validation");

  const d = parsed.data;
  try {
    await prisma.nodeConnection.update({
      where: { id: d.id },
      data: {
        fromNodeId: d.fromNodeId,
        toNodeId: d.toNodeId,
        connectionType: d.connectionType,
        bidirectional: d.bidirectional,
        travelRisk: d.travelRisk ?? undefined,
        travelDifficulty: d.travelDifficulty ?? undefined,
        seasonalModifier: parseEnvJson(d.seasonalModifierJson ?? undefined),
        worldStateId: d.worldStateId ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/connections");
    revalidatePath(`/admin/connections/${d.id}`);
    redirect(`/admin/connections/${d.id}?saved=1`);
  } catch {
    redirect(`/admin/connections/${d.id}?error=db`);
  }
}

export async function createRiskRegime(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = riskRegimeCreateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/risks?error=validation");

  const d = parsed.data;
  try {
    const row = await prisma.riskRegime.create({
      data: {
        key: d.key,
        label: d.label,
        description: d.description ?? null,
        category: d.category,
        baseSeverity: d.baseSeverity ?? undefined,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/risks");
    redirect(`/admin/risks/${row.id}?saved=1`);
  } catch {
    redirect("/admin/risks/new?error=db");
  }
}

export async function updateRiskRegime(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = riskRegimeUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/risks?error=validation");

  const d = parsed.data;
  try {
    await prisma.riskRegime.update({
      where: { id: d.id },
      data: {
        key: d.key,
        label: d.label,
        description: d.description ?? null,
        category: d.category,
        baseSeverity: d.baseSeverity ?? undefined,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
    revalidatePath("/admin/risks");
    revalidatePath(`/admin/risks/${d.id}`);
    redirect(`/admin/risks/${d.id}?saved=1`);
  } catch {
    redirect(`/admin/risks/${d.id}?error=db`);
  }
}

export async function createPlaceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = placeMemoryProfileCreateSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  try {
    await prisma.placeMemoryProfile.create({
      data: {
        placeId: d.placeId,
        memoryType: d.memoryType,
        label: d.label,
        description: d.description ?? null,
        worldStateId: d.worldStateId ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  envRevalidatePlace(placeId);
  redirect(`/admin/places/${placeId}/environment?saved=memory`);
}

export async function updatePlaceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = placeMemoryProfileUpdateSchema.safeParse(raw);
  const placeId = raw.placeId;
  if (!placeId || !parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  try {
    await prisma.placeMemoryProfile.update({
      where: { id: d.id },
      data: {
        memoryType: d.memoryType,
        label: d.label,
        description: d.description ?? null,
        worldStateId: d.worldStateId ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  envRevalidatePlace(placeId);
  redirect(`/admin/places/${placeId}/environment?saved=memory`);
}
