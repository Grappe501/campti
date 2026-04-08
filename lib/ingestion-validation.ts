import { z } from "zod";

export const ingestionRunCreateSchema = z.object({
  sourceId: z.string().trim().min(1),
  status: z.enum([
    "queued",
    "processing",
    "parsed",
    "extracted",
    "reviewed",
    "failed",
  ]),
  runType: z
    .enum(["manual", "test", "ai_prepare", "openai"])
    .optional()
    .nullable(),
  modelName: z.string().trim().optional().nullable(),
  promptVersion: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const sourceTextUpdateSchema = z.object({
  sourceId: z.string().trim().min(1),
  rawText: z.string().optional().nullable(),
  textNotes: z.string().trim().optional().nullable(),
  textStatus: z
    .enum(["none", "imported", "normalized", "reviewed"])
    .optional()
    .nullable(),
});

export const extractionPacketUpsertSchema = z.object({
  ingestionRunId: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  readyForAI: z.boolean().optional(),
});

export const mockExtractionResultSchema = z.object({
  sourceId: z.string().trim().min(1),
  ingestionRunId: z.string().trim().min(1),
  status: z.enum(["draft", "reviewed", "approved", "rejected"]).default("draft"),
});

export const extractedEntityReviewSchema = z.object({
  id: z.string().trim().min(1),
  reviewStatus: z.enum(["pending", "approved", "rejected", "merged"]),
  reviewerNotes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v === undefined || v === null ? undefined : String(v).trim() || undefined)),
  matchedRecordId: z.string().trim().optional().nullable(),
  matchedRecordType: z.string().trim().optional().nullable(),
});

export const ingestionSourceIdSchema = z.object({
  sourceId: z.string().trim().min(1),
});

export const ingestionRunIdSchema = z.object({
  id: z.string().trim().min(1),
});

export const extractedEntityIdSchema = z.object({
  id: z.string().trim().min(1),
});
