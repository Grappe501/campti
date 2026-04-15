import type { CharacterConversationSessionStatus, ReaderState } from "@prisma/client";

import type {
  ReaderContinuity,
  ReaderContinuityCacheSnapshot,
  ReaderContinuityDivergence,
  ReaderContinuityReconciliation,
} from "@/lib/domain/reader-continuity";
import { prisma } from "@/lib/prisma";

function normalizeTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseNarrativeResumeToken(metadataJson: unknown): string | null {
  if (!metadataJson || typeof metadataJson !== "object" || Array.isArray(metadataJson)) return null;
  const orchestration = (metadataJson as Record<string, unknown>).interactiveOrchestration;
  if (!orchestration || typeof orchestration !== "object" || Array.isArray(orchestration)) return null;
  const token = (orchestration as Record<string, unknown>).narrativeResumeToken;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

function toInteractionStatus(
  status: CharacterConversationSessionStatus | null
): ReaderContinuity["sessionLinkage"]["interactionSessionStatus"] {
  if (status === "ACTIVE" || status === "PAUSED" || status === "ENDED") return status;
  return "NONE";
}

export function buildReaderContinuityFromAuthority(input: {
  readerState: Pick<
    ReaderState,
    "sessionId" | "lastSceneId" | "lastMetaSceneId" | "lastScrollKey" | "scrollAnchorY" | "lastCharacterId" | "lastInteractionAt"
  > | null;
  interactionSession: {
    id: string;
    status: CharacterConversationSessionStatus;
    metadataJson: unknown;
  } | null;
}): ReaderContinuity {
  return {
    sourceOfTruth: "reader_state_db",
    position: {
      chapterId: normalizeTrimmed(input.readerState?.lastMetaSceneId),
      sceneId: normalizeTrimmed(input.readerState?.lastSceneId),
      scrollAnchorY: input.readerState?.scrollAnchorY ?? null,
      scrollKey: normalizeTrimmed(input.readerState?.lastScrollKey),
    },
    interactionAnchor: {
      activeCharacterId: normalizeTrimmed(input.readerState?.lastCharacterId),
      activeSessionId: normalizeTrimmed(input.interactionSession?.id),
      narrativeResumeToken: parseNarrativeResumeToken(input.interactionSession?.metadataJson ?? null),
    },
    sessionLinkage: {
      readerSessionId: normalizeTrimmed(input.readerState?.sessionId),
      interactionSessionId: normalizeTrimmed(input.interactionSession?.id),
      interactionSessionStatus: toInteractionStatus(input.interactionSession?.status ?? null),
    },
    lastInteractionAtIso: input.readerState?.lastInteractionAt?.toISOString() ?? null,
  };
}

export function computeContinuityDivergence(input: {
  continuity: ReaderContinuity;
  cache: ReaderContinuityCacheSnapshot | null;
}): ReaderContinuityDivergence {
  const sceneMismatch = Boolean(
    input.cache?.sceneId &&
      input.continuity.position.sceneId &&
      input.cache.sceneId !== input.continuity.position.sceneId
  );
  const chapterMismatch = Boolean(
    input.cache?.chapterId &&
      input.continuity.position.chapterId &&
      input.cache.chapterId !== input.continuity.position.chapterId
  );
  const cacheAheadOfDb = Boolean(
    input.cache?.sceneId &&
      !input.continuity.position.sceneId &&
      (!input.continuity.lastInteractionAtIso ||
        (input.cache.savedAtEpochMs ?? 0) > Date.parse(input.continuity.lastInteractionAtIso))
  );
  return {
    sceneMismatch,
    chapterMismatch,
    cacheAheadOfDb,
  };
}

export function reconcileContinuityAuthority(input: {
  continuity: ReaderContinuity;
  cache: ReaderContinuityCacheSnapshot | null;
  bootstrappedFromCache: boolean;
}): ReaderContinuityReconciliation {
  const divergence = computeContinuityDivergence({
    continuity: input.continuity,
    cache: input.cache,
  });
  if (!input.cache) {
    return {
      continuity: input.continuity,
      divergence,
      cacheDirective: {
        writeThrough: true,
        reason: "cache_empty",
      },
    };
  }
  if (input.bootstrappedFromCache) {
    return {
      continuity: input.continuity,
      divergence,
      cacheDirective: {
        writeThrough: true,
        reason: "bootstrapped_db_from_cache",
      },
    };
  }
  if (divergence.sceneMismatch || divergence.chapterMismatch || divergence.cacheAheadOfDb) {
    return {
      continuity: input.continuity,
      divergence,
      cacheDirective: {
        writeThrough: true,
        reason: "db_authority_overrode_cache",
      },
    };
  }
  return {
    continuity: input.continuity,
    divergence,
    cacheDirective: {
      writeThrough: false,
      reason: "already_in_sync",
    },
  };
}

export async function loadReaderContinuity(params: {
  sessionId: string;
  readerId?: string | null;
  userId?: string | null;
  cacheSnapshot?: ReaderContinuityCacheSnapshot | null;
}): Promise<ReaderContinuityReconciliation> {
  const sessionId = params.sessionId.trim();
  if (!sessionId) {
    throw new Error("[reader-continuity] sessionId is required.");
  }

  let readerState = await prisma.readerState.findUnique({
    where: { sessionId },
  });
  let bootstrappedFromCache = false;
  if (!readerState && params.cacheSnapshot) {
    readerState = await prisma.readerState.create({
      data: {
        sessionId,
        userId: normalizeTrimmed(params.userId),
        lastSceneId: normalizeTrimmed(params.cacheSnapshot.sceneId),
        lastMetaSceneId: normalizeTrimmed(params.cacheSnapshot.chapterId),
        continuationHeadline: normalizeTrimmed(params.cacheSnapshot.continuationHeadline),
        emotionalTrace: normalizeTrimmed(params.cacheSnapshot.mood),
        returnHook: normalizeTrimmed(params.cacheSnapshot.returnHookLine),
        scrollAnchorY: params.cacheSnapshot.scrollAnchorY ?? null,
        lastInteractionAt: params.cacheSnapshot.savedAtEpochMs
          ? new Date(params.cacheSnapshot.savedAtEpochMs)
          : new Date(),
      },
    });
    bootstrappedFromCache = true;
  }

  const interactionSession =
    params.readerId?.trim()
      ? await prisma.characterConversationSession.findFirst({
          where: { readerId: params.readerId.trim() },
          orderBy: [{ lastInteractionAt: "desc" }],
          select: {
            id: true,
            status: true,
            metadataJson: true,
          },
        })
      : null;

  const continuity = buildReaderContinuityFromAuthority({
    readerState,
    interactionSession,
  });
  return reconcileContinuityAuthority({
    continuity,
    cache: params.cacheSnapshot ?? null,
    bootstrappedFromCache,
  });
}
