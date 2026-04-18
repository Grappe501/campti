/**
 * Cluster 8 — cognitive voice engine (how thought distorts / surfaces), not TTS binding.
 * **Naming:** Prisma `CharacterVoiceProfile` is prose texture from the DB; this module owns simulation voice.
 */

import { z } from "zod";

export type CharacterVoiceMode =
  | "public"
  | "private"
  | "intimate"
  | "defensive"
  | "dominant"
  | "suppressed";

export type CharacterVoiceProfile = {
  characterId: string;
  internalMonologueStyle: string;
  spokenDialogueStyle: string;
  silencePattern: string;
  deflectionPattern: string;
  emotionalExpressionStyle: string;
  metaphorDomain: string;
  cadenceProfile: string;
  vocabularyRange: "narrow" | "medium" | "wide";
  tabooBoundaries: string[];
  conflictSpeechPattern: string;
  intimacySpeechPattern: string;
  powerSpeechPattern: string;
  stressVoiceShiftPattern: string;
};

export type CharacterVoiceState = {
  characterId: string;
  currentVoiceMode: CharacterVoiceMode;
  stressLevel: number;
  relationalContext: string;
  truthVsMaskRatio: number;
};

/** Matches runtime artifact voice profile slice + domain `CharacterVoiceProfile`. */
export const CharacterVoiceProfileSchema = z.object({
  characterId: z.string().min(1),
  internalMonologueStyle: z.string(),
  spokenDialogueStyle: z.string(),
  silencePattern: z.string(),
  deflectionPattern: z.string(),
  emotionalExpressionStyle: z.string(),
  metaphorDomain: z.string(),
  cadenceProfile: z.string(),
  vocabularyRange: z.enum(["narrow", "medium", "wide"]),
  tabooBoundaries: z.array(z.string()),
  conflictSpeechPattern: z.string(),
  intimacySpeechPattern: z.string(),
  powerSpeechPattern: z.string(),
  stressVoiceShiftPattern: z.string(),
});
