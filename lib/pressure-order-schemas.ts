import {
  JusticeMode,
  Prisma,
  RecordType,
  SelfPerceptionState,
  StatusPosition,
  VisibilityStatus,
} from "@prisma/client";
import { z } from "zod";
import { parseEnvJson } from "@/lib/environment-schemas";

const optRt = z
  .union([z.nativeEnum(RecordType), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optVis = z
  .union([z.nativeEnum(VisibilityStatus), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optText = (max: number) => z.string().max(max).optional().nullable();

const emptyToUndefInt = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema);

const int0_100 = z.coerce.number().int().min(0).max(100);
const intNeg100_100 = z.coerce.number().int().min(-100).max(100);

const optJusticeMode = z
  .union([z.nativeEnum(JusticeMode), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optStatusPosition = z
  .union([z.nativeEnum(StatusPosition), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optSelfPerception = z
  .union([z.nativeEnum(SelfPerceptionState), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export function parsePressureJson(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return parseEnvJson(raw);
}

export const worldGovernanceProfileUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  worldStateId: z.string().cuid(),
  label: z.string().min(1).max(500),
  controlIntensity: emptyToUndefInt(int0_100.optional()),
  punishmentSeverity: emptyToUndefInt(int0_100.optional()),
  enforcementVisibility: emptyToUndefInt(int0_100.optional()),
  justiceFairness: emptyToUndefInt(int0_100.optional()),
  conformityPressure: emptyToUndefInt(int0_100.optional()),
  justiceMode: optJusticeMode,
  authorityProfileJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldGovernanceProfileUpdateSchema = worldGovernanceProfileUpsertSchema
  .omit({ worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterGovernanceImpactUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  allowedExpressionRange: emptyToUndefInt(int0_100.optional()),
  suppressionLevel: emptyToUndefInt(int0_100.optional()),
  punishmentRisk: emptyToUndefInt(int0_100.optional()),
  adaptiveBehaviorJson: z.string().max(200000).optional().nullable(),
  authenticSelfJson: z.string().max(200000).optional().nullable(),
  allowedSelfJson: z.string().max(200000).optional().nullable(),
  suppressedSelfJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterGovernanceImpactUpdateSchema = characterGovernanceImpactUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterSocioEconomicProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  statusPosition: optStatusPosition,
  resourceAccess: emptyToUndefInt(int0_100.optional()),
  roleExpectation: emptyToUndefInt(int0_100.optional()),
  mobilityPotential: emptyToUndefInt(int0_100.optional()),
  dependencyLevel: emptyToUndefInt(int0_100.optional()),
  survivalPressure: emptyToUndefInt(int0_100.optional()),
  privilegeFactor: emptyToUndefInt(int0_100.optional()),
  perceivedValue: optText(2000),
  internalEffectsJson: z.string().max(200000).optional().nullable(),
  copingPatternsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterSocioEconomicProfileUpdateSchema = characterSocioEconomicProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterDemographicProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  visibleTraitsJson: z.string().max(200000).optional().nullable(),
  ancestryContextJson: z.string().max(200000).optional().nullable(),
  statusValue: emptyToUndefInt(intNeg100_100.optional()),
  trustBias: emptyToUndefInt(intNeg100_100.optional()),
  inclusionLevel: emptyToUndefInt(int0_100.optional()),
  riskExposure: emptyToUndefInt(int0_100.optional()),
  privilegeModifier: emptyToUndefInt(int0_100.optional()),
  mobilityModifier: emptyToUndefInt(int0_100.optional()),
  punishmentRiskModifier: emptyToUndefInt(int0_100.optional()),
  belongingSense: emptyToUndefInt(int0_100.optional()),
  identityCohesion: emptyToUndefInt(int0_100.optional()),
  vigilanceLevel: emptyToUndefInt(int0_100.optional()),
  selfPerception: optSelfPerception,
  stressPatternsJson: z.string().max(200000).optional().nullable(),
  adaptiveBehaviorsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterDemographicProfileUpdateSchema = characterDemographicProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterFamilyPressureProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  attachmentStrength: emptyToUndefInt(int0_100.optional()),
  obligationPressure: emptyToUndefInt(int0_100.optional()),
  emotionalExpressionRange: emptyToUndefInt(int0_100.optional()),
  individualFreedom: emptyToUndefInt(int0_100.optional()),
  loyaltyExpectation: emptyToUndefInt(int0_100.optional()),
  conflictZonesJson: z.string().max(200000).optional().nullable(),
  feltLoveJson: z.string().max(200000).optional().nullable(),
  expressedLoveJson: z.string().max(200000).optional().nullable(),
  constrainedEmotionJson: z.string().max(200000).optional().nullable(),
  behaviorPatternsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterFamilyPressureProfileUpdateSchema = characterFamilyPressureProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const worldPressureBundleUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  governanceWeight: emptyToUndefInt(int0_100.optional()),
  economicWeight: emptyToUndefInt(int0_100.optional()),
  demographicWeight: emptyToUndefInt(int0_100.optional()),
  familyWeight: emptyToUndefInt(int0_100.optional()),
  summaryJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldPressureBundleUpdateSchema = worldPressureBundleUpsertSchema
  .omit({ worldStateId: true })
  .extend({ id: z.string().cuid() });

export const deleteByIdSchema = z.object({ id: z.string().cuid() });
