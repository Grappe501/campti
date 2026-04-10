import { Prisma, RecordType, TrainingMode, VisibilityStatus } from "@prisma/client";
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

const optTrainingMode = z
  .union([z.nativeEnum(TrainingMode), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export function parseContinuityJson(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return parseEnvJson(raw);
}

export const deleteByIdSchema = z.object({ id: z.string().cuid() });

export const characterTraumaProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  traumaLoad: emptyToUndefInt(int0_100.optional()),
  silenceLoad: emptyToUndefInt(int0_100.optional()),
  hypervigilanceLoad: emptyToUndefInt(int0_100.optional()),
  shameResidue: emptyToUndefInt(int0_100.optional()),
  griefResidue: emptyToUndefInt(int0_100.optional()),
  bodyMemoryJson: z.string().max(200000).optional().nullable(),
  triggerPatternsJson: z.string().max(200000).optional().nullable(),
  copingPatternsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterTraumaProfileUpdateSchema = characterTraumaProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterConsequenceMemoryProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  punishmentMemory: emptyToUndefInt(int0_100.optional()),
  protectionMemory: emptyToUndefInt(int0_100.optional()),
  betrayalMemory: emptyToUndefInt(int0_100.optional()),
  rewardConditioning: emptyToUndefInt(int0_100.optional()),
  exposureLearning: emptyToUndefInt(int0_100.optional()),
  learnedRulesJson: z.string().max(200000).optional().nullable(),
  avoidancePatternsJson: z.string().max(200000).optional().nullable(),
  reinforcementPatternsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterConsequenceMemoryProfileUpdateSchema = characterConsequenceMemoryProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterRumorReputationProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  publicTrust: emptyToUndefInt(int0_100.optional()),
  suspicionLoad: emptyToUndefInt(int0_100.optional()),
  scandalRisk: emptyToUndefInt(int0_100.optional()),
  narrativeControl: emptyToUndefInt(int0_100.optional()),
  rumorExposure: emptyToUndefInt(int0_100.optional()),
  reputationThemesJson: z.string().max(200000).optional().nullable(),
  vulnerableNarrativesJson: z.string().max(200000).optional().nullable(),
  protectiveNarrativesJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterRumorReputationProfileUpdateSchema = characterRumorReputationProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const worldEducationNormProfileUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  label: z.string().min(1).max(500),
  childTrainingModelJson: z.string().max(200000).optional().nullable(),
  youthInitiationModelJson: z.string().max(200000).optional().nullable(),
  elderTransmissionModeJson: z.string().max(200000).optional().nullable(),
  literacyAccessPatternJson: z.string().max(200000).optional().nullable(),
  specialistTrainingPathsJson: z.string().max(200000).optional().nullable(),
  genderedTrainingDifferencesJson: z.string().max(200000).optional().nullable(),
  eliteKnowledgeAccess: emptyToUndefInt(int0_100.optional()),
  commonKnowledgeAccess: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldEducationNormProfileUpdateSchema = worldEducationNormProfileUpsertSchema
  .omit({ worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterEducationProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  primaryTrainingMode: optTrainingMode,
  literacyLevel: emptyToUndefInt(int0_100.optional()),
  numeracyLevel: emptyToUndefInt(int0_100.optional()),
  oralTraditionDepth: emptyToUndefInt(int0_100.optional()),
  ecologicalKnowledgeDepth: emptyToUndefInt(int0_100.optional()),
  institutionalSchoolingAccess: emptyToUndefInt(int0_100.optional()),
  apprenticeshipDomainsJson: z.string().max(200000).optional().nullable(),
  religiousInstructionDepth: emptyToUndefInt(int0_100.optional()),
  strategicTrainingDepth: emptyToUndefInt(int0_100.optional()),
  historicalAwarenessRange: emptyToUndefInt(int0_100.optional()),
  languageExposureJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterEducationProfileUpdateSchema = characterEducationProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterLearningEnvelopeUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  trainedCapacity: emptyToUndefInt(int0_100.optional()),
  expressiveCapacity: emptyToUndefInt(int0_100.optional()),
  pressureDistortion: emptyToUndefInt(int0_100.optional()),
  learnedAvoidance: emptyToUndefInt(int0_100.optional()),
  socialRiskAdjustedDisclosure: emptyToUndefInt(int0_100.optional()),
  summaryJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterLearningEnvelopeUpdateSchema = characterLearningEnvelopeUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const worldHealthNormProfileUpsertSchema = z.object({
  worldStateId: z.string().cuid(),
  label: z.string().min(1).max(500),
  bodyInterpretationModelJson: z.string().max(200000).optional().nullable(),
  mindInterpretationModelJson: z.string().max(200000).optional().nullable(),
  emotionInterpretationModelJson: z.string().max(200000).optional().nullable(),
  healingSystemsJson: z.string().max(200000).optional().nullable(),
  stigmaPatternsJson: z.string().max(200000).optional().nullable(),
  communityCareCapacity: emptyToUndefInt(int0_100.optional()),
  institutionalCareCapacity: emptyToUndefInt(int0_100.optional()),
  survivalBurden: emptyToUndefInt(int0_100.optional()),
  restPossibility: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const worldHealthNormProfileUpdateSchema = worldHealthNormProfileUpsertSchema
  .omit({ worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterPhysicalHealthProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  injuryLoad: emptyToUndefInt(int0_100.optional()),
  chronicPainLoad: emptyToUndefInt(int0_100.optional()),
  illnessBurden: emptyToUndefInt(int0_100.optional()),
  nutritionStatus: emptyToUndefInt(int0_100.optional()),
  sleepQuality: emptyToUndefInt(int0_100.optional()),
  enduranceCapacity: emptyToUndefInt(int0_100.optional()),
  mobilityLimitationLoad: emptyToUndefInt(int0_100.optional()),
  reproductiveBurden: emptyToUndefInt(int0_100.optional()),
  agingBurden: emptyToUndefInt(int0_100.optional()),
  recoveryCapacity: emptyToUndefInt(int0_100.optional()),
  sensoryLimitationsJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterPhysicalHealthProfileUpdateSchema = characterPhysicalHealthProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterMentalHealthProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  attentionStability: emptyToUndefInt(int0_100.optional()),
  clarityLevel: emptyToUndefInt(int0_100.optional()),
  intrusiveThoughtLoad: emptyToUndefInt(int0_100.optional()),
  dissociationTendency: emptyToUndefInt(int0_100.optional()),
  vigilanceLevel: emptyToUndefInt(int0_100.optional()),
  despairLoad: emptyToUndefInt(int0_100.optional()),
  controlCompulsion: emptyToUndefInt(int0_100.optional()),
  moodInstability: emptyToUndefInt(int0_100.optional()),
  stressTolerance: emptyToUndefInt(int0_100.optional()),
  realityCoherence: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterMentalHealthProfileUpdateSchema = characterMentalHealthProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterEmotionalHealthProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  emotionalRange: emptyToUndefInt(int0_100.optional()),
  suppressionLoad: emptyToUndefInt(int0_100.optional()),
  griefSaturation: emptyToUndefInt(int0_100.optional()),
  shameSaturation: emptyToUndefInt(int0_100.optional()),
  tendernessAccess: emptyToUndefInt(int0_100.optional()),
  angerRegulation: emptyToUndefInt(int0_100.optional()),
  fearCarryover: emptyToUndefInt(int0_100.optional()),
  relationalOpenness: emptyToUndefInt(int0_100.optional()),
  recoveryAfterDistress: emptyToUndefInt(int0_100.optional()),
  emotionalNumbnessLoad: emptyToUndefInt(int0_100.optional()),
  emotionalFloodingLoad: emptyToUndefInt(int0_100.optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterEmotionalHealthProfileUpdateSchema = characterEmotionalHealthProfileUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });

export const characterHealthEnvelopeUpsertSchema = z.object({
  personId: z.string().cuid(),
  worldStateId: z.string().cuid(),
  functionalCapacity: emptyToUndefInt(int0_100.optional()),
  careAccess: emptyToUndefInt(int0_100.optional()),
  visibleHealthPresentationJson: z.string().max(200000).optional().nullable(),
  hiddenHealthBurdenJson: z.string().max(200000).optional().nullable(),
  socialInterpretationJson: z.string().max(200000).optional().nullable(),
  simulationLayerJson: z.string().max(200000).optional().nullable(),
  worldFacingHealthNarrativeJson: z.string().max(200000).optional().nullable(),
  summaryJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const characterHealthEnvelopeUpdateSchema = characterHealthEnvelopeUpsertSchema
  .omit({ personId: true, worldStateId: true })
  .extend({ id: z.string().cuid() });
