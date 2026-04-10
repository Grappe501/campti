import { Prisma, RecordType, VisibilityStatus } from "@prisma/client";
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
const optInt0_100 = emptyToUndefInt(int0_100.optional());

export function parseIntelligenceJson(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return parseEnvJson(raw);
}

export const worldKnowledgeProfileUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  label: optText(500),
  abstractionCeiling: optInt0_100,
  literacyRegime: optText(20000),
  dominantExplanatorySystemsJson: z.string().max(200000).optional().nullable(),
  technologyHorizonJson: z.string().max(200000).optional().nullable(),
  informationFlowSpeed: optInt0_100,
  geographicAwarenessNorm: optText(20000),
  tabooKnowledgeDomainsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldExpressionProfileUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  label: optText(500),
  publicExpressionCeiling: optInt0_100,
  internalLanguageComplexityNorm: optInt0_100,
  metaphorSourceDomainsJson: z.string().max(200000).optional().nullable(),
  acceptableExplanationModesJson: z.string().max(200000).optional().nullable(),
  silencePatternsNorm: optText(20000),
  tabooPhrasingDomainsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

const characterSliceBase = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterIntelligenceProfileUpsertSchema = characterSliceBase.extend({
  patternRecognition: optInt0_100,
  workingMemory: optInt0_100,
  abstractionCapacity: optInt0_100,
  socialInference: optInt0_100,
  environmentalInference: optInt0_100,
  selfReflectionDepth: optInt0_100,
  impulseControl: optInt0_100,
  planningHorizon: optInt0_100,
  metacognition: optInt0_100,
  memoryStrength: optInt0_100,
  expressionComplexity: optInt0_100,
});

export const characterDevelopmentProfileUpsertSchema = characterSliceBase.extend({
  ageBand: optText(200),
  maturityRate: optInt0_100,
  socialRoleByAge: optText(20000),
  regulationLevel: optInt0_100,
  responsibilityLoad: optInt0_100,
  roleCompression: optInt0_100,
  protectednessExposure: optInt0_100,
  developmentalCompressionJson: z.string().max(200000).optional().nullable(),
});

export const characterBiologicalStateUpsertSchema = characterSliceBase.extend({
  nutritionLoad: optInt0_100,
  fatigueLoad: optInt0_100,
  illnessLoad: optInt0_100,
  chronicStress: optInt0_100,
  bodyPain: optInt0_100,
  reproductiveLoad: emptyToUndefInt(z.coerce.number().int().min(0).max(100).optional()),
  laborExhaustion: optInt0_100,
  environmentalExposure: optInt0_100,
  traumaLoad: optInt0_100,
});
