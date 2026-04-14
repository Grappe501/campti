/**
 * P2-G — **Per-character reader relationship memory** (foundational layer for future conversational identity).
 *
 * Each row is **exactly one character’s** memory of **exactly one reader** (`characterId` + `readerId`).
 * This must **never** become a cross-character global reader knowledge cache: there is no shared “reader
 * profile” table here—only relationship-bounded rows. Characters learn about a reader only through direct
 * interaction paths that call this service; no omniscient assembly from marketing, analytics, or narrative
 * corpora into `knownFacts`.
 *
 * **Rules enforced here**
 * - Memory is per `(characterId, readerId)` only (`@@unique`); no cross-character leakage.
 * - `knownFacts` / `relationshipNotes` store **interaction-earned** material only (callers must not sync
 *   external user dossiers wholesale).
 * - Familiarity grows **incrementally** via `updateMemoryAfterInteraction` (and bounded manual nudges via
 *   `incrementFamiliarityWithinBounds`); it does not jump to max in one call.
 *
 * **Not in scope for this module:** full transcript engine, UI, billing, or global `User` profile modeling.
 */

import type { Prisma } from "@prisma/client";

import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import {
  clampFamiliarityLevel,
  familiarityGainForInteraction,
  MAX_READER_RELATIONSHIP_FAMILIARITY,
} from "@/lib/domain/character-reader-memory";
import { prisma } from "@/lib/prisma";

function requireReaderId(readerId: string): void {
  if (!readerId.trim()) {
    throw new Error("readerId is required for CharacterReaderMemory (opaque reader key).");
  }
}

function isPrismaUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
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
  relationshipNotes: Prisma.JsonValue | null;
  firstInteractionAt: Date | null;
  lastInteractionAt: Date;
  metadataJson: Prisma.JsonValue | null;
}): CharacterReaderMemory {
  return {
    id: row.id,
    characterId: row.characterId,
    readerId: row.readerId,
    familiarityLevel: row.familiarityLevel,
    interactionCount: row.interactionCount,
    knownFacts: row.knownFacts,
    relationshipNotes: row.relationshipNotes,
    firstInteractionAt: row.firstInteractionAt,
    lastInteractionAt: row.lastInteractionAt,
    metadataJson: row.metadataJson,
  };
}

/**
 * Ensure a memory row exists for the pair (zeros / empty facts). Does **not** count as an interaction.
 * Use when attaching a session before the first `updateMemoryAfterInteraction`.
 */
export async function getOrCreateCharacterReaderMemory(
  characterId: string,
  readerId: string
): Promise<CharacterReaderMemory> {
  requireReaderId(readerId);

  const existing = await prisma.characterReaderMemory.findUnique({
    where: { characterId_readerId: { characterId, readerId } },
  });
  if (existing) {
    return toDomain(existing);
  }

  try {
    const row = await prisma.characterReaderMemory.create({
      data: {
        characterId,
        readerId,
        familiarityLevel: 0,
        interactionCount: 0,
        knownFacts: {},
        firstInteractionAt: null,
        lastInteractionAt: new Date(),
      },
    });
    return toDomain(row);
  } catch (e: unknown) {
    if (isPrismaUniqueViolation(e)) {
      const row = await prisma.characterReaderMemory.findUniqueOrThrow({
        where: { characterId_readerId: { characterId, readerId } },
      });
      return toDomain(row);
    }
    throw e;
  }
}

/** Load memory for the pair, or `null` if they have never had a row (including no get-or-create yet). */
export async function getCharacterReaderMemory(
  characterId: string,
  readerId: string
): Promise<CharacterReaderMemory | null> {
  requireReaderId(readerId);
  const row = await prisma.characterReaderMemory.findUnique({
    where: { characterId_readerId: { characterId, readerId } },
  });
  return row ? toDomain(row) : null;
}

/**
 * @deprecated Use {@link getCharacterReaderMemory} (same behavior).
 * Load memory for a reader↔character conversation. Returns `null` if they have never interacted
 * (caller should treat as stranger — no invented backstory).
 */
export async function getMemoryForConversation(
  characterId: string,
  readerId: string
): Promise<CharacterReaderMemory | null> {
  return getCharacterReaderMemory(characterId, readerId);
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
): Promise<CharacterReaderMemory> {
  const { characterId, readerId, knownFactsPatch } = input;
  requireReaderId(readerId);

  const existing = await prisma.characterReaderMemory.findUnique({
    where: { characterId_readerId: { characterId, readerId } },
  });

  const nextInteraction = (existing?.interactionCount ?? 0) + 1;
  const priorFam = existing?.familiarityLevel ?? 0;
  const delta = familiarityGainForInteraction(priorFam, nextInteraction);
  const nextFamiliarity = clampFamiliarityLevel(priorFam + delta);

  const mergedFacts = {
    ...jsonObject(existing?.knownFacts ?? {}),
    ...(knownFactsPatch && typeof knownFactsPatch === "object" ? knownFactsPatch : {}),
  } as Prisma.InputJsonValue;

  const now = new Date();

  const row = await prisma.characterReaderMemory.upsert({
    where: { characterId_readerId: { characterId, readerId } },
    create: {
      characterId,
      readerId,
      familiarityLevel: nextFamiliarity,
      interactionCount: nextInteraction,
      knownFacts: mergedFacts,
      firstInteractionAt: now,
      lastInteractionAt: now,
    },
    update: {
      interactionCount: nextInteraction,
      familiarityLevel: nextFamiliarity,
      knownFacts: mergedFacts,
      lastInteractionAt: now,
      firstInteractionAt: existing?.firstInteractionAt ?? now,
    },
  });

  return toDomain(row);
}

/**
 * Apply a bounded delta to familiarity without incrementing `interactionCount` (e.g. milestone rewards).
 * Result is always clamped to `[0, MAX_READER_RELATIONSHIP_FAMILIARITY]`.
 */
export async function incrementFamiliarityWithinBounds(
  characterId: string,
  readerId: string,
  delta: number
): Promise<CharacterReaderMemory> {
  requireReaderId(readerId);
  if (!Number.isFinite(delta)) {
    throw new Error("incrementFamiliarityWithinBounds: delta must be a finite number.");
  }

  const current = await getOrCreateCharacterReaderMemory(characterId, readerId);
  const next = clampFamiliarityLevel(current.familiarityLevel + delta);

  if (next === current.familiarityLevel) {
    return current;
  }

  const row = await prisma.characterReaderMemory.update({
    where: { id: current.id },
    data: {
      familiarityLevel: next,
      lastInteractionAt: new Date(),
    },
  });
  return toDomain(row);
}

export { MAX_READER_RELATIONSHIP_FAMILIARITY };
