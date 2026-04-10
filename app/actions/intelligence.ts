"use server";

import type { Prisma } from "@prisma/client";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { patchEnvJsonFromForm } from "@/lib/environment-schemas";
import {
  characterBiologicalStateUpsertSchema,
  characterDevelopmentProfileUpsertSchema,
  characterIntelligenceProfileUpsertSchema,
  parseIntelligenceJson,
  worldExpressionProfileUpsertSchema,
  worldKnowledgeProfileUpsertSchema,
} from "@/lib/intelligence-schemas";
import { deleteByIdSchema } from "@/lib/pressure-order-schemas";
import { prisma } from "@/lib/prisma";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

function revalidateWorldKnowledge(worldStateId: string) {
  revalidatePath(`/admin/world-states/${worldStateId}/knowledge`);
}

function revalidateCharacterIntelligence(personId: string) {
  revalidatePath(`/admin/characters/${personId}/intelligence`);
}

export async function upsertWorldKnowledgeProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldKnowledgeProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/world-states/${raw.worldStateId}/knowledge?error=validation`);

  const d = parsed.data;
  const dataCommon = {
    label: d.label ?? null,
    abstractionCeiling: d.abstractionCeiling ?? 50,
    literacyRegime: d.literacyRegime ?? null,
    informationFlowSpeed: d.informationFlowSpeed ?? 50,
    geographicAwarenessNorm: d.geographicAwarenessNorm ?? null,
    notes: d.notes ?? null,
    recordType: d.recordType ?? RecordType.HYBRID,
    visibility: d.visibility ?? VisibilityStatus.REVIEW,
    certainty: d.certainty ?? null,
  };

  const dom = patchEnvJsonFromForm(raw, "dominantExplanatorySystemsJson");
  const tech = patchEnvJsonFromForm(raw, "technologyHorizonJson");
  const taboo = patchEnvJsonFromForm(raw, "tabooKnowledgeDomainsJson");

  const create: Prisma.WorldKnowledgeProfileUncheckedCreateInput = {
    worldStateId: d.worldStateId,
    ...dataCommon,
    dominantExplanatorySystems: parseIntelligenceJson(raw.dominantExplanatorySystemsJson),
    technologyHorizon: parseIntelligenceJson(raw.technologyHorizonJson),
    tabooKnowledgeDomains: parseIntelligenceJson(raw.tabooKnowledgeDomainsJson),
  };

  const update: Prisma.WorldKnowledgeProfileUpdateInput = {
    ...dataCommon,
  };
  if (dom !== undefined) update.dominantExplanatorySystems = dom;
  if (tech !== undefined) update.technologyHorizon = tech;
  if (taboo !== undefined) update.tabooKnowledgeDomains = taboo;

  try {
    await prisma.worldKnowledgeProfile.upsert({
      where: { worldStateId: d.worldStateId },
      create,
      update,
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/knowledge?error=db`);
  }

  revalidateWorldKnowledge(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/knowledge?saved=knowledge`);
}

export async function upsertWorldExpressionProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldExpressionProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/world-states/${raw.worldStateId}/knowledge?error=validation`);

  const d = parsed.data;
  const dataCommon = {
    label: d.label ?? null,
    publicExpressionCeiling: d.publicExpressionCeiling ?? 50,
    internalLanguageComplexityNorm: d.internalLanguageComplexityNorm ?? 50,
    silencePatternsNorm: d.silencePatternsNorm ?? null,
    notes: d.notes ?? null,
    recordType: d.recordType ?? RecordType.HYBRID,
    visibility: d.visibility ?? VisibilityStatus.REVIEW,
    certainty: d.certainty ?? null,
  };

  const meta = patchEnvJsonFromForm(raw, "metaphorSourceDomainsJson");
  const acc = patchEnvJsonFromForm(raw, "acceptableExplanationModesJson");
  const tab = patchEnvJsonFromForm(raw, "tabooPhrasingDomainsJson");

  const create: Prisma.WorldExpressionProfileUncheckedCreateInput = {
    worldStateId: d.worldStateId,
    ...dataCommon,
    metaphorSourceDomains: parseIntelligenceJson(raw.metaphorSourceDomainsJson),
    acceptableExplanationModes: parseIntelligenceJson(raw.acceptableExplanationModesJson),
    tabooPhrasingDomains: parseIntelligenceJson(raw.tabooPhrasingDomainsJson),
  };

  const update: Prisma.WorldExpressionProfileUpdateInput = {
    ...dataCommon,
  };
  if (meta !== undefined) update.metaphorSourceDomains = meta;
  if (acc !== undefined) update.acceptableExplanationModes = acc;
  if (tab !== undefined) update.tabooPhrasingDomains = tab;

  try {
    await prisma.worldExpressionProfile.upsert({
      where: { worldStateId: d.worldStateId },
      create,
      update,
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/knowledge?error=db`);
  }

  revalidateWorldKnowledge(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/knowledge?saved=expression`);
}

export async function upsertCharacterIntelligenceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterIntelligenceProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/characters/${raw.personId}/intelligence?error=validation`);

  const d = parsed.data;
  const full: Prisma.CharacterIntelligenceProfileUncheckedCreateInput = {
    personId: d.personId,
    worldStateId: d.worldStateId,
    patternRecognition: d.patternRecognition ?? 50,
    workingMemory: d.workingMemory ?? 50,
    abstractionCapacity: d.abstractionCapacity ?? 50,
    socialInference: d.socialInference ?? 50,
    environmentalInference: d.environmentalInference ?? 50,
    selfReflectionDepth: d.selfReflectionDepth ?? 50,
    impulseControl: d.impulseControl ?? 50,
    planningHorizon: d.planningHorizon ?? 50,
    metacognition: d.metacognition ?? 50,
    memoryStrength: d.memoryStrength ?? 50,
    expressionComplexity: d.expressionComplexity ?? 50,
    notes: d.notes ?? null,
    recordType: d.recordType ?? RecordType.HYBRID,
    visibility: d.visibility ?? VisibilityStatus.REVIEW,
    certainty: d.certainty ?? null,
  };
  const { personId, worldStateId, ...updateFields } = full;

  try {
    await prisma.characterIntelligenceProfile.upsert({
      where: { personId_worldStateId: { personId, worldStateId } },
      create: full,
      update: updateFields,
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/intelligence?error=db`);
  }

  revalidateCharacterIntelligence(d.personId);
  redirect(`/admin/characters/${d.personId}/intelligence?saved=intelligence`);
}

export async function upsertCharacterDevelopmentProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterDevelopmentProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/characters/${raw.personId}/intelligence?error=validation`);

  const d = parsed.data;

  const full: Prisma.CharacterDevelopmentProfileUncheckedCreateInput = {
    personId: d.personId,
    worldStateId: d.worldStateId,
    ageBand: d.ageBand ?? null,
    maturityRate: d.maturityRate ?? 50,
    socialRoleByAge: d.socialRoleByAge ?? null,
    regulationLevel: d.regulationLevel ?? 50,
    responsibilityLoad: d.responsibilityLoad ?? 50,
    roleCompression: d.roleCompression ?? 50,
    protectednessExposure: d.protectednessExposure ?? 50,
    developmentalCompression: parseIntelligenceJson(raw.developmentalCompressionJson),
    notes: d.notes ?? null,
    recordType: d.recordType ?? RecordType.HYBRID,
    visibility: d.visibility ?? VisibilityStatus.REVIEW,
    certainty: d.certainty ?? null,
  };
  const { personId, worldStateId, ...updateFields } = full;

  try {
    await prisma.characterDevelopmentProfile.upsert({
      where: { personId_worldStateId: { personId, worldStateId } },
      create: full,
      update: updateFields,
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/intelligence?error=db`);
  }

  revalidateCharacterIntelligence(d.personId);
  redirect(`/admin/characters/${d.personId}/intelligence?saved=development`);
}

export async function upsertCharacterBiologicalState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterBiologicalStateUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect(`/admin/characters/${raw.personId}/intelligence?error=validation`);

  const d = parsed.data;
  const full: Prisma.CharacterBiologicalStateUncheckedCreateInput = {
    personId: d.personId,
    worldStateId: d.worldStateId,
    nutritionLoad: d.nutritionLoad ?? 50,
    fatigueLoad: d.fatigueLoad ?? 50,
    illnessLoad: d.illnessLoad ?? 50,
    chronicStress: d.chronicStress ?? 50,
    bodyPain: d.bodyPain ?? 50,
    reproductiveLoad: d.reproductiveLoad ?? null,
    laborExhaustion: d.laborExhaustion ?? 50,
    environmentalExposure: d.environmentalExposure ?? 50,
    traumaLoad: d.traumaLoad ?? 50,
    notes: d.notes ?? null,
    recordType: d.recordType ?? RecordType.HYBRID,
    visibility: d.visibility ?? VisibilityStatus.REVIEW,
    certainty: d.certainty ?? null,
  };
  const { personId, worldStateId, ...updateFields } = full;

  try {
    await prisma.characterBiologicalState.upsert({
      where: { personId_worldStateId: { personId, worldStateId } },
      create: full,
      update: updateFields,
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/intelligence?error=db`);
  }

  revalidateCharacterIntelligence(d.personId);
  redirect(`/admin/characters/${d.personId}/intelligence?saved=biological`);
}

export async function deleteCharacterIntelligenceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterIntelligenceProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.characterIntelligenceProfile.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/intelligence?error=db`);
  }
  revalidateCharacterIntelligence(row.personId);
  redirect(`/admin/characters/${row.personId}/intelligence?deleted=intelligence`);
}

export async function deleteCharacterDevelopmentProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterDevelopmentProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.characterDevelopmentProfile.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/intelligence?error=db`);
  }
  revalidateCharacterIntelligence(row.personId);
  redirect(`/admin/characters/${row.personId}/intelligence?deleted=development`);
}

export async function deleteCharacterBiologicalState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterBiologicalState.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.characterBiologicalState.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/intelligence?error=db`);
  }
  revalidateCharacterIntelligence(row.personId);
  redirect(`/admin/characters/${row.personId}/intelligence?deleted=biological`);
}
