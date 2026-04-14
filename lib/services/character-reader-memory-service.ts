/**
 * P2-G — Reader–character relationship memory.
 *
 * **Rules (non-negotiable for trust):**
 * - Memory is **only** learned through recorded interactions (`updateMemoryAfterInteraction`). There is no
 *   sync from global user profiles, marketing data, or narrative ingestion into `knownFacts`.
 * - Characters have **no omniscient knowledge of the reader** — only what this bounded row stores.
 * - Familiarity **grows slowly** with diminishing returns so relationship depth is earned over many turns.
 *
 * `readerId` is an **opaque application id** (e.g. authenticated `userId`, or a stable server-issued reader key).
 * It does not reference the `Person` table (readers are not in-world characters).
 */

import type { Prisma } from "@prisma/client";

import type { CharacterReaderMemoryDomain } from "@/lib/domain/character-reader-memory";
import { prisma } from "@/lib/prisma";

const MAX_FAMILIARITY = 100;

/** Diminishing familiarity gain: stronger early, then +1 with occasional +2 milestones. */
function computeFamiliarityIncrement(priorFamiliarity: number, interactionCountAfter: number): number {
  if (priorFamiliarity >= MAX_FAMILIARITY) return 0;
  let gain = 1;
  if (interactionCountAfter <= 5) gain = 2;
  else if (interactionCountAfter <= 20) gain = 1;
  else if (interactionCountAfter % 10 === 0) gain = 2;
  else gain = 1;
  return Math.min(gain, MAX_FAMILIARITY - priorFamiliarity);
}

function jsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function toDomain(row: {
  id: string;
  characterId: string;
  readerId: string;
  familiarityLevel: number;
  interactionCount: number;
  knownFacts: Prisma.JsonValue;
  lastInteractionAt: Date;
}): CharacterReaderMemoryDomain {
  return {
    id: row.id,
    characterId: row.characterId,
    readerId: row.readerId,
    familiarityLevel: row.familiarityLevel,
    interactionCount: row.interactionCount,
    knownFacts: row.knownFacts,
    lastInteractionAt: row.lastInteractionAt,
  };
}

export type UpdateMemoryAfterInteractionInput = {
  characterId: string;
  readerId: string;
  /** Top-level keys merged into `knownFacts` (interaction-derived only). */
  knownFactsPatch?: Record<string, unknown> | null;
};

/**
 * Record one interaction turn: increments count, nudges familiarity (capped), merges optional `knownFacts` patch.
 */
export async function updateMemoryAfterInteraction(
  input: UpdateMemoryAfterInteractionInput
): Promise<CharacterReaderMemoryDomain> {
  const { characterId, readerId, knownFactsPatch } = input;
  if (!readerId.trim()) {
    throw new Error("readerId is required for CharacterReaderMemory (opaque reader key).");
  }

  const existing = await prisma.characterReaderMemory.findUnique({
    where: { characterId_readerId: { characterId, readerId } },
  });

  const nextInteraction = (existing?.interactionCount ?? 0) + 1;
  const priorFam = existing?.familiarityLevel ?? 0;
  const delta = computeFamiliarityIncrement(priorFam, nextInteraction);
  const nextFamiliarity = Math.min(MAX_FAMILIARITY, priorFam + delta);

  const mergedFacts = {
    ...jsonObject(existing?.knownFacts ?? {}),
    ...(knownFactsPatch && typeof knownFactsPatch === "object" ? knownFactsPatch : {}),
  } as Prisma.InputJsonValue;

  const row = await prisma.characterReaderMemory.upsert({
    where: { characterId_readerId: { characterId, readerId } },
    create: {
      characterId,
      readerId,
      familiarityLevel: nextFamiliarity,
      interactionCount: nextInteraction,
      knownFacts: mergedFacts,
      lastInteractionAt: new Date(),
    },
    update: {
      interactionCount: nextInteraction,
      familiarityLevel: nextFamiliarity,
      knownFacts: mergedFacts,
      lastInteractionAt: new Date(),
    },
  });

  return toDomain(row);
}

/**
 * Load memory for a reader↔character conversation. Returns `null` if they have never interacted
 * (caller should treat as stranger — no invented backstory).
 */
export async function getMemoryForConversation(
  characterId: string,
  readerId: string
): Promise<CharacterReaderMemoryDomain | null> {
  if (!readerId.trim()) {
    throw new Error("readerId is required for CharacterReaderMemory (opaque reader key).");
  }
  const row = await prisma.characterReaderMemory.findUnique({
    where: { characterId_readerId: { characterId, readerId } },
  });
  return row ? toDomain(row) : null;
}
