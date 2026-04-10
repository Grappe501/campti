import {
  AttachmentStyle,
  Prisma,
  PublicStatus,
  RecordType,
  RelationshipType,
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

const optRelationshipType = z
  .union([z.nativeEnum(RelationshipType), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optPublicStatus = z
  .union([z.nativeEnum(PublicStatus), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optAttachmentStyle = z
  .union([z.nativeEnum(AttachmentStyle), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export function parseRelationshipJson(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return parseEnvJson(raw);
}

export const deleteByIdSchema = z.object({ id: z.string().cuid() });

/** Raw dyad from forms — normalized in actions to personAId < personBId. */
export const relationshipProfileCreateSchema = z.object({
  personIdOne: z.string().cuid(),
  personIdTwo: z.string().cuid(),
  worldStateId: z.string().cuid(),
  relationshipType: z.nativeEnum(RelationshipType),
  publicStatus: z.nativeEnum(PublicStatus),
  privateStatus: optText(2000),
  hiddenTruthJson: z.string().max(200000).optional().nullable(),
  powerDirectionJson: z.string().max(200000).optional().nullable(),
  dependencyDirectionJson: z.string().max(200000).optional().nullable(),
  trustLevel: emptyToUndefInt(int0_100.optional()),
  fearLevel: emptyToUndefInt(int0_100.optional()),
  shameLeverage: emptyToUndefInt(int0_100.optional()),
  obligationWeight: emptyToUndefInt(int0_100.optional()),
  betrayalThreshold: emptyToUndefInt(int0_100.optional()),
  rescueThreshold: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const relationshipProfileUpdateSchema = z.object({
  id: z.string().cuid(),
  relationshipType: optRelationshipType,
  publicStatus: optPublicStatus,
  privateStatus: optText(2000),
  hiddenTruthJson: z.string().max(200000).optional().nullable(),
  powerDirectionJson: z.string().max(200000).optional().nullable(),
  dependencyDirectionJson: z.string().max(200000).optional().nullable(),
  trustLevel: emptyToUndefInt(int0_100.optional()),
  fearLevel: emptyToUndefInt(int0_100.optional()),
  shameLeverage: emptyToUndefInt(int0_100.optional()),
  obligationWeight: emptyToUndefInt(int0_100.optional()),
  betrayalThreshold: emptyToUndefInt(int0_100.optional()),
  rescueThreshold: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const relationshipDynamicStateCreateSchema = z.object({
  relationshipProfileId: z.string().cuid(),
  label: z.string().min(1).max(500),
  emotionalTemperature: emptyToUndefInt(int0_100.optional()),
  volatility: emptyToUndefInt(int0_100.optional()),
  intimacyLevel: emptyToUndefInt(int0_100.optional()),
  conflictLoad: emptyToUndefInt(int0_100.optional()),
  mutualRecognition: emptyToUndefInt(int0_100.optional()),
  disclosureSafety: emptyToUndefInt(int0_100.optional()),
  currentTensionsJson: z.string().max(200000).optional().nullable(),
  currentNeedsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const relationshipDynamicStateUpdateSchema = z.object({
  id: z.string().cuid(),
  label: z.string().min(1).max(500),
  emotionalTemperature: emptyToUndefInt(int0_100.optional()),
  volatility: emptyToUndefInt(int0_100.optional()),
  intimacyLevel: emptyToUndefInt(int0_100.optional()),
  conflictLoad: emptyToUndefInt(int0_100.optional()),
  mutualRecognition: emptyToUndefInt(int0_100.optional()),
  disclosureSafety: emptyToUndefInt(int0_100.optional()),
  currentTensionsJson: z.string().max(200000).optional().nullable(),
  currentNeedsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterMaskingProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  maskingIntensity: emptyToUndefInt(int0_100.optional()),
  codeSwitchingLoad: emptyToUndefInt(int0_100.optional()),
  secrecyNeed: emptyToUndefInt(int0_100.optional()),
  disclosureRisk: emptyToUndefInt(int0_100.optional()),
  authenticPrivateSelfJson: z.string().max(200000).optional().nullable(),
  publicMaskJson: z.string().max(200000).optional().nullable(),
  trustedCircleExpressionJson: z.string().max(200000).optional().nullable(),
  forbiddenExpressionJson: z.string().max(200000).optional().nullable(),
  adaptiveStrategiesJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterMaskingProfileUpdateSchema = characterMaskingProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterDesireProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  attractionPatternJson: z.string().max(200000).optional().nullable(),
  attachmentStyle: optAttachmentStyle,
  desireVisibility: emptyToUndefInt(int0_100.optional()),
  desireSuppression: emptyToUndefInt(int0_100.optional()),
  jealousySensitivity: emptyToUndefInt(int0_100.optional()),
  loyaltyPriorityJson: z.string().max(200000).optional().nullable(),
  intimacyNeed: emptyToUndefInt(int0_100.optional()),
  autonomyNeed: emptyToUndefInt(int0_100.optional()),
  tabooExposureRisk: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterDesireProfileUpdateSchema = characterDesireProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const worldRelationshipNormProfileUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  label: z.string().min(1).max(500),
  marriageRulesJson: z.string().max(200000).optional().nullable(),
  sexualNormsJson: z.string().max(200000).optional().nullable(),
  desireExpressionRulesJson: z.string().max(200000).optional().nullable(),
  tabooSystemJson: z.string().max(200000).optional().nullable(),
  emotionalExpressionRulesJson: z.string().max(200000).optional().nullable(),
  genderDynamicsJson: z.string().max(200000).optional().nullable(),
  relationalVisibility: emptyToUndefInt(int0_100.optional()),
  punishmentForViolation: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldRelationshipNormProfileUpdateSchema = worldRelationshipNormProfileUpsertSchema
  .omit({ worldStateId: true })
  .extend({ id: z.string().cuid() });

export const relationshipDisclosureProfileUpsertSchema = z.object({
  relationshipProfileId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  truthShareCapacity: emptyToUndefInt(int0_100.optional()),
  emotionalDisclosureCapacity: emptyToUndefInt(int0_100.optional()),
  secrecyBurden: emptyToUndefInt(int0_100.optional()),
  misrecognitionRisk: emptyToUndefInt(int0_100.optional()),
  exposureConsequence: emptyToUndefInt(int0_100.optional()),
  safeTopicsJson: z.string().max(200000).optional().nullable(),
  unsafeTopicsJson: z.string().max(200000).optional().nullable(),
  codedChannelsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const relationshipDisclosureProfileUpdateSchema = relationshipDisclosureProfileUpsertSchema
  .omit({ relationshipProfileId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const relationshipNetworkSummaryUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  keyBondsJson: z.string().max(200000).optional().nullable(),
  primaryTensionsJson: z.string().max(200000).optional().nullable(),
  dependencyMapJson: z.string().max(200000).optional().nullable(),
  trustMapJson: z.string().max(200000).optional().nullable(),
  hiddenConflictsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const relationshipNetworkSummaryUpdateSchema = relationshipNetworkSummaryUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });
