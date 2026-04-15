/**
 * P2-T — Persisted TTS / speech voice assignment per character ({@link CharacterTtsVoiceProfile}).
 * Assignment and retrieval only; no ElevenLabs or other provider HTTP calls.
 */

import type { CharacterTtsVoiceProfile, CharacterVoiceProviderKind } from "@prisma/client";

import type {
  CharacterVoiceProfileAssignment,
  CharacterWithVoiceProfile,
  CharacterVoiceProvider,
} from "@/lib/domain/character-voice-profile";
import { prisma } from "@/lib/prisma";

function providerToDomain(p: CharacterVoiceProviderKind): CharacterVoiceProvider {
  return p === "elevenlabs" ? "elevenlabs" : "other";
}

function toAssignment(row: CharacterTtsVoiceProfile): CharacterVoiceProfileAssignment {
  return {
    id: row.id,
    characterId: row.characterId,
    provider: providerToDomain(row.provider),
    externalVoiceId: row.externalVoiceId,
    displayLabel: row.displayLabel,
    emotionalRangeJson: row.emotionalRangeJson,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type UpsertCharacterVoiceProfileParams = {
  characterId: string;
  provider: CharacterVoiceProvider;
  externalVoiceId: string;
  displayLabel: string;
  emotionalRangeJson?: unknown | null;
  metadataJson?: unknown | null;
};

/**
 * Create or replace the voice assignment for this character (unique on `characterId`).
 */
export async function upsertCharacterVoiceProfile(
  params: UpsertCharacterVoiceProfileParams
): Promise<CharacterVoiceProfileAssignment> {
  const cid = params.characterId.trim();
  if (!cid) throw new Error("[character-voice-profile] characterId is required.");
  const ext = params.externalVoiceId.trim();
  if (!ext) throw new Error("[character-voice-profile] externalVoiceId is required.");
  const label = params.displayLabel.trim();
  if (!label) throw new Error("[character-voice-profile] displayLabel is required.");

  const provider: CharacterVoiceProviderKind =
    params.provider === "elevenlabs" ? "elevenlabs" : "other";

  const row = await prisma.characterTtsVoiceProfile.upsert({
    where: { characterId: cid },
    create: {
      characterId: cid,
      provider,
      externalVoiceId: ext,
      displayLabel: label,
      emotionalRangeJson: params.emotionalRangeJson ?? undefined,
      metadataJson: params.metadataJson ?? undefined,
    },
    update: {
      provider,
      externalVoiceId: ext,
      displayLabel: label,
      emotionalRangeJson: params.emotionalRangeJson ?? undefined,
      metadataJson: params.metadataJson ?? undefined,
    },
  });

  return toAssignment(row);
}

/** Returns the assignment for this character, or null if none. */
export async function getCharacterVoiceProfile(
  characterId: string
): Promise<CharacterVoiceProfileAssignment | null> {
  const cid = characterId.trim();
  if (!cid) return null;
  const row = await prisma.characterTtsVoiceProfile.findUnique({
    where: { characterId: cid },
  });
  return row ? toAssignment(row) : null;
}

/**
 * All characters that have a TTS voice assignment, with display name from `Person`.
 */
export async function listCharactersWithVoiceProfiles(): Promise<CharacterWithVoiceProfile[]> {
  const rows = await prisma.characterTtsVoiceProfile.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      character: {
        select: { id: true, name: true },
      },
    },
  });

  return rows.map((r) => ({
    characterId: r.characterId,
    characterName: r.character.name,
    voiceProfile: toAssignment(r),
  }));
}
