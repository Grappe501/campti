/**
 * P2-U — Versioned wire for voice synthesis requests (provider boundary).
 *
 * Carries **which voice** (assignment), **how language is presented** (P2-S), **which provider**,
 * **output preferences**, and the **text** to speak. Persistence / queue payloads should validate
 * against {@link voiceSynthesisRequestSchemaV1} via the contract registry.
 */

import { z } from "zod";

export const VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION = "1" as const;

const characterPresentationModeSchema = z.object({
  cognitionLanguageCode: z.string().nullable(),
  readerPresentationLanguageCode: z.string(),
  translationApplied: z.boolean(),
  nativeTongueAvailable: z.boolean(),
});

const voicePerformanceProfileSchema = z.object({
  pauseStrategy: z.enum(["minimal", "measured", "dramatic"]),
  emphasisHints: z.array(z.string()),
  toneIntensityHint: z.enum(["low", "medium", "high"]),
  speakingStyleHints: z.array(z.string()),
  pronunciationGuidance: z.array(z.string()).optional(),
});

export const voiceSynthesisRequestSchemaV1 = z.object({
  contractVersion: z.literal(VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION),
  voiceProfile: z.object({
    assignmentId: z.string().min(1),
    characterId: z.string().min(1),
    provider: z.enum(["elevenlabs", "other"]),
    externalVoiceId: z.string().min(1),
    displayLabel: z.string().min(1),
    emotionalRangeJson: z.unknown().nullable().optional(),
  }),
  voicePresentationPayload: characterPresentationModeSchema,
  provider: z.enum(["elevenlabs", "other"]),
  outputFormat: z.object({
    format: z.enum(["mp3", "pcm_16le", "pcm_24le"]),
    sampleRateHz: z.number().finite().optional(),
    bitrateKbps: z.number().finite().optional(),
    channels: z.enum(["mono", "stereo"]).optional(),
  }),
  voicePerformanceProfile: voicePerformanceProfileSchema.optional(),
  text: z.string(),
});

export type VoiceSynthesisRequest = z.infer<typeof voiceSynthesisRequestSchemaV1>;

export type VoiceSynthesisVoiceProfile = VoiceSynthesisRequest["voiceProfile"];

export type VoiceSynthesisOutputFormatPreferences = VoiceSynthesisRequest["outputFormat"];
