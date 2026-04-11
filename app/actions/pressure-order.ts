"use server";

import type { Prisma } from "@prisma/client";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { patchEnvJsonFromForm } from "@/lib/environment-schemas";
import {
  characterDemographicProfileUpdateSchema,
  characterDemographicProfileUpsertSchema,
  characterFamilyPressureProfileUpdateSchema,
  characterFamilyPressureProfileUpsertSchema,
  characterGovernanceImpactUpdateSchema,
  characterGovernanceImpactUpsertSchema,
  characterSocioEconomicProfileUpdateSchema,
  characterSocioEconomicProfileUpsertSchema,
  deleteByIdSchema,
  parsePressureJson,
  parseWorldStateEraDriversText,
  worldGovernanceProfileUpdateSchema,
  worldGovernanceProfileUpsertSchema,
  worldPressureBundleUpdateSchema,
  worldPressureBundleUpsertSchema,
  worldStateEraProfileUpsertSchema,
} from "@/lib/pressure-order-schemas";
import { prisma } from "@/lib/prisma";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

function revalidatePressureForWorld(worldStateId: string) {
  revalidatePath(`/admin/world-states/${worldStateId}/pressure`);
  revalidatePath(`/admin/world-states/${worldStateId}/profile`);
  revalidatePath("/admin/pressure/governance");
  revalidatePath("/admin/pressure/bundles");
}

function revalidatePressureForPerson(personId: string) {
  revalidatePath(`/admin/characters/${personId}/pressure`);
}

export async function createWorldGovernanceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldGovernanceProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/governance?error=validation");

  const d = parsed.data;
  try {
    await prisma.worldGovernanceProfile.create({
      data: {
        worldStateId: d.worldStateId,
        label: d.label,
        controlIntensity: d.controlIntensity ?? undefined,
        punishmentSeverity: d.punishmentSeverity ?? undefined,
        enforcementVisibility: d.enforcementVisibility ?? undefined,
        justiceFairness: d.justiceFairness ?? undefined,
        conformityPressure: d.conformityPressure ?? undefined,
        justiceMode: d.justiceMode ?? undefined,
        authorityProfile: parsePressureJson(d.authorityProfileJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect("/admin/pressure/governance/new?error=db");
  }

  revalidatePressureForWorld(d.worldStateId);
  redirect("/admin/pressure/governance?saved=1");
}

export async function updateWorldGovernanceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldGovernanceProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/governance?error=validation");

  const d = parsed.data;
  const existing = await prisma.worldGovernanceProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/pressure/governance?error=validation");

  const data: Prisma.WorldGovernanceProfileUpdateInput = {
    label: d.label,
    controlIntensity: d.controlIntensity ?? undefined,
    punishmentSeverity: d.punishmentSeverity ?? undefined,
    enforcementVisibility: d.enforcementVisibility ?? undefined,
    justiceFairness: d.justiceFairness ?? undefined,
    conformityPressure: d.conformityPressure ?? undefined,
    justiceMode: d.justiceMode ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const ap = patchEnvJsonFromForm(raw, "authorityProfileJson");
  if (ap !== undefined) data.authorityProfile = ap;

  try {
    await prisma.worldGovernanceProfile.update({
      where: { id: d.id },
      data,
    });
  } catch {
    redirect(`/admin/pressure/governance/${d.id}?error=db`);
  }

  revalidatePressureForWorld(existing.worldStateId);
  redirect(`/admin/pressure/governance/${d.id}?saved=1`);
}

export async function deleteWorldGovernanceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/governance?error=validation");

  const row = await prisma.worldGovernanceProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/pressure/governance?error=validation");
  try {
    await prisma.worldGovernanceProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/pressure/governance/${parsed.data.id}?error=db`);
  }

  revalidatePressureForWorld(row.worldStateId);
  redirect("/admin/pressure/governance?deleted=1");
}

export async function createCharacterGovernanceImpact(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterGovernanceImpactUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterGovernanceImpact.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        allowedExpressionRange: d.allowedExpressionRange ?? undefined,
        suppressionLevel: d.suppressionLevel ?? undefined,
        punishmentRisk: d.punishmentRisk ?? undefined,
        adaptiveBehavior: parsePressureJson(d.adaptiveBehaviorJson ?? undefined),
        authenticSelf: parsePressureJson(d.authenticSelfJson ?? undefined),
        allowedSelf: parsePressureJson(d.allowedSelfJson ?? undefined),
        suppressedSelf: parsePressureJson(d.suppressedSelfJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/pressure?saved=gov`);
}

export async function updateCharacterGovernanceImpact(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterGovernanceImpactUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterGovernanceImpact.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterGovernanceImpactUpdateInput = {
    allowedExpressionRange: d.allowedExpressionRange ?? undefined,
    suppressionLevel: d.suppressionLevel ?? undefined,
    punishmentRisk: d.punishmentRisk ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const keys = ["adaptiveBehaviorJson", "authenticSelfJson", "allowedSelfJson", "suppressedSelfJson"] as const;
  const fieldMap: Record<(typeof keys)[number], keyof Prisma.CharacterGovernanceImpactUpdateInput> = {
    adaptiveBehaviorJson: "adaptiveBehavior",
    authenticSelfJson: "authenticSelf",
    allowedSelfJson: "allowedSelf",
    suppressedSelfJson: "suppressedSelf",
  };
  for (const k of keys) {
    const p = patchEnvJsonFromForm(raw, k);
    if (p !== undefined) data[fieldMap[k]] = p as never;
  }

  try {
    await prisma.characterGovernanceImpact.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/pressure?saved=gov`);
}

export async function deleteCharacterGovernanceImpact(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const row = await prisma.characterGovernanceImpact.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/characters?error=validation");
  try {
    await prisma.characterGovernanceImpact.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/pressure?deleted=gov`);
}

export async function createCharacterSocioEconomicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterSocioEconomicProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterSocioEconomicProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        statusPosition: d.statusPosition ?? undefined,
        resourceAccess: d.resourceAccess ?? undefined,
        roleExpectation: d.roleExpectation ?? undefined,
        mobilityPotential: d.mobilityPotential ?? undefined,
        dependencyLevel: d.dependencyLevel ?? undefined,
        survivalPressure: d.survivalPressure ?? undefined,
        privilegeFactor: d.privilegeFactor ?? undefined,
        perceivedValue: d.perceivedValue ?? null,
        internalEffects: parsePressureJson(d.internalEffectsJson ?? undefined),
        copingPatterns: parsePressureJson(d.copingPatternsJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/pressure?saved=socio`);
}

export async function updateCharacterSocioEconomicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterSocioEconomicProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterSocioEconomicProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterSocioEconomicProfileUpdateInput = {
    statusPosition: d.statusPosition ?? undefined,
    resourceAccess: d.resourceAccess ?? undefined,
    roleExpectation: d.roleExpectation ?? undefined,
    mobilityPotential: d.mobilityPotential ?? undefined,
    dependencyLevel: d.dependencyLevel ?? undefined,
    survivalPressure: d.survivalPressure ?? undefined,
    privilegeFactor: d.privilegeFactor ?? undefined,
    perceivedValue: d.perceivedValue ?? null,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const ie = patchEnvJsonFromForm(raw, "internalEffectsJson");
  if (ie !== undefined) data.internalEffects = ie;
  const cp = patchEnvJsonFromForm(raw, "copingPatternsJson");
  if (cp !== undefined) data.copingPatterns = cp;

  try {
    await prisma.characterSocioEconomicProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/pressure?saved=socio`);
}

export async function deleteCharacterSocioEconomicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const row = await prisma.characterSocioEconomicProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/characters?error=validation");
  try {
    await prisma.characterSocioEconomicProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/pressure?deleted=socio`);
}

export async function createCharacterDemographicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterDemographicProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterDemographicProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        visibleTraits: parsePressureJson(d.visibleTraitsJson ?? undefined),
        ancestryContext: parsePressureJson(d.ancestryContextJson ?? undefined),
        statusValue: d.statusValue ?? undefined,
        trustBias: d.trustBias ?? undefined,
        inclusionLevel: d.inclusionLevel ?? undefined,
        riskExposure: d.riskExposure ?? undefined,
        privilegeModifier: d.privilegeModifier ?? undefined,
        mobilityModifier: d.mobilityModifier ?? undefined,
        punishmentRiskModifier: d.punishmentRiskModifier ?? undefined,
        belongingSense: d.belongingSense ?? undefined,
        identityCohesion: d.identityCohesion ?? undefined,
        vigilanceLevel: d.vigilanceLevel ?? undefined,
        selfPerception: d.selfPerception ?? undefined,
        stressPatterns: parsePressureJson(d.stressPatternsJson ?? undefined),
        adaptiveBehaviors: parsePressureJson(d.adaptiveBehaviorsJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/pressure?saved=demo`);
}

export async function updateCharacterDemographicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterDemographicProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterDemographicProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterDemographicProfileUpdateInput = {
    statusValue: d.statusValue ?? undefined,
    trustBias: d.trustBias ?? undefined,
    inclusionLevel: d.inclusionLevel ?? undefined,
    riskExposure: d.riskExposure ?? undefined,
    privilegeModifier: d.privilegeModifier ?? undefined,
    mobilityModifier: d.mobilityModifier ?? undefined,
    punishmentRiskModifier: d.punishmentRiskModifier ?? undefined,
    belongingSense: d.belongingSense ?? undefined,
    identityCohesion: d.identityCohesion ?? undefined,
    vigilanceLevel: d.vigilanceLevel ?? undefined,
    selfPerception: d.selfPerception ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const vt = patchEnvJsonFromForm(raw, "visibleTraitsJson");
  if (vt !== undefined) data.visibleTraits = vt;
  const ac = patchEnvJsonFromForm(raw, "ancestryContextJson");
  if (ac !== undefined) data.ancestryContext = ac;
  const sp = patchEnvJsonFromForm(raw, "stressPatternsJson");
  if (sp !== undefined) data.stressPatterns = sp;
  const ab = patchEnvJsonFromForm(raw, "adaptiveBehaviorsJson");
  if (ab !== undefined) data.adaptiveBehaviors = ab;

  try {
    await prisma.characterDemographicProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/pressure?saved=demo`);
}

export async function deleteCharacterDemographicProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const row = await prisma.characterDemographicProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/characters?error=validation");
  try {
    await prisma.characterDemographicProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/pressure?deleted=demo`);
}

export async function createCharacterFamilyPressureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterFamilyPressureProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterFamilyPressureProfile.create({
      data: {
        personId: d.personId,
        worldStateId: d.worldStateId,
        attachmentStrength: d.attachmentStrength ?? undefined,
        obligationPressure: d.obligationPressure ?? undefined,
        emotionalExpressionRange: d.emotionalExpressionRange ?? undefined,
        individualFreedom: d.individualFreedom ?? undefined,
        loyaltyExpectation: d.loyaltyExpectation ?? undefined,
        conflictZones: parsePressureJson(d.conflictZonesJson ?? undefined),
        feltLove: parsePressureJson(d.feltLoveJson ?? undefined),
        expressedLove: parsePressureJson(d.expressedLoveJson ?? undefined),
        constrainedEmotion: parsePressureJson(d.constrainedEmotionJson ?? undefined),
        behaviorPatterns: parsePressureJson(d.behaviorPatternsJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${d.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(d.personId);
  redirect(`/admin/characters/${d.personId}/pressure?saved=family`);
}

export async function updateCharacterFamilyPressureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterFamilyPressureProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const d = parsed.data;
  const existing = await prisma.characterFamilyPressureProfile.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/characters?error=validation");

  const data: Prisma.CharacterFamilyPressureProfileUpdateInput = {
    attachmentStrength: d.attachmentStrength ?? undefined,
    obligationPressure: d.obligationPressure ?? undefined,
    emotionalExpressionRange: d.emotionalExpressionRange ?? undefined,
    individualFreedom: d.individualFreedom ?? undefined,
    loyaltyExpectation: d.loyaltyExpectation ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const keys = ["conflictZonesJson", "feltLoveJson", "expressedLoveJson", "constrainedEmotionJson", "behaviorPatternsJson"] as const;
  const fieldMap: Record<(typeof keys)[number], keyof Prisma.CharacterFamilyPressureProfileUpdateInput> = {
    conflictZonesJson: "conflictZones",
    feltLoveJson: "feltLove",
    expressedLoveJson: "expressedLove",
    constrainedEmotionJson: "constrainedEmotion",
    behaviorPatternsJson: "behaviorPatterns",
  };
  for (const k of keys) {
    const p = patchEnvJsonFromForm(raw, k);
    if (p !== undefined) data[fieldMap[k]] = p as never;
  }

  try {
    await prisma.characterFamilyPressureProfile.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/characters/${existing.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(existing.personId);
  redirect(`/admin/characters/${existing.personId}/pressure?saved=family`);
}

export async function deleteCharacterFamilyPressureProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/characters?error=validation");

  const row = await prisma.characterFamilyPressureProfile.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/characters?error=validation");
  try {
    await prisma.characterFamilyPressureProfile.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/characters/${row.personId}/pressure?error=db`);
  }

  revalidatePressureForPerson(row.personId);
  redirect(`/admin/characters/${row.personId}/pressure?deleted=family`);
}

export async function createWorldPressureBundle(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldPressureBundleUpsertSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/bundles?error=validation");

  const d = parsed.data;
  try {
    await prisma.worldPressureBundle.create({
      data: {
        worldStateId: d.worldStateId,
        governanceWeight: d.governanceWeight ?? undefined,
        economicWeight: d.economicWeight ?? undefined,
        demographicWeight: d.demographicWeight ?? undefined,
        familyWeight: d.familyWeight ?? undefined,
        summary: parsePressureJson(d.summaryJson ?? undefined),
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect("/admin/pressure/bundles/new?error=db");
  }

  revalidatePressureForWorld(d.worldStateId);
  redirect("/admin/pressure/bundles?saved=1");
}

export async function updateWorldPressureBundle(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldPressureBundleUpdateSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/bundles?error=validation");

  const d = parsed.data;
  const existing = await prisma.worldPressureBundle.findUnique({ where: { id: d.id } });
  if (!existing) redirect("/admin/pressure/bundles?error=validation");

  const data: Prisma.WorldPressureBundleUpdateInput = {
    governanceWeight: d.governanceWeight ?? undefined,
    economicWeight: d.economicWeight ?? undefined,
    demographicWeight: d.demographicWeight ?? undefined,
    familyWeight: d.familyWeight ?? undefined,
    notes: d.notes ?? null,
    recordType: d.recordType,
    visibility: d.visibility,
    certainty: d.certainty ?? null,
  };
  const s = patchEnvJsonFromForm(raw, "summaryJson");
  if (s !== undefined) data.summary = s;

  try {
    await prisma.worldPressureBundle.update({ where: { id: d.id }, data });
  } catch {
    redirect(`/admin/pressure/bundles/${d.id}?error=db`);
  }

  revalidatePressureForWorld(existing.worldStateId);
  redirect(`/admin/pressure/bundles/${d.id}?saved=1`);
}

export async function deleteWorldPressureBundle(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = deleteByIdSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/pressure/bundles?error=validation");

  const row = await prisma.worldPressureBundle.findUnique({ where: { id: parsed.data.id } });
  if (!row) redirect("/admin/pressure/bundles?error=validation");
  try {
    await prisma.worldPressureBundle.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect(`/admin/pressure/bundles/${parsed.data.id}?error=db`);
  }

  revalidatePressureForWorld(row.worldStateId);
  redirect("/admin/pressure/bundles?deleted=1");
}

export async function upsertWorldStateEraProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = worldStateEraProfileUpsertSchema.safeParse(raw);
  if (!parsed.success) {
    const ws = raw.worldStateId;
    redirect(ws ? `/admin/world-states/${ws}/profile?error=validation` : "/admin/world-states?error=validation");
  }

  const d = parsed.data;
  const drivers = parseWorldStateEraDriversText(d.driversText ?? undefined);
  try {
    await prisma.worldStateEraProfile.upsert({
      where: { worldStateId: d.worldStateId },
      create: {
        worldStateId: d.worldStateId,
        coreEconomicDrivers: drivers,
        powerSummary: d.powerSummary ?? null,
        meaningOfWork: d.meaningOfWork ?? null,
        knobEconomicPressure: d.knobEconomicPressure ?? 50,
        knobRelationalInterdependence: d.knobRelationalInterdependence ?? 50,
        knobAutonomyBaseline: d.knobAutonomyBaseline ?? 50,
        knobSystemicExtraction: d.knobSystemicExtraction ?? 50,
        knobCollectiveCohesion: d.knobCollectiveCohesion ?? 50,
        evidenceRationale: d.evidenceRationale ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
      update: {
        coreEconomicDrivers: drivers,
        powerSummary: d.powerSummary ?? null,
        meaningOfWork: d.meaningOfWork ?? null,
        knobEconomicPressure: d.knobEconomicPressure ?? 50,
        knobRelationalInterdependence: d.knobRelationalInterdependence ?? 50,
        knobAutonomyBaseline: d.knobAutonomyBaseline ?? 50,
        knobSystemicExtraction: d.knobSystemicExtraction ?? 50,
        knobCollectiveCohesion: d.knobCollectiveCohesion ?? 50,
        evidenceRationale: d.evidenceRationale ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType ?? RecordType.HYBRID,
        visibility: d.visibility ?? VisibilityStatus.REVIEW,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/world-states/${d.worldStateId}/profile?error=db`);
  }

  revalidatePressureForWorld(d.worldStateId);
  redirect(`/admin/world-states/${d.worldStateId}/profile?saved=1`);
}
