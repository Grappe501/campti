/**
 * P2-M — Persisted reader–character conversation sessions (lifecycle only).
 *
 * No transcript blobs, no billing. Creating a new **ACTIVE** session ends any prior **ACTIVE** rows
 * for the same `(characterId, readerId)` so at most one active session exists per pair.
 */

import { Prisma, type CharacterConversationSessionStatus as PrismaSessionStatus } from "@prisma/client";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import { assertSessionMetadataPatchWriteBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { prisma } from "@/lib/prisma";

function requireIds(characterId: string, readerId: string): void {
  if (!characterId.trim()) throw new Error("characterId is required.");
  if (!readerId.trim()) throw new Error("readerId is required.");
}

function toDomain(row: {
  id: string;
  characterId: string;
  readerId: string;
  sceneId: string | null;
  status: PrismaSessionStatus;
  interactionCount: number;
  startedAt: Date;
  lastInteractionAt: Date;
  endedAt: Date | null;
  metadataJson: Prisma.JsonValue | null;
}): CharacterConversationSession {
  return {
    id: row.id,
    characterId: row.characterId,
    readerId: row.readerId,
    sceneId: row.sceneId,
    status: row.status as CharacterConversationSession["status"],
    interactionCount: row.interactionCount,
    startedAt: row.startedAt,
    lastInteractionAt: row.lastInteractionAt,
    endedAt: row.endedAt,
    metadataJson: row.metadataJson,
  };
}

export type CreateConversationSessionParams = {
  characterId: string;
  readerId: string;
  sceneId?: string | null;
  metadataJson?: Prisma.InputJsonValue | null;
};

export function normalizeCreateSessionMetadataInput(
  metadataJson: Prisma.InputJsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull | undefined {
  if (metadataJson === undefined) return undefined;
  if (metadataJson === null) return Prisma.JsonNull;
  if (typeof metadataJson !== "object" || Array.isArray(metadataJson)) {
    throw new Error("[character-conversation-session] metadataJson must be an object when provided.");
  }
  assertSessionMetadataPatchWriteBoundary({
    source: "reader_interaction_memory",
    patch: metadataJson as Record<string, unknown>,
    allowedTopLevelKeys: ["source"],
  });
  return metadataJson;
}

/**
 * End any ACTIVE sessions for this pair, then create a new ACTIVE session.
 */
export async function createConversationSession(
  params: CreateConversationSessionParams
): Promise<CharacterConversationSession> {
  const { characterId, readerId, sceneId, metadataJson } = params;
  requireIds(characterId, readerId);

  const now = new Date();

  await prisma.characterConversationSession.updateMany({
    where: {
      characterId,
      readerId,
      status: "ACTIVE",
    },
    data: {
      status: "ENDED",
      endedAt: now,
      lastInteractionAt: now,
    },
  });

  const row = await prisma.characterConversationSession.create({
    data: {
      characterId,
      readerId,
      sceneId: sceneId ?? null,
      status: "ACTIVE",
      interactionCount: 0,
      startedAt: now,
      lastInteractionAt: now,
      endedAt: null,
      metadataJson: normalizeCreateSessionMetadataInput(metadataJson),
    },
  });

  return toDomain(row);
}

/** Most recently touched ACTIVE session for the pair, if any. */
export async function getActiveConversationSession(
  characterId: string,
  readerId: string
): Promise<CharacterConversationSession | null> {
  requireIds(characterId, readerId);

  const row = await prisma.characterConversationSession.findFirst({
    where: {
      characterId,
      readerId,
      status: "ACTIVE",
    },
    orderBy: { lastInteractionAt: "desc" },
  });

  return row ? toDomain(row) : null;
}

export async function markConversationSessionPaused(sessionId: string): Promise<CharacterConversationSession> {
  const now = new Date();
  const row = await prisma.characterConversationSession.update({
    where: { id: sessionId },
    data: {
      status: "PAUSED",
      lastInteractionAt: now,
    },
  });
  return toDomain(row);
}

export async function markConversationSessionEnded(sessionId: string): Promise<CharacterConversationSession> {
  const now = new Date();
  const row = await prisma.characterConversationSession.update({
    where: { id: sessionId },
    data: {
      status: "ENDED",
      endedAt: now,
      lastInteractionAt: now,
    },
  });
  return toDomain(row);
}

export async function bumpSessionInteractionCount(
  sessionId: string,
  delta: number = 1
): Promise<CharacterConversationSession> {
  if (!Number.isFinite(delta) || delta < 1) {
    throw new Error("delta must be a finite number >= 1.");
  }
  const now = new Date();
  const row = await prisma.characterConversationSession.update({
    where: { id: sessionId },
    data: {
      interactionCount: { increment: Math.floor(delta) },
      lastInteractionAt: now,
    },
  });
  return toDomain(row);
}
