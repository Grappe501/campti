/**
 * P2-T — Assigned speech/TTS voice for a character (provider + external id).
 *
 * **Naming:** Prose “voice” texture lives on Prisma `CharacterVoiceProfile` (diction, rhythm). This
 * domain type mirrors **`CharacterTtsVoiceProfile`** — external synthesis voice binding only.
 */

import type { Prisma } from "@prisma/client";

/** Matches {@link CharacterVoiceProviderKind} (Prisma). */
export type CharacterVoiceProvider = "elevenlabs" | "other";

/**
 * One row per character: which external voice to use for TTS. No provider API calls here.
 */
export type CharacterVoiceProfileAssignment = {
  id: string;
  characterId: string;
  provider: CharacterVoiceProvider;
  externalVoiceId: string;
  displayLabel: string;
  emotionalRangeJson: Prisma.JsonValue | null;
  metadataJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CharacterWithVoiceProfile = {
  characterId: string;
  /** `Person.name` when joined. */
  characterName: string | null;
  voiceProfile: CharacterVoiceProfileAssignment;
};
