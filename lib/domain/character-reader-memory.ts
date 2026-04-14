import type { Prisma } from "@prisma/client";

/**
 * P2-G domain contract (service + DB enforce boundaries):
 * - Memory is **per (characterId, readerId)** only — not a global reader profile.
 * - No cross-character leakage: each character’s row is independent (`@@unique` in Prisma).
 * - `ReaderKnownFacts` / stored JSON must reflect **direct interaction** only (callers must not bulk-import external dossiers).
 * - Familiarity moves only through {@link familiarityGainForInteraction} + {@link clampFamiliarityLevel} — gradual, capped.
 */

/** Maximum relationship familiarity (incremental trust / intimacy ceiling). */
export const MAX_READER_RELATIONSHIP_FAMILIARITY = 100;

/**
 * P2-G — Row shape for `CharacterReaderMemory`: **one row per (character, reader)**.
 * This is relationship memory only — not a global reader profile and not shared across characters.
 */
export type CharacterReaderMemory = {
  id: string;
  characterId: string;
  readerId: string;
  familiarityLevel: number;
  interactionCount: number;
  knownFacts: Prisma.JsonValue;
  relationshipNotes: Prisma.JsonValue | null;
  firstInteractionAt: Date | null;
  lastInteractionAt: Date;
  metadataJson: Prisma.JsonValue | null;
};

/** @deprecated Prefer {@link CharacterReaderMemory} — kept for existing imports. */
export type CharacterReaderMemoryDomain = CharacterReaderMemory;

/**
 * Bounded JSON bag for facts the character has learned about this reader in dialogue.
 * Keys should be stable slugs; values are small primitives or short strings (service enforces size policy later).
 */
export type ReaderKnownFacts = Record<string, unknown>;

export function clampFamiliarityLevel(
  level: number,
  max: number = MAX_READER_RELATIONSHIP_FAMILIARITY
): number {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(max, Math.floor(level)));
}

/**
 * Diminishing familiarity gain per completed interaction: stronger early, then mostly +1 with occasional +2.
 * Returns **increment** to add to prior familiarity (already capped against `max`).
 */
export function familiarityGainForInteraction(
  priorFamiliarity: number,
  interactionCountAfter: number,
  max: number = MAX_READER_RELATIONSHIP_FAMILIARITY
): number {
  if (priorFamiliarity >= max) return 0;
  let gain = 1;
  if (interactionCountAfter <= 5) gain = 2;
  else if (interactionCountAfter <= 20) gain = 1;
  else if (interactionCountAfter % 10 === 0) gain = 2;
  else gain = 1;
  return Math.min(gain, max - priorFamiliarity);
}
