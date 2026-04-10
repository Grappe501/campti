"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  deleteEnvironmentNodeSchema,
  deleteNodeConnectionSchema,
  deletePlaceMemoryProfileSchema,
  deletePlaceStateSchema,
  deleteRiskRegimeSchema,
  environmentNodeCreateSchema,
  environmentNodeUpdateSchema,
  nodeConnectionCreateSchema,
  nodeConnectionUpdateSchema,
  parseEnvJson,
  patchEnvJsonFromForm,
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
    const existing = await prisma.placeState.findUnique({ where: { id: d.id } });
    if (!existing || existing.placeId !== placeId) redirect("/admin/places?error=validation");

    const data: Prisma.PlaceStateUpdateInput = {
      label: d.label,
      worldState: d.worldStateId ? { connect: { id: d.worldStateId } } : { disconnect: true },
      settlementPattern: d.settlementPattern ?? null,
      strategicValue: d.strategicValue ?? undefined,
      riskLevel: d.riskLevel ?? undefined,
      activePopulationEstimate: d.activePopulationEstimate ?? null,
      notes: d.notes ?? null,
      recordType: d.recordType,
      visibility: d.visibility,
      certainty: d.certainty ?? null,
    };
    const cp = patchEnvJsonFromForm(raw, "controlProfileJson");
    if (cp !== undefined) data.controlProfile = cp;
    const ap = patchEnvJsonFromForm(raw, "accessProfileJson");
    if (ap !== undefined) data.accessProfile = ap;
    const tp = patchEnvJsonFromForm(raw, "transportProfileJson");
    if (tp !== undefined) data.transportProfile = tp;
    const ep = patchEnvJsonFromForm(raw, "economicProfileJson");
    if (ep !== undefined) data.economicProfile = ep;
    const pp = patchEnvJsonFromForm(raw, "pressureProfileJson");
    if (pp !== undefined) data.pressureProfile = pp;
    const ml = patchEnvJsonFromForm(raw, "memoryLoadJson");
    if (ml !== undefined) data.memoryLoad = ml;

    await prisma.placeState.update({
      where: { id: d.id },
      data,
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
    const data: Prisma.NodeConnectionUpdateInput = {
      fromNode: { connect: { id: d.fromNodeId } },
      toNode: { connect: { id: d.toNodeId } },
      connectionType: d.connectionType,
      bidirectional: d.bidirectional,
      travelRisk: d.travelRisk ?? undefined,
      travelDifficulty: d.travelDifficulty ?? undefined,
      worldState: d.worldStateId ? { connect: { id: d.worldStateId } } : { disconnect: true },
      notes: d.notes ?? null,
      recordType: d.recordType,
      visibility: d.visibility,
      certainty: d.certainty ?? null,
    };
    const sm = patchEnvJsonFromForm(raw, "seasonalModifierJson");
    if (sm !== undefined) data.seasonalModifier = sm;

    await prisma.nodeConnection.update({
      where: { id: d.id },
      data,
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
    const existing = await prisma.placeMemoryProfile.findUnique({ where: { id: d.id } });
    if (!existing || existing.placeId !== placeId) redirect("/admin/places?error=validation");

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

export async function deletePlaceState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deletePlaceStateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  const row = await prisma.placeState.findUnique({ where: { id: d.id } });
  if (!row || row.placeId !== d.placeId) redirect("/admin/places?error=validation");
  try {
    await prisma.placeState.delete({ where: { id: d.id } });
  } catch {
    redirect(`/admin/places/${d.placeId}/environment?error=db`);
  }

  envRevalidatePlace(d.placeId);
  redirect(`/admin/places/${d.placeId}/environment?deleted=state`);
}

export async function deletePlaceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deletePlaceMemoryProfileSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/places?error=validation");

  const d = parsed.data;
  const row = await prisma.placeMemoryProfile.findUnique({ where: { id: d.id } });
  if (!row || row.placeId !== d.placeId) redirect("/admin/places?error=validation");
  try {
    await prisma.placeMemoryProfile.delete({ where: { id: d.id } });
  } catch {
    redirect(`/admin/places/${d.placeId}/environment?error=db`);
  }

  envRevalidatePlace(d.placeId);
  redirect(`/admin/places/${d.placeId}/environment?deleted=memory`);
}

export async function deleteEnvironmentNode(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteEnvironmentNodeSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/nodes?error=validation");

  const d = parsed.data;
  const node = await prisma.environmentNode.findUnique({ where: { id: d.id } });
  if (!node) redirect("/admin/nodes?error=validation");
  try {
    await prisma.environmentNode.delete({ where: { id: d.id } });
  } catch {
    redirect(`/admin/nodes/${d.id}?error=db`);
  }

  revalidatePath("/admin/nodes");
  revalidatePath("/admin/connections");
  envRevalidatePlace(node.placeId);
  redirect("/admin/nodes?deleted=1");
}

export async function deleteNodeConnection(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteNodeConnectionSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/connections?error=validation");

  const d = parsed.data;
  try {
    await prisma.nodeConnection.delete({ where: { id: d.id } });
  } catch {
    redirect(`/admin/connections/${d.id}?error=db`);
  }

  revalidatePath("/admin/connections");
  redirect("/admin/connections?deleted=1");
}

export async function deleteRiskRegime(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteRiskRegimeSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/risks?error=validation");

  const d = parsed.data;
  try {
    await prisma.riskRegime.delete({ where: { id: d.id } });
  } catch {
    redirect(`/admin/risks/${d.id}?error=db`);
  }

  revalidatePath("/admin/risks");
  redirect("/admin/risks?deleted=1");
}
