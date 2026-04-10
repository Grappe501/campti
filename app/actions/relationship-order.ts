"use server";

import type { Prisma } from "@prisma/client";
import { AttachmentStyle, RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { patchEnvJsonFromForm } from "@/lib/environment-schemas";
import {
  characterDesireProfileUpdateSchema,
  characterDesireProfileUpsertSchema,
  characterMaskingProfileUpdateSchema,
  characterMaskingProfileUpsertSchema,
  parseRelationshipJson,
  relationshipDisclosureProfileUpdateSchema,
  relationshipDisclosureProfileUpsertSchema,
  relationshipDynamicStateCreateSchema,
  relationshipDynamicStateUpdateSchema,
  relationshipNetworkSummaryUpdateSchema,
  relationshipNetworkSummaryUpsertSchema,
  relationshipProfileCreateSchema,
  relationshipProfileUpdateSchema,
  worldRelationshipNormProfileUpdateSchema,
  worldRelationshipNormProfileUpsertSchema,
  deleteByIdSchema,
} from "@/lib/relationship-order-schemas";
import { normalizePersonPair } from "@/lib/relationship-order";
import { prisma } from "@/lib/prisma";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

function revWorld(ws: string) {
  revalidatePath(`/admin/world-states/${ws}/relationships`);
}

function revPerson(p: string) {
  revalidatePath(`/admin/characters/${p}/relationships`);
}

function revRelList() {
  revalidatePath("/admin/relationships");
}

export async function createRelationshipProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipProfileCreateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships/new?error=validation");

  const d = parsed.data;
  let pair: { personAId: string; personBId: string };
  try {
    pair = normalizePersonPair(d.personIdOne, d.personIdTwo);
  } catch {
    redirect("/admin/relationships/new?error=validation");
  }

  try {
    await prisma.relationshipProfile.create({
      data: {
        personAId: pair.personAId,
        personBId: pair.personBId,
        worldStateId: d.worldStateId,
        relationshipType: d.relationshipType,
        publicStatus: d.publicStatus,
        privateStatus: d.privateStatus ?? null,
        hiddenTruth: parseRelationshipJson(d.hiddenTruthJson),
        powerDirection: parseRelationshipJson(d.powerDirectionJson),
        dependencyDirection: parseRelationshipJson(d.dependencyDirectionJson),
        trustLevel: d.trustLevel ?? 50,
        fearLevel: d.fearLevel ?? 50,
        shameLeverage: d.shameLeverage ?? 50,
        obligationWeight: d.obligationWeight ?? 50,
        betrayalThreshold: d.betrayalThreshold ?? 50,
        rescueThreshold: d.rescueThreshold ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect("/admin/relationships/new?error=db");
  }

  revWorld(d.worldStateId);
  revRelList();
  redirect("/admin/relationships?saved=1");
}

export async function updateRelationshipProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const d = parsed.data;
  const existing = await prisma.relationshipProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/relationships?error=validation");

  const data: Prisma.RelationshipProfileUpdateInput = {
    relationshipType: d.relationshipType ?? undefined,
    publicStatus: d.publicStatus ?? undefined,
    privateStatus: d.privateStatus ?? null,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
    trustLevel: d.trustLevel ?? undefined,
    fearLevel: d.fearLevel ?? undefined,
    shameLeverage: d.shameLeverage ?? undefined,
    obligationWeight: d.obligationWeight ?? undefined,
    betrayalThreshold: d.betrayalThreshold ?? undefined,
    rescueThreshold: d.rescueThreshold ?? undefined,
  };
  const ht = patchEnvJsonFromForm(raw, "hiddenTruthJson");
  const pd = patchEnvJsonFromForm(raw, "powerDirectionJson");
  const dd = patchEnvJsonFromForm(raw, "dependencyDirectionJson");
  if (ht !== undefined) data.hiddenTruth = ht;
  if (pd !== undefined) data.powerDirection = pd;
  if (dd !== undefined) data.dependencyDirection = dd;

  try {
    await prisma.relationshipProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/relationships/${d.id}?error=db`);
  }

  revWorld(existing.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${d.id}?saved=1`);
}

export async function createRelationshipDynamicState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipDynamicStateCreateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const d = parsed.data;
  const parent = await prisma.relationshipProfile.findUnique({ where: { id: d.relationshipProfileId } });
  if (!parent) redirect("/admin/relationships?error=validation");

  try {
    await prisma.relationshipDynamicState.create({
      data: {
        relationshipProfileId: d.relationshipProfileId,
        label: d.label,
        emotionalTemperature: d.emotionalTemperature ?? 50,
        volatility: d.volatility ?? 50,
        intimacyLevel: d.intimacyLevel ?? 50,
        conflictLoad: d.conflictLoad ?? 50,
        mutualRecognition: d.mutualRecognition ?? 50,
        disclosureSafety: d.disclosureSafety ?? 50,
        currentTensions: parseRelationshipJson(d.currentTensionsJson),
        currentNeeds: parseRelationshipJson(d.currentNeedsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/relationships/${d.relationshipProfileId}?error=db`);
  }

  revWorld(parent.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${d.relationshipProfileId}?saved=dynamic`);
}

export async function updateRelationshipDynamicState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipDynamicStateUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const d = parsed.data;
  const row = await prisma.relationshipDynamicState.findUnique({
    where: { id: d.id },
    include: { relationshipProfile: true },
  });
  if (!row) redirect("/admin/relationships?error=validation");

  const data: Prisma.RelationshipDynamicStateUpdateInput = {
    label: d.label,
    emotionalTemperature: d.emotionalTemperature ?? undefined,
    volatility: d.volatility ?? undefined,
    intimacyLevel: d.intimacyLevel ?? undefined,
    conflictLoad: d.conflictLoad ?? undefined,
    mutualRecognition: d.mutualRecognition ?? undefined,
    disclosureSafety: d.disclosureSafety ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  const ct = patchEnvJsonFromForm(raw, "currentTensionsJson");
  const cn = patchEnvJsonFromForm(raw, "currentNeedsJson");
  if (ct !== undefined) data.currentTensions = ct;
  if (cn !== undefined) data.currentNeeds = cn;

  try {
    await prisma.relationshipDynamicState.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/relationships/${row.relationshipProfileId}?error=db`);
  }

  revWorld(row.relationshipProfile.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${row.relationshipProfileId}?saved=dynamic`);
}

export async function createCharacterMaskingProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterMaskingProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterMaskingProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        maskingIntensity: d.maskingIntensity ?? 50,
        codeSwitchingLoad: d.codeSwitchingLoad ?? 50,
        secrecyNeed: d.secrecyNeed ?? 50,
        disclosureRisk: d.disclosureRisk ?? 50,
        authenticPrivateSelf: parseRelationshipJson(d.authenticPrivateSelfJson),
        publicMask: parseRelationshipJson(d.publicMaskJson),
        trustedCircleExpression: parseRelationshipJson(d.trustedCircleExpressionJson),
        forbiddenExpression: parseRelationshipJson(d.forbiddenExpressionJson),
        adaptiveStrategies: parseRelationshipJson(d.adaptiveStrategiesJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/relationships?error=db`);
  }

  revWorld(d.worldStateId);
  revPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/relationships?saved=masking`);
}

export async function updateCharacterMaskingProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterMaskingProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterMaskingProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterMaskingProfileUpdateInput = {
    maskingIntensity: d.maskingIntensity ?? undefined,
    codeSwitchingLoad: d.codeSwitchingLoad ?? undefined,
    secrecyNeed: d.secrecyNeed ?? undefined,
    disclosureRisk: d.disclosureRisk ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["authenticPrivateSelf", "authenticPrivateSelfJson"],
    ["publicMask", "publicMaskJson"],
    ["trustedCircleExpression", "trustedCircleExpressionJson"],
    ["forbiddenExpression", "forbiddenExpressionJson"],
    ["adaptiveStrategies", "adaptiveStrategiesJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterMaskingProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/relationships?error=db`);
  }

  revWorld(existing.worldStateId);
  revPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/relationships?saved=masking`);
}

export async function createCharacterDesireProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterDesireProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterDesireProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        attractionPattern: parseRelationshipJson(d.attractionPatternJson),
        attachmentStyle: d.attachmentStyle ?? AttachmentStyle.DUTY_BOUND,
        desireVisibility: d.desireVisibility ?? 50,
        desireSuppression: d.desireSuppression ?? 50,
        jealousySensitivity: d.jealousySensitivity ?? 50,
        loyaltyPriority: parseRelationshipJson(d.loyaltyPriorityJson),
        intimacyNeed: d.intimacyNeed ?? 50,
        autonomyNeed: d.autonomyNeed ?? 50,
        tabooExposureRisk: d.tabooExposureRisk ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/relationships?error=db`);
  }

  revWorld(d.worldStateId);
  revPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/relationships?saved=desire`);
}

export async function updateCharacterDesireProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterDesireProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterDesireProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterDesireProfileUpdateInput = {
    attachmentStyle: d.attachmentStyle ?? undefined,
    desireVisibility: d.desireVisibility ?? undefined,
    desireSuppression: d.desireSuppression ?? undefined,
    jealousySensitivity: d.jealousySensitivity ?? undefined,
    intimacyNeed: d.intimacyNeed ?? undefined,
    autonomyNeed: d.autonomyNeed ?? undefined,
    tabooExposureRisk: d.tabooExposureRisk ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  const ap = patchEnvJsonFromForm(raw, "attractionPatternJson");
  const lp = patchEnvJsonFromForm(raw, "loyaltyPriorityJson");
  if (ap !== undefined) data.attractionPattern = ap;
  if (lp !== undefined) data.loyaltyPriority = lp;

  try {
    await prisma.characterDesireProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/relationships?error=db`);
  }

  revWorld(existing.worldStateId);
  revPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/relationships?saved=desire`);
}

export async function createWorldRelationshipNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldRelationshipNormProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/world-states?error=validation");

  const d = parsed.data;
  try {
    await prisma.worldRelationshipNormProfile.create({
      data: {
        worldStateId: d.worldStateId,
        label: d.label,
        marriageRules: parseRelationshipJson(d.marriageRulesJson),
        sexualNorms: parseRelationshipJson(d.sexualNormsJson),
        desireExpressionRules: parseRelationshipJson(d.desireExpressionRulesJson),
        tabooSystem: parseRelationshipJson(d.tabooSystemJson),
        emotionalExpressionRules: parseRelationshipJson(d.emotionalExpressionRulesJson),
        genderDynamics: parseRelationshipJson(d.genderDynamicsJson),
        relationalVisibility: d.relationalVisibility ?? 50,
        punishmentForViolation: d.punishmentForViolation ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/relationships?error=db`);
  }

  revWorld(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/relationships?saved=norms`);
}

export async function updateWorldRelationshipNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldRelationshipNormProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/world-states?error=validation");

  const d = parsed.data;
  const existing = await prisma.worldRelationshipNormProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/world-states?error=validation");

  const data: Prisma.WorldRelationshipNormProfileUpdateInput = {
    label: d.label,
    relationalVisibility: d.relationalVisibility ?? undefined,
    punishmentForViolation: d.punishmentForViolation ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["marriageRules", "marriageRulesJson"],
    ["sexualNorms", "sexualNormsJson"],
    ["desireExpressionRules", "desireExpressionRulesJson"],
    ["tabooSystem", "tabooSystemJson"],
    ["emotionalExpressionRules", "emotionalExpressionRulesJson"],
    ["genderDynamics", "genderDynamicsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.worldRelationshipNormProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/world-states/${existing.worldStateId}/relationships?error=db`);
  }

  revWorld(existing.worldStateId);
  redirect(`/admin/world-states/${existing.worldStateId}/relationships?saved=norms`);
}

export async function createRelationshipDisclosureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipDisclosureProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const d = parsed.data;
  const parent = await prisma.relationshipProfile.findUnique({ where: { id: d.relationshipProfileId } });
  if (!parent) redirect("/admin/relationships?error=validation");
  if (d.worldStateId !== parent.worldStateId) redirect("/admin/relationships?error=validation");

  try {
    await prisma.relationshipDisclosureProfile.create({
      data: {
        relationshipProfileId: d.relationshipProfileId,
        worldStateId: d.worldStateId,
        truthShareCapacity: d.truthShareCapacity ?? 50,
        emotionalDisclosureCapacity: d.emotionalDisclosureCapacity ?? 50,
        secrecyBurden: d.secrecyBurden ?? 50,
        misrecognitionRisk: d.misrecognitionRisk ?? 50,
        exposureConsequence: d.exposureConsequence ?? 50,
        safeTopics: parseRelationshipJson(d.safeTopicsJson),
        unsafeTopics: parseRelationshipJson(d.unsafeTopicsJson),
        codedChannels: parseRelationshipJson(d.codedChannelsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/relationships/${d.relationshipProfileId}?error=db`);
  }

  revWorld(parent.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${d.relationshipProfileId}?saved=disclosure`);
}

export async function updateRelationshipDisclosureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipDisclosureProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const d = parsed.data;
  const existing = await prisma.relationshipDisclosureProfile.findUnique({
    where: { id: d.id },
    include: { relationshipProfile: true },
  });
  if (!existing) redirect("/admin/relationships?error=validation");

  const data: Prisma.RelationshipDisclosureProfileUpdateInput = {
    truthShareCapacity: d.truthShareCapacity ?? undefined,
    emotionalDisclosureCapacity: d.emotionalDisclosureCapacity ?? undefined,
    secrecyBurden: d.secrecyBurden ?? undefined,
    misrecognitionRisk: d.misrecognitionRisk ?? undefined,
    exposureConsequence: d.exposureConsequence ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["safeTopics", "safeTopicsJson"],
    ["unsafeTopics", "unsafeTopicsJson"],
    ["codedChannels", "codedChannelsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.relationshipDisclosureProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/relationships/${existing.relationshipProfileId}?error=db`);
  }

  revWorld(existing.relationshipProfile.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${existing.relationshipProfileId}?saved=disclosure`);
}

export async function createRelationshipNetworkSummary(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipNetworkSummaryUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.relationshipNetworkSummary.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        keyBonds: parseRelationshipJson(d.keyBondsJson),
        primaryTensions: parseRelationshipJson(d.primaryTensionsJson),
        dependencyMap: parseRelationshipJson(d.dependencyMapJson),
        trustMap: parseRelationshipJson(d.trustMapJson),
        hiddenConflicts: parseRelationshipJson(d.hiddenConflictsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/relationships?error=db`);
  }

  revWorld(d.worldStateId);
  revPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/relationships?saved=network`);
}

export async function updateRelationshipNetworkSummary(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = relationshipNetworkSummaryUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.relationshipNetworkSummary.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.RelationshipNetworkSummaryUpdateInput = {
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["keyBonds", "keyBondsJson"],
    ["primaryTensions", "primaryTensionsJson"],
    ["dependencyMap", "dependencyMapJson"],
    ["trustMap", "trustMapJson"],
    ["hiddenConflicts", "hiddenConflictsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.relationshipNetworkSummary.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/relationships?error=db`);
  }

  revWorld(existing.worldStateId);
  revPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/relationships?saved=network`);
}

export async function deleteRelationshipProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const row = await prisma.relationshipProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/relationships?error=validation");
  try {
    await prisma.relationshipProfile.delete({ where: { id: row.id } });
  } catch {
    redirect("/admin/relationships?error=db");
  }
  revWorld(row.worldStateId);
  revRelList();
  redirect("/admin/relationships?deleted=1");
}

export async function deleteRelationshipDynamicState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const row = await prisma.relationshipDynamicState.findUnique({
    where: { id: parsed.data.id },
    include: { relationshipProfile: true },
  });
  if (!row) redirect("/admin/relationships?error=validation");
  try {
    await prisma.relationshipDynamicState.delete({ where: { id: row.id } });
  } catch {
    redirect("/admin/relationships?error=db");
  }
  revWorld(row.relationshipProfile.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${row.relationshipProfileId}?deleted=dynamic`);
}

export async function deleteCharacterMaskingProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterMaskingProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.characterMaskingProfile.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/relationships?error=db`);
  }
  revWorld(row.worldStateId);
  revPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/relationships?deleted=masking`);
}

export async function deleteCharacterDesireProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterDesireProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.characterDesireProfile.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/relationships?error=db`);
  }
  revWorld(row.worldStateId);
  revPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/relationships?deleted=desire`);
}

export async function deleteWorldRelationshipNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/world-states?error=validation");

  const row = await prisma.worldRelationshipNormProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/world-states?error=validation");
  try {
    await prisma.worldRelationshipNormProfile.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/world-states/${row.worldStateId}/relationships?error=db`);
  }
  revWorld(row.worldStateId);
  redirect(`/admin/world-states/${row.worldStateId}/relationships?deleted=norms`);
}

export async function deleteRelationshipDisclosureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/relationships?error=validation");

  const row = await prisma.relationshipDisclosureProfile.findUnique({
    where: { id: parsed.data.id },
    include: { relationshipProfile: true },
  });
  if (!row) redirect("/admin/relationships?error=validation");
  try {
    await prisma.relationshipDisclosureProfile.delete({ where: { id: row.id } });
  } catch {
    redirect("/admin/relationships?error=db");
  }
  revWorld(row.relationshipProfile.worldStateId);
  revRelList();
  redirect(`/admin/relationships/${row.relationshipProfileId}?deleted=disclosure`);
}

export async function deleteRelationshipNetworkSummary(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.relationshipNetworkSummary.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");
  try {
    await prisma.relationshipNetworkSummary.delete({ where: { id: row.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/relationships?error=db`);
  }
  revWorld(row.worldStateId);
  revPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/relationships?deleted=network`);
}
