import { z } from "zod";

export const ENNEAGRAM_TYPE_VALUES = [
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
] as const;

export const enneagramTypeSchema = z.enum(ENNEAGRAM_TYPE_VALUES).nullable().optional();

export const enneagramConfidenceSchema = z
  .number()
  .int()
  .min(1)
  .max(5)
  .nullable()
  .optional();

export const relationshipUpsertSchema = z.object({
  personAId: z.string().min(1),
  personBId: z.string().min(1),
  relationshipType: z.string().min(1),
  relationshipSummary: z.string().nullable().optional(),
  emotionalPattern: z.string().nullable().optional(),
  conflictPattern: z.string().nullable().optional(),
  attachmentPattern: z.string().nullable().optional(),
  powerDynamic: z.string().nullable().optional(),
  enneagramDynamic: z.string().nullable().optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const soulSuggestionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["suggested", "accepted", "rejected", "deferred"]),
  notes: z.string().nullable().optional(),
});

export const metaSceneIdSchema = z.object({
  metaSceneId: z.string().min(1),
});
