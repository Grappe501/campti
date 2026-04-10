import {
  CharacterConstraintType,
  CharacterTriggerType,
  Prisma,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { z } from "zod";

const int0_100 = z.coerce.number().int().min(0).max(100);
const int1_5 = z.coerce.number().int().min(1).max(5);

const emptyToUndef = <T>(schema: z.ZodType<T>) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema);

const optionalInt0_100 = emptyToUndef(int0_100.optional());
const optionalInt1_5 = emptyToUndef(int1_5.optional());

const optText = (max: number) => z.string().max(max).optional().nullable();

/** Full character profile form (server action / admin mind). */
export const characterProfileUpsertFullSchema = z.object({
  personId: z.string().cuid(),
  worldview: optText(50000),
  coreBeliefsJson: z.string().max(200000).optional().nullable(),
  misbeliefsJson: z.string().max(200000).optional().nullable(),
  fearsJson: z.string().max(200000).optional().nullable(),
  desiresJson: z.string().max(200000).optional().nullable(),
  internalConflictsJson: z.string().max(200000).optional().nullable(),
  theologyFramework: optText(20000),
  roleArchetype: optText(500),
  narrativeFunction: optText(500),
  socialPosition: optText(5000),
  educationLevel: optText(2000),
  religiousContext: optText(20000),
  emotionalBaseline: optText(20000),
  behavioralPatterns: optText(20000),
  speechPatterns: optText(20000),
  memoryBias: optText(20000),
  sensoryBias: optText(20000),
  moralFramework: optText(20000),
  contradictions: optText(20000),
  notes: optText(50000),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: optText(500),
  enneagramType: z.string().max(32).optional().nullable(),
  enneagramWing: optText(200),
  enneagramConfidence: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? Number.parseInt(v, 10) : Number(v);
    return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : null;
  }, z.number().int().min(1).max(5).nullable().optional()),
  enneagramSource: optText(2000),
  stressPattern: optText(20000),
  growthPattern: optText(20000),
  defensiveStyle: optText(20000),
  coreLonging: optText(20000),
  coreFear: optText(20000),
  attentionBias: optText(20000),
  relationalStyle: optText(20000),
  conflictStyle: optText(20000),
  attachmentPattern: optText(20000),
  shameTrigger: optText(20000),
  angerPattern: optText(20000),
  griefPattern: optText(20000),
  controlPattern: optText(20000),
  notesOnTypeUse: optText(20000),
});

export const characterProfileUpsertSchema = characterProfileUpsertFullSchema.pick({
  personId: true,
  worldview: true,
  coreBeliefsJson: true,
  misbeliefsJson: true,
  fearsJson: true,
  desiresJson: true,
  internalConflictsJson: true,
  theologyFramework: true,
  roleArchetype: true,
  narrativeFunction: true,
  recordType: true,
  visibility: true,
  certainty: true,
});

export function parseProfileJsonField(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (raw === null || raw === undefined || raw.trim() === "") return Prisma.JsonNull;
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    return raw as unknown as Prisma.InputJsonValue;
  }
}

export const characterStateCreateSchema = z.object({
  personId: z.string().cuid(),
  label: z.string().max(200).optional().nullable(),
  sceneId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable().optional(),
  ),
  emotionalBaseline: z.string().max(20000).optional().nullable(),
  pressureLevel: z.string().max(200).optional().nullable(),
  trustLevel: optionalInt0_100,
  fearLevel: optionalInt0_100,
  stabilityLevel: optionalInt0_100,
  cognitiveLoad: optionalInt0_100,
  emotionalState: z.string().max(20000).optional().nullable(),
  motivation: z.string().max(20000).optional().nullable(),
  fearState: z.string().max(20000).optional().nullable(),
  knowledgeState: z.string().max(20000).optional().nullable(),
  physicalState: z.string().max(20000).optional().nullable(),
  socialConstraint: z.string().max(20000).optional().nullable(),
  notes: z.string().max(50000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
  worldStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable().optional(),
  ),
  environmentSnapshotJson: z.string().max(200000).optional().nullable(),
  powerContextJson: z.string().max(200000).optional().nullable(),
  economicContextJson: z.string().max(200000).optional().nullable(),
  socialContextJson: z.string().max(200000).optional().nullable(),
});

export const characterStateUpdateSchema = characterStateCreateSchema.extend({
  id: z.string().cuid(),
});

export const assignWorldStateToCharacterStateSchema = z.object({
  personId: z.string().cuid(),
  stateLabel: z.string().min(1).max(200),
  worldStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable(),
  ),
});

/** Partial JSON updates — only keys present in the form payload are applied server-side. */
export const updateCharacterWorldContextSchema = z.object({
  personId: z.string().cuid(),
  stateLabel: z.string().min(1).max(200),
  environmentSnapshotJson: z.string().max(200000).optional(),
  powerContextJson: z.string().max(200000).optional(),
  economicContextJson: z.string().max(200000).optional(),
  socialContextJson: z.string().max(200000).optional(),
});

export const characterConstraintCreateSchema = z.object({
  personId: z.string().cuid(),
  type: z.nativeEnum(CharacterConstraintType),
  description: z.string().min(1).max(20000),
  isHardConstraint: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
  notes: z.string().max(20000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
});

export const characterTriggerCreateSchema = z.object({
  personId: z.string().cuid(),
  triggerType: z.nativeEnum(CharacterTriggerType),
  description: z.string().min(1).max(20000),
  intensity: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 3 : v),
    int1_5,
  ),
  responsePattern: z.string().max(20000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
});

export const perceptionProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  sensoryBias: z.string().max(20000).optional().nullable(),
  attentionFocus: z.string().max(20000).optional().nullable(),
  blindSpotsJson: z.string().max(200000).optional().nullable(),
  interpretationStyle: z.string().max(20000).optional().nullable(),
  memoryReliability: z.string().max(20000).optional().nullable(),
  narrativePermissionKey: z.string().max(200).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
});

export const voiceProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  dictionLevel: z.string().max(2000).optional().nullable(),
  rhythmStyle: z.string().max(2000).optional().nullable(),
  metaphorStyle: z.string().max(2000).optional().nullable(),
  dialectNotes: z.string().max(20000).optional().nullable(),
  silencePatterns: z.string().max(20000).optional().nullable(),
  emotionalExpressionStyle: z.string().max(20000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
});

export const choiceProfileUpsertSchema = z.object({
  personId: z.string().cuid(),
  riskTolerance: optionalInt0_100,
  decisionSpeed: z.string().max(500).optional().nullable(),
  conflictStyle: z.string().max(2000).optional().nullable(),
  loyaltyPriorityJson: z.string().max(200000).optional().nullable(),
  selfPreservationBias: optionalInt0_100,
  moralRigidity: optionalInt0_100,
  notes: z.string().max(20000).optional().nullable(),
  recordType: z
    .union([z.nativeEnum(RecordType), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  visibility: z
    .union([z.nativeEnum(VisibilityStatus), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  certainty: z.string().max(500).optional().nullable(),
});
