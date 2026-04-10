"use server";

import type { Prisma } from "@prisma/client";
import { RecordType, TrainingMode, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { patchEnvJsonFromForm } from "@/lib/environment-schemas";
import {
  characterConsequenceMemoryProfileUpdateSchema,
  characterConsequenceMemoryProfileUpsertSchema,
  characterEducationProfileUpdateSchema,
  characterEducationProfileUpsertSchema,
  characterEmotionalHealthProfileUpdateSchema,
  characterEmotionalHealthProfileUpsertSchema,
  characterHealthEnvelopeUpdateSchema,
  characterHealthEnvelopeUpsertSchema,
  characterLearningEnvelopeUpdateSchema,
  characterLearningEnvelopeUpsertSchema,
  characterMentalHealthProfileUpdateSchema,
  characterMentalHealthProfileUpsertSchema,
  characterPhysicalHealthProfileUpdateSchema,
  characterPhysicalHealthProfileUpsertSchema,
  characterRumorReputationProfileUpdateSchema,
  characterRumorReputationProfileUpsertSchema,
  characterTraumaProfileUpdateSchema,
  characterTraumaProfileUpsertSchema,
  deleteByIdSchema,
  parseContinuityJson,
  worldEducationNormProfileUpdateSchema,
  worldEducationNormProfileUpsertSchema,
  worldHealthNormProfileUpdateSchema,
  worldHealthNormProfileUpsertSchema,
} from "@/lib/continuity-order-schemas";
import { prisma } from "@/lib/prisma";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

function revCharacterContinuity(personId: string, worldStateId: string) {
  revalidatePath(`/admin/characters/${personId}/continuity`);
  revalidatePath(`/admin/world-states/${worldStateId}/education`);
  revalidatePath(`/admin/world-states/${worldStateId}/health`);
  revalidatePath("/admin/continuity/education");
}

function revWorldEducation(worldStateId: string) {
  revalidatePath(`/admin/world-states/${worldStateId}/education`);
  revalidatePath("/admin/continuity/education");
}

function revWorldHealth(worldStateId: string) {
  revalidatePath(`/admin/world-states/${worldStateId}/health`);
}

export async function createCharacterTraumaProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterTraumaProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterTraumaProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        traumaLoad: d.traumaLoad ?? 50,
        silenceLoad: d.silenceLoad ?? 50,
        hypervigilanceLoad: d.hypervigilanceLoad ?? 50,
        shameResidue: d.shameResidue ?? 50,
        griefResidue: d.griefResidue ?? 50,
        bodyMemory: parseContinuityJson(d.bodyMemoryJson),
        triggerPatterns: parseContinuityJson(d.triggerPatternsJson),
        copingPatterns: parseContinuityJson(d.copingPatternsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=trauma`);
}

export async function updateCharacterTraumaProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterTraumaProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterTraumaProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterTraumaProfileUpdateInput = {
    traumaLoad: d.traumaLoad ?? undefined,
    silenceLoad: d.silenceLoad ?? undefined,
    hypervigilanceLoad: d.hypervigilanceLoad ?? undefined,
    shameResidue: d.shameResidue ?? undefined,
    griefResidue: d.griefResidue ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["bodyMemory", "bodyMemoryJson"],
    ["triggerPatterns", "triggerPatternsJson"],
    ["copingPatterns", "copingPatternsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterTraumaProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=trauma`,
  );
}

export async function createCharacterConsequenceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterConsequenceMemoryProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterConsequenceMemoryProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        punishmentMemory: d.punishmentMemory ?? 50,
        protectionMemory: d.protectionMemory ?? 50,
        betrayalMemory: d.betrayalMemory ?? 50,
        rewardConditioning: d.rewardConditioning ?? 50,
        exposureLearning: d.exposureLearning ?? 50,
        learnedRules: parseContinuityJson(d.learnedRulesJson),
        avoidancePatterns: parseContinuityJson(d.avoidancePatternsJson),
        reinforcementPatterns: parseContinuityJson(d.reinforcementPatternsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=consequence`);
}

export async function updateCharacterConsequenceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterConsequenceMemoryProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterConsequenceMemoryProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterConsequenceMemoryProfileUpdateInput = {
    punishmentMemory: d.punishmentMemory ?? undefined,
    protectionMemory: d.protectionMemory ?? undefined,
    betrayalMemory: d.betrayalMemory ?? undefined,
    rewardConditioning: d.rewardConditioning ?? undefined,
    exposureLearning: d.exposureLearning ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["learnedRules", "learnedRulesJson"],
    ["avoidancePatterns", "avoidancePatternsJson"],
    ["reinforcementPatterns", "reinforcementPatternsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterConsequenceMemoryProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=consequence`,
  );
}

export async function createCharacterRumorReputationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterRumorReputationProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterRumorReputationProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        publicTrust: d.publicTrust ?? 50,
        suspicionLoad: d.suspicionLoad ?? 50,
        scandalRisk: d.scandalRisk ?? 50,
        narrativeControl: d.narrativeControl ?? 50,
        rumorExposure: d.rumorExposure ?? 50,
        reputationThemes: parseContinuityJson(d.reputationThemesJson),
        vulnerableNarratives: parseContinuityJson(d.vulnerableNarrativesJson),
        protectiveNarratives: parseContinuityJson(d.protectiveNarrativesJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=rumor`);
}

export async function updateCharacterRumorReputationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterRumorReputationProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterRumorReputationProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterRumorReputationProfileUpdateInput = {
    publicTrust: d.publicTrust ?? undefined,
    suspicionLoad: d.suspicionLoad ?? undefined,
    scandalRisk: d.scandalRisk ?? undefined,
    narrativeControl: d.narrativeControl ?? undefined,
    rumorExposure: d.rumorExposure ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["reputationThemes", "reputationThemesJson"],
    ["vulnerableNarratives", "vulnerableNarrativesJson"],
    ["protectiveNarratives", "protectiveNarrativesJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterRumorReputationProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=rumor`,
  );
}

export async function createWorldEducationNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldEducationNormProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/continuity/education/new?error=validation");

  const d = parsed.data;
  try {
    await prisma.worldEducationNormProfile.create({
      data: {
        worldStateId: d.worldStateId,
        label: d.label,
        childTrainingModel: parseContinuityJson(d.childTrainingModelJson),
        youthInitiationModel: parseContinuityJson(d.youthInitiationModelJson),
        elderTransmissionMode: parseContinuityJson(d.elderTransmissionModeJson),
        literacyAccessPattern: parseContinuityJson(d.literacyAccessPatternJson),
        specialistTrainingPaths: parseContinuityJson(d.specialistTrainingPathsJson),
        genderedTrainingDifferences: parseContinuityJson(d.genderedTrainingDifferencesJson),
        eliteKnowledgeAccess: d.eliteKnowledgeAccess ?? 50,
        commonKnowledgeAccess: d.commonKnowledgeAccess ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/education?error=db`);
  }

  revWorldEducation(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/education?saved=1`);
}

export async function updateWorldEducationNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldEducationNormProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/continuity/education?error=validation");

  const d = parsed.data;
  const existing = await prisma.worldEducationNormProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/continuity/education?error=validation");

  const data: Prisma.WorldEducationNormProfileUpdateInput = {
    label: d.label,
    eliteKnowledgeAccess: d.eliteKnowledgeAccess ?? undefined,
    commonKnowledgeAccess: d.commonKnowledgeAccess ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["childTrainingModel", "childTrainingModelJson"],
    ["youthInitiationModel", "youthInitiationModelJson"],
    ["elderTransmissionMode", "elderTransmissionModeJson"],
    ["literacyAccessPattern", "literacyAccessPatternJson"],
    ["specialistTrainingPaths", "specialistTrainingPathsJson"],
    ["genderedTrainingDifferences", "genderedTrainingDifferencesJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.worldEducationNormProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/continuity/education/${d.id}?error=db`);
  }

  revWorldEducation(existing.worldStateId);
  redirect(`/admin/continuity/education/${d.id}?saved=1`);
}

export async function createCharacterEducationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterEducationProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterEducationProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        primaryTrainingMode: d.primaryTrainingMode ?? TrainingMode.MIXED,
        literacyLevel: d.literacyLevel ?? 50,
        numeracyLevel: d.numeracyLevel ?? 50,
        oralTraditionDepth: d.oralTraditionDepth ?? 50,
        ecologicalKnowledgeDepth: d.ecologicalKnowledgeDepth ?? 50,
        institutionalSchoolingAccess: d.institutionalSchoolingAccess ?? 50,
        apprenticeshipDomains: parseContinuityJson(d.apprenticeshipDomainsJson),
        religiousInstructionDepth: d.religiousInstructionDepth ?? 50,
        strategicTrainingDepth: d.strategicTrainingDepth ?? 50,
        historicalAwarenessRange: d.historicalAwarenessRange ?? 50,
        languageExposure: parseContinuityJson(d.languageExposureJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=education`);
}

export async function updateCharacterEducationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterEducationProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterEducationProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterEducationProfileUpdateInput = {
    primaryTrainingMode: d.primaryTrainingMode ?? undefined,
    literacyLevel: d.literacyLevel ?? undefined,
    numeracyLevel: d.numeracyLevel ?? undefined,
    oralTraditionDepth: d.oralTraditionDepth ?? undefined,
    ecologicalKnowledgeDepth: d.ecologicalKnowledgeDepth ?? undefined,
    institutionalSchoolingAccess: d.institutionalSchoolingAccess ?? undefined,
    religiousInstructionDepth: d.religiousInstructionDepth ?? undefined,
    strategicTrainingDepth: d.strategicTrainingDepth ?? undefined,
    historicalAwarenessRange: d.historicalAwarenessRange ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["apprenticeshipDomains", "apprenticeshipDomainsJson"],
    ["languageExposure", "languageExposureJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterEducationProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=education`,
  );
}

export async function createCharacterLearningEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterLearningEnvelopeUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterLearningEnvelope.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        trainedCapacity: d.trainedCapacity ?? 50,
        expressiveCapacity: d.expressiveCapacity ?? 50,
        pressureDistortion: d.pressureDistortion ?? 50,
        learnedAvoidance: d.learnedAvoidance ?? 50,
        socialRiskAdjustedDisclosure: d.socialRiskAdjustedDisclosure ?? 50,
        summary: parseContinuityJson(d.summaryJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=envelope`);
}

export async function updateCharacterLearningEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterLearningEnvelopeUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterLearningEnvelope.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterLearningEnvelopeUpdateInput = {
    trainedCapacity: d.trainedCapacity ?? undefined,
    expressiveCapacity: d.expressiveCapacity ?? undefined,
    pressureDistortion: d.pressureDistortion ?? undefined,
    learnedAvoidance: d.learnedAvoidance ?? undefined,
    socialRiskAdjustedDisclosure: d.socialRiskAdjustedDisclosure ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  const s = patchEnvJsonFromForm(raw, "summaryJson");
  if (s !== undefined) data.summary = s;

  try {
    await prisma.characterLearningEnvelope.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=envelope`,
  );
}

export async function deleteCharacterTraumaProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterTraumaProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterTraumaProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=trauma`);
}

export async function deleteCharacterConsequenceMemoryProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterConsequenceMemoryProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterConsequenceMemoryProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=consequence`);
}

export async function deleteCharacterRumorReputationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterRumorReputationProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterRumorReputationProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=rumor`);
}

export async function deleteWorldEducationNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/continuity/education?error=validation");

  const row = await prisma.worldEducationNormProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/continuity/education?error=validation");

  try {
    await prisma.worldEducationNormProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/world-states/${row.worldStateId}/education?error=db`);
  }

  revWorldEducation(row.worldStateId);
  redirect(`/admin/world-states/${row.worldStateId}/education?deleted=1`);
}

export async function deleteCharacterEducationProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterEducationProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterEducationProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=education`);
}

export async function deleteCharacterLearningEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterLearningEnvelope.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterLearningEnvelope.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=envelope`);
}

export async function createWorldHealthNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldHealthNormProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.worldHealthNormProfile.create({
      data: {
        worldStateId: d.worldStateId,
        label: d.label,
        bodyInterpretationModel: parseContinuityJson(d.bodyInterpretationModelJson),
        mindInterpretationModel: parseContinuityJson(d.mindInterpretationModelJson),
        emotionInterpretationModel: parseContinuityJson(d.emotionInterpretationModelJson),
        healingSystems: parseContinuityJson(d.healingSystemsJson),
        stigmaPatterns: parseContinuityJson(d.stigmaPatternsJson),
        communityCareCapacity: d.communityCareCapacity ?? 50,
        institutionalCareCapacity: d.institutionalCareCapacity ?? 50,
        survivalBurden: d.survivalBurden ?? 50,
        restPossibility: d.restPossibility ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/health?error=db`);
  }

  revWorldHealth(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/health?saved=1`);
}

export async function updateWorldHealthNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldHealthNormProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.worldHealthNormProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.WorldHealthNormProfileUpdateInput = {
    label: d.label,
    communityCareCapacity: d.communityCareCapacity ?? undefined,
    institutionalCareCapacity: d.institutionalCareCapacity ?? undefined,
    survivalBurden: d.survivalBurden ?? undefined,
    restPossibility: d.restPossibility ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["bodyInterpretationModel", "bodyInterpretationModelJson"],
    ["mindInterpretationModel", "mindInterpretationModelJson"],
    ["emotionInterpretationModel", "emotionInterpretationModelJson"],
    ["healingSystems", "healingSystemsJson"],
    ["stigmaPatterns", "stigmaPatternsJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.worldHealthNormProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/world-states/${existing.worldStateId}/health?error=db`);
  }

  revWorldHealth(existing.worldStateId);
  redirect(`/admin/world-states/${existing.worldStateId}/health?saved=1`);
}

export async function deleteWorldHealthNormProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.worldHealthNormProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.worldHealthNormProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/world-states/${row.worldStateId}/health?error=db`);
  }

  revWorldHealth(row.worldStateId);
  redirect(`/admin/world-states/${row.worldStateId}/health?deleted=1`);
}

export async function createCharacterPhysicalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterPhysicalHealthProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterPhysicalHealthProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        injuryLoad: d.injuryLoad ?? 50,
        chronicPainLoad: d.chronicPainLoad ?? 50,
        illnessBurden: d.illnessBurden ?? 50,
        nutritionStatus: d.nutritionStatus ?? 50,
        sleepQuality: d.sleepQuality ?? 50,
        enduranceCapacity: d.enduranceCapacity ?? 50,
        mobilityLimitationLoad: d.mobilityLimitationLoad ?? 50,
        reproductiveBurden: d.reproductiveBurden ?? 50,
        agingBurden: d.agingBurden ?? 50,
        recoveryCapacity: d.recoveryCapacity ?? 50,
        sensoryLimitations: parseContinuityJson(d.sensoryLimitationsJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=physical`);
}

export async function updateCharacterPhysicalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterPhysicalHealthProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterPhysicalHealthProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterPhysicalHealthProfileUpdateInput = {
    injuryLoad: d.injuryLoad ?? undefined,
    chronicPainLoad: d.chronicPainLoad ?? undefined,
    illnessBurden: d.illnessBurden ?? undefined,
    nutritionStatus: d.nutritionStatus ?? undefined,
    sleepQuality: d.sleepQuality ?? undefined,
    enduranceCapacity: d.enduranceCapacity ?? undefined,
    mobilityLimitationLoad: d.mobilityLimitationLoad ?? undefined,
    reproductiveBurden: d.reproductiveBurden ?? undefined,
    agingBurden: d.agingBurden ?? undefined,
    recoveryCapacity: d.recoveryCapacity ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  const sl = patchEnvJsonFromForm(raw, "sensoryLimitationsJson");
  if (sl !== undefined) data.sensoryLimitations = sl;

  try {
    await prisma.characterPhysicalHealthProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=physical`,
  );
}

export async function deleteCharacterPhysicalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterPhysicalHealthProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterPhysicalHealthProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=physical`);
}

export async function createCharacterMentalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterMentalHealthProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterMentalHealthProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        attentionStability: d.attentionStability ?? 50,
        clarityLevel: d.clarityLevel ?? 50,
        intrusiveThoughtLoad: d.intrusiveThoughtLoad ?? 50,
        dissociationTendency: d.dissociationTendency ?? 50,
        vigilanceLevel: d.vigilanceLevel ?? 50,
        despairLoad: d.despairLoad ?? 50,
        controlCompulsion: d.controlCompulsion ?? 50,
        moodInstability: d.moodInstability ?? 50,
        stressTolerance: d.stressTolerance ?? 50,
        realityCoherence: d.realityCoherence ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=mental`);
}

export async function updateCharacterMentalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterMentalHealthProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterMentalHealthProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterMentalHealthProfileUpdateInput = {
    attentionStability: d.attentionStability ?? undefined,
    clarityLevel: d.clarityLevel ?? undefined,
    intrusiveThoughtLoad: d.intrusiveThoughtLoad ?? undefined,
    dissociationTendency: d.dissociationTendency ?? undefined,
    vigilanceLevel: d.vigilanceLevel ?? undefined,
    despairLoad: d.despairLoad ?? undefined,
    controlCompulsion: d.controlCompulsion ?? undefined,
    moodInstability: d.moodInstability ?? undefined,
    stressTolerance: d.stressTolerance ?? undefined,
    realityCoherence: d.realityCoherence ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };

  try {
    await prisma.characterMentalHealthProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=mental`,
  );
}

export async function deleteCharacterMentalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterMentalHealthProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterMentalHealthProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=mental`);
}

export async function createCharacterEmotionalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterEmotionalHealthProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterEmotionalHealthProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        emotionalRange: d.emotionalRange ?? 50,
        suppressionLoad: d.suppressionLoad ?? 50,
        griefSaturation: d.griefSaturation ?? 50,
        shameSaturation: d.shameSaturation ?? 50,
        tendernessAccess: d.tendernessAccess ?? 50,
        angerRegulation: d.angerRegulation ?? 50,
        fearCarryover: d.fearCarryover ?? 50,
        relationalOpenness: d.relationalOpenness ?? 50,
        recoveryAfterDistress: d.recoveryAfterDistress ?? 50,
        emotionalNumbnessLoad: d.emotionalNumbnessLoad ?? 50,
        emotionalFloodingLoad: d.emotionalFloodingLoad ?? 50,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=emotional`);
}

export async function updateCharacterEmotionalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterEmotionalHealthProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterEmotionalHealthProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterEmotionalHealthProfileUpdateInput = {
    emotionalRange: d.emotionalRange ?? undefined,
    suppressionLoad: d.suppressionLoad ?? undefined,
    griefSaturation: d.griefSaturation ?? undefined,
    shameSaturation: d.shameSaturation ?? undefined,
    tendernessAccess: d.tendernessAccess ?? undefined,
    angerRegulation: d.angerRegulation ?? undefined,
    fearCarryover: d.fearCarryover ?? undefined,
    relationalOpenness: d.relationalOpenness ?? undefined,
    recoveryAfterDistress: d.recoveryAfterDistress ?? undefined,
    emotionalNumbnessLoad: d.emotionalNumbnessLoad ?? undefined,
    emotionalFloodingLoad: d.emotionalFloodingLoad ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };

  try {
    await prisma.characterEmotionalHealthProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=emotional`,
  );
}

export async function deleteCharacterEmotionalHealthProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterEmotionalHealthProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterEmotionalHealthProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=emotional`);
}

export async function createCharacterHealthEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterHealthEnvelopeUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterHealthEnvelope.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        functionalCapacity: d.functionalCapacity ?? 50,
        careAccess: d.careAccess ?? 50,
        visibleHealthPresentation: parseContinuityJson(d.visibleHealthPresentationJson),
        hiddenHealthBurden: parseContinuityJson(d.hiddenHealthBurdenJson),
        socialInterpretation: parseContinuityJson(d.socialInterpretationJson),
        simulationLayer: parseContinuityJson(d.simulationLayerJson),
        worldFacingHealthNarrative: parseContinuityJson(d.worldFacingHealthNarrativeJson),
        summary: parseContinuityJson(d.summaryJson),
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/continuity?error=db`);
  }

  revCharacterContinuity(d.personId, d.worldStateId);
  redirect(`/admin/characters/${d.personId}/continuity?worldStateId=${d.worldStateId}&saved=healthEnv`);
}

export async function updateCharacterHealthEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterHealthEnvelopeUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterHealthEnvelope.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/people?error=validation");

  const data: Prisma.CharacterHealthEnvelopeUpdateInput = {
    functionalCapacity: d.functionalCapacity ?? undefined,
    careAccess: d.careAccess ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType ?? undefined,
    visibility: d.visibility ?? undefined,
    certainty: d.certainty ?? null,
  };
  for (const [key, formKey] of [
    ["visibleHealthPresentation", "visibleHealthPresentationJson"],
    ["hiddenHealthBurden", "hiddenHealthBurdenJson"],
    ["socialInterpretation", "socialInterpretationJson"],
    ["simulationLayer", "simulationLayerJson"],
    ["worldFacingHealthNarrative", "worldFacingHealthNarrativeJson"],
    ["summary", "summaryJson"],
  ] as const) {
    const v = patchEnvJsonFromForm(raw, formKey);
    if (v !== undefined) (data as Record<string, unknown>)[key] = v;
  }

  try {
    await prisma.characterHealthEnvelope.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/continuity?error=db`);
  }

  revCharacterContinuity(existing.personId, existing.worldStateId);
  redirect(
    `/admin/characters/${existing.personId}/continuity?worldStateId=${existing.worldStateId}&saved=healthEnv`,
  );
}

export async function deleteCharacterHealthEnvelope(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/people?error=validation");

  const row = await prisma.characterHealthEnvelope.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/people?error=validation");

  try {
    await prisma.characterHealthEnvelope.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/continuity?error=db`);
  }

  revCharacterContinuity(row.personId, row.worldStateId);
  redirect(`/admin/characters/${row.personId}/continuity?worldStateId=${row.worldStateId}&deleted=healthEnv`);
}
