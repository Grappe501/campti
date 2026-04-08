"use server";

import type { ReaderImprintEntityType, ReaderImprintKind, ReaderLastMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordReaderImprint, refreshReaderEmotionalFields } from "@/lib/reader-memory";
import { getCamptiSessionId } from "@/lib/campti-session";

function clampWeight(w: number): number {
  return Math.min(5, Math.max(1, Math.round(w)));
}

export async function syncReaderStateFromClient(payload: {
  sessionId?: string | null;
  lastSceneId: string;
  lastMetaSceneId?: string | null;
  lastCharacterId?: string | null;
  lastPlaceId?: string | null;
  lastSymbolId?: string | null;
  lastMode?: ReaderLastMode | null;
  scrollAnchorY?: number | null;
  rhythmAuto?: boolean | null;
  continuationHeadline?: string | null;
  lastScrollKey?: string | null;
}): Promise<void> {
  const sid = (payload.sessionId?.trim() || (await getCamptiSessionId()) || "").trim();
  if (!sid) return;

  await prisma.readerState.upsert({
    where: { sessionId: sid },
    create: {
      sessionId: sid,
      lastSceneId: payload.lastSceneId,
      lastMetaSceneId: payload.lastMetaSceneId ?? null,
      lastCharacterId: payload.lastCharacterId ?? null,
      lastPlaceId: payload.lastPlaceId ?? null,
      lastSymbolId: payload.lastSymbolId ?? null,
      lastMode: payload.lastMode ?? undefined,
      scrollAnchorY: payload.scrollAnchorY ?? null,
      rhythmAuto: payload.rhythmAuto ?? true,
      continuationHeadline: payload.continuationHeadline ?? null,
      lastScrollKey: payload.lastScrollKey ?? null,
      lastInteractionAt: new Date(),
    },
    update: {
      lastSceneId: payload.lastSceneId,
      lastMetaSceneId: payload.lastMetaSceneId ?? null,
      lastCharacterId: payload.lastCharacterId ?? null,
      lastPlaceId: payload.lastPlaceId ?? null,
      lastSymbolId: payload.lastSymbolId ?? null,
      lastMode: payload.lastMode ?? undefined,
      scrollAnchorY: payload.scrollAnchorY ?? undefined,
      rhythmAuto: payload.rhythmAuto ?? undefined,
      continuationHeadline:
        payload.continuationHeadline !== undefined
          ? payload.continuationHeadline
          : undefined,
      lastScrollKey: payload.lastScrollKey !== undefined ? payload.lastScrollKey : undefined,
      lastInteractionAt: new Date(),
    },
  });
  await refreshReaderEmotionalFields(sid);
}

export async function recordReaderImprintAction(input: {
  sessionId?: string | null;
  entityType: ReaderImprintEntityType;
  entityId: string;
  imprintType: ReaderImprintKind;
  weight: number;
  notes?: string | null;
}): Promise<void> {
  const sid = (input.sessionId?.trim() || (await getCamptiSessionId()) || "").trim();
  if (!sid) return;
  await recordReaderImprint({
    sessionId: sid,
    entityType: input.entityType,
    entityId: input.entityId,
    imprintType: input.imprintType,
    weight: clampWeight(input.weight),
    notes: input.notes,
  });
}

export async function recordVoiceListenSeconds(input: {
  sessionId?: string | null;
  personId: string;
  deltaSeconds: number;
}): Promise<void> {
  const sid = (input.sessionId?.trim() || (await getCamptiSessionId()) || "").trim();
  const pid = input.personId.trim();
  if (!sid || !pid || input.deltaSeconds <= 0) return;
  const add = Math.min(120, Math.round(input.deltaSeconds));
  await prisma.readerVoiceListen.upsert({
    where: { sessionId_personId: { sessionId: sid, personId: pid } },
    create: {
      sessionId: sid,
      personId: pid,
      totalListenSeconds: add,
      lastListenAt: new Date(),
    },
    update: {
      totalListenSeconds: { increment: add },
      lastListenAt: new Date(),
    },
  });
}

/** Server-only: session from cookie when client omits id (e.g. future forms). */
export async function getSessionIdForRequest(): Promise<string | null> {
  return getCamptiSessionId();
}
