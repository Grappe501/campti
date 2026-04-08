import { z } from "zod";

export const narrativeStylePresetSchema = z.enum([
  "restrained_historical",
  "immersive_literary",
  "editorial_interpretive",
  "embodied_minimal",
  "symbolic_dense",
  "cinematic_lyrical",
  "voice_forward",
  "audio_clean",
]);

export type NarrativeStylePreset = z.infer<typeof narrativeStylePresetSchema>;

export const narrativePassTypeSchema = z.enum([
  "opening",
  "interior",
  "environment",
  "relationship_pressure",
  "symbolic",
  "embodied",
  "full_structured",
]);

export type NarrativePassTypeValue = z.infer<typeof narrativePassTypeSchema>;

export const narrativePassStatusSchema = z.enum([
  "generated",
  "accepted",
  "revised",
  "rejected",
  "archived",
]);

export const metaSceneIdParamSchema = z.object({
  metaSceneId: z.string().min(1),
});

export const generatePassActionSchema = z.object({
  metaSceneId: z.string().min(1),
  passType: z.string().min(1).max(64),
  styleMode: z.string().max(64).optional().nullable(),
});

export const updatePassStatusSchema = z.object({
  passId: z.string().min(1),
  status: narrativePassStatusSchema,
  notes: z.string().max(8000).optional().nullable(),
});

export const deletePassSchema = z.object({
  passId: z.string().min(1),
});

export const enhanceMetaSceneSchema = z.object({
  metaSceneId: z.string().min(1),
  styleMode: narrativeStylePresetSchema.optional(),
});

export function clampConfidence(n: number | undefined | null): number | undefined {
  if (n == null || !Number.isFinite(n)) return undefined;
  return Math.min(5, Math.max(1, Math.round(n)));
}

const MAX_ENHANCED_TEXT = 48_000;

export function validateEnhancedDescriptionOutput(text: string): { ok: true; text: string } | { ok: false; error: string } {
  const t = text.trim();
  if (!t.length) return { ok: false, error: "Empty output." };
  if (t.length > MAX_ENHANCED_TEXT) return { ok: false, error: "Output too long." };
  return { ok: true, text: t };
}
