import { z } from "zod";

export const canonicalEntityTypeSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (v) =>
      [
        "person",
        "place",
        "event",
        "symbol",
        "claim",
        "chapter",
        "question",
        "openQuestion",
        "continuity",
        "continuityNote",
      ].includes(v),
    { message: "Unsupported canonical entity type" },
  );

export const extractedEntityIdSchema = z.object({
  extractedEntityId: z.string().trim().min(1),
});

export const linkActionSchema = z.object({
  extractedEntityId: z.string().trim().min(1),
  canonicalType: canonicalEntityTypeSchema,
  canonicalId: z.string().trim().min(1),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v == null ? null : String(v).trim() || null)),
  reviewedByNote: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v == null ? null : String(v).trim() || null)),
  createAlias: z
    .union([z.literal("1"), z.literal("0"), z.boolean(), z.undefined(), z.null()])
    .optional()
    .transform((v) => (v === true || v === "1" ? true : false)),
});

export const searchCanonicalSchema = z.object({
  type: canonicalEntityTypeSchema,
  query: z.string().trim().min(1).max(200),
});

