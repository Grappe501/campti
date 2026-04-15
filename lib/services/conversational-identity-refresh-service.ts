/**
 * P2-P — Session-aware refresh on top of {@link buildConversationalIdentitySnapshot}.
 *
 * Optionally attaches a **small, deterministic** `sessionContext` (recent turn one-liners + session id/status).
 * Relationship memory remains **P2-G** only; there is no global transcript or LLM summarization.
 */

import type {
  ConversationalIdentitySessionContext,
  ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import type { NarrativeSource } from "@/lib/domain/narrative-source";
import { buildConversationalIdentitySnapshot } from "@/lib/conversational-identity/build-conversational-identity-snapshot";
import { listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import { deriveReaderRelationshipProgression } from "@/lib/services/reader-relationship-progression-service";
import { readSessionMemorySummaryFromMetadata } from "@/lib/services/session-memory-compression-service";
import { prisma } from "@/lib/prisma";

export const DEFAULT_MAX_SESSION_TURN_LINES = 8;
const MAX_TURN_LINE_CHARS = 120;

export type RefreshConversationalIdentityParams = {
  characterId: string;
  readerId: string;
  sceneId?: string | null;
  narrativeSourcesForScene?: NarrativeSource[];
  /** When set, validates session belongs to this character+reader and attaches bounded turn lines. */
  sessionId?: string | null;
  /** Cap on recent turn lines (default {@link DEFAULT_MAX_SESSION_TURN_LINES}, hard max 12). */
  maxRecentTurnLines?: number;
};

function truncateLine(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Deterministic one-line summary for a persisted turn (no LLM). Uses only contract fields when present.
 */
export function formatBoundedTurnSummary(input: {
  speakerType: "reader" | "character";
  orderIndex: number;
  payloadJson: unknown;
}): string {
  const tag = input.speakerType === "reader" ? "reader" : "character";
  const p = input.payloadJson;
  if (p != null && typeof p === "object" && !Array.isArray(p)) {
    const o = p as Record<string, unknown>;
    if (input.speakerType === "reader") {
      const rt = o.readerText;
      if (typeof rt === "string" && rt.trim()) {
        return `[${tag} #${input.orderIndex}] ${truncateLine(rt, MAX_TURN_LINE_CHARS)}`;
      }
    } else {
      const sp = o.spokenResponse;
      if (typeof sp === "string" && sp.trim()) {
        return `[${tag} #${input.orderIndex}] ${truncateLine(sp, MAX_TURN_LINE_CHARS)}`;
      }
    }
  }
  return `[${tag} #${input.orderIndex}]`;
}

/**
 * Build a conversational identity snapshot, optionally layering bounded session context.
 */
export async function refreshConversationalIdentitySnapshot(
  params: RefreshConversationalIdentityParams
): Promise<ConversationalIdentitySnapshot> {
  const base = await buildConversationalIdentitySnapshot({
    characterId: params.characterId,
    readerId: params.readerId,
    sceneId: params.sceneId,
    narrativeSourcesForScene: params.narrativeSourcesForScene,
  });

  const sid = params.sessionId?.trim() ? params.sessionId.trim() : null;
  if (!sid) {
    return { ...base, sessionContext: null };
  }

  const session = await prisma.characterConversationSession.findFirst({
    where: {
      id: sid,
      characterId: base.characterId,
      readerId: base.readerId,
    },
  });

  if (!session) {
    throw new Error(
      `[conversational-identity-refresh] Session not found or not bound to this character/reader: ${sid}`
    );
  }

  const maxLines = Math.min(12, Math.max(1, params.maxRecentTurnLines ?? DEFAULT_MAX_SESSION_TURN_LINES));
  const turns = await listSessionTurnsOrdered(sid);
  const slice = turns.slice(-maxLines);
  const recentTurnSummaries = slice.map((t) =>
    formatBoundedTurnSummary({
      speakerType: t.speakerType,
      orderIndex: t.orderIndex,
      payloadJson: t.payloadJson,
    })
  );

  const sessionMemorySummary = readSessionMemorySummaryFromMetadata(session.metadataJson);
  const sessionContext: ConversationalIdentitySessionContext = {
    sessionId: session.id,
    sessionStatus: session.status,
    readerMemoryInteractionCount: base.readerMemory?.interactionCount ?? null,
    recentTurnSummaries,
    sessionMemorySummaryHash: sessionMemorySummary?.latestSessionSummaryHash ?? null,
  };

  return {
    ...base,
    readerRelationshipProgression: deriveReaderRelationshipProgression({
      readerMemory: base.readerMemory,
      sessionMemorySummary,
    }),
    sessionContext,
  };
}
