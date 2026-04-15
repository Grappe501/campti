/**
 * P2-X — Backend orchestration for **pause narration → converse → resume narration**.
 *
 * There is no UI, no audio engine, and no client playback control — only deterministic session + metadata
 * transitions and optional ledger rows. Narrative “position” is carried as opaque anchors in
 * `CharacterConversationSession.metadataJson` for clients to interpret.
 *
 * **Transcript:** reader/character lines are appended via {@link appendReaderTurn} / {@link appendCharacterTurn}
 * when turns exist — these lifecycle methods do not fabricate transcript rows.
 */

import { Prisma } from "@prisma/client";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import { computeConversationAnchor, type ConversationAnchor } from "@/lib/services/conversation-anchor-service";
import { assertSessionMetadataPatchWriteBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { createLedgerEntry } from "@/lib/services/reader-interaction-ledger-service";
import {
  createConversationSession,
  markConversationSessionEnded,
} from "@/lib/services/character-conversation-session-service";
import { getOrCreateCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import { prisma } from "@/lib/prisma";

export const INTERACTIVE_ORCHESTRATION_VERSION = "1" as const;

/** Optional client bookmark when pausing long-form narration (scene-level; not validated against Scene rows here). */
export type NarrativePauseAnchor = {
  sceneId?: string | null;
  label?: string | null;
};

/** Stored under `metadataJson.interactiveOrchestration`. */
export type InteractiveOrchestrationState = {
  version: typeof INTERACTIVE_ORCHESTRATION_VERSION;
  /** Narration timeline is logically frozen from the product’s perspective. */
  narrativePaused: boolean;
  /** Reader ↔ character dialogue is the active mode. */
  conversationActive: boolean;
  /** ISO time when {@link pauseNarrativeForConversation} last succeeded. */
  narrativePausedAtIso?: string | null;
  /** ISO time when {@link resumeNarrativeAfterConversation} last succeeded. */
  narrativeResumedAtIso?: string | null;
  /** Opaque handle clients can stash for resume UI (deterministic, not a secret). */
  narrativeResumeToken: string;
  narrativeAnchor?: NarrativePauseAnchor | null;
};

/** Stored under `metadataJson.conversationAnchor` for drift detection across long sessions. */
export type ConversationAnchorMetadata = ConversationAnchor;

export type StartInteractivePauseSessionParams = {
  characterId: string;
  readerId: string;
  sceneId?: string | null;
  /** Bookmark for where narration was when the interactive slice started. */
  narrativeAnchor?: NarrativePauseAnchor | null;
};

export type SessionOrchestrationContext = {
  session: CharacterConversationSession;
  readerMemory: CharacterReaderMemory;
  orchestration: InteractiveOrchestrationState;
};

function isoNow(): string {
  return new Date().toISOString();
}

function parseRootMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (json != null && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

function readOrchestration(meta: Prisma.JsonValue | null): InteractiveOrchestrationState | null {
  const root = parseRootMetadata(meta);
  const raw = root.interactiveOrchestration;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== INTERACTIVE_ORCHESTRATION_VERSION) return null;
  if (typeof o.narrativeResumeToken !== "string" || !o.narrativeResumeToken) return null;
  return o as unknown as InteractiveOrchestrationState;
}

/** Exposed for tests and debug tooling — same shape as stored under `metadataJson.interactiveOrchestration`. */
export function getInteractiveOrchestrationState(
  metadataJson: Prisma.JsonValue | null
): InteractiveOrchestrationState | null {
  return readOrchestration(metadataJson);
}

function buildResumeToken(sessionId: string, sceneId: string | null): string {
  return `resume:${sessionId}:${sceneId?.trim() ? sceneId.trim() : "none"}`;
}

async function loadSessionOrThrow(
  sessionId: string,
  characterId: string,
  readerId: string
): Promise<{ row: CharacterConversationSession; orchestration: InteractiveOrchestrationState }> {
  const row = await prisma.characterConversationSession.findUnique({
    where: { id: sessionId.trim() },
  });
  if (!row) {
    throw new Error(`[interaction-session-orchestration] Session not found: ${sessionId}`);
  }
  if (row.characterId !== characterId || row.readerId !== readerId) {
    throw new Error("[interaction-session-orchestration] sessionId does not match characterId/readerId.");
  }
  const domain: CharacterConversationSession = {
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
  const orch = readOrchestration(row.metadataJson);
  if (!orch) {
    throw new Error(
      "[interaction-session-orchestration] Session has no interactiveOrchestration block — call startInteractivePauseSession first."
    );
  }
  return { row: domain, orchestration: orch };
}

async function persistOrchestration(
  sessionId: string,
  orchestration: InteractiveOrchestrationState,
  existingMetadata: Prisma.JsonValue | null,
  conversationAnchor?: ConversationAnchorMetadata | null
): Promise<CharacterConversationSession> {
  const patch: Record<string, unknown> = { interactiveOrchestration: orchestration };
  if (conversationAnchor) {
    patch.conversationAnchor = conversationAnchor;
  }
  assertSessionMetadataPatchWriteBoundary({
    source: "reader_interaction_memory",
    patch,
  });
  const root = parseRootMetadata(existingMetadata);
  root.interactiveOrchestration = orchestration;
  if (conversationAnchor) {
    root.conversationAnchor = conversationAnchor;
  }
  const updated = await prisma.characterConversationSession.update({
    where: { id: sessionId },
    data: {
      lastInteractionAt: new Date(),
      metadataJson: root as Prisma.InputJsonValue,
    },
  });
  return {
    id: updated.id,
    characterId: updated.characterId,
    readerId: updated.readerId,
    sceneId: updated.sceneId,
    status: updated.status as CharacterConversationSession["status"],
    interactionCount: updated.interactionCount,
    startedAt: updated.startedAt,
    lastInteractionAt: updated.lastInteractionAt,
    endedAt: updated.endedAt,
    metadataJson: updated.metadataJson,
  };
}

/**
 * Opens a fresh ACTIVE {@link CharacterConversationSession} for this pair (ends any prior ACTIVE)
 * and seeds orchestration metadata. Ensures P2-G reader memory exists.
 */
export async function startInteractivePauseSession(
  params: StartInteractivePauseSessionParams
): Promise<SessionOrchestrationContext> {
  const readerMemory = await getOrCreateCharacterReaderMemory(params.characterId, params.readerId);

  const session = await createConversationSession({
    characterId: params.characterId,
    readerId: params.readerId,
    sceneId: params.sceneId ?? null,
    metadataJson: {},
  });

  const token = buildResumeToken(session.id, session.sceneId ?? null);
  const orchestration: InteractiveOrchestrationState = {
    version: INTERACTIVE_ORCHESTRATION_VERSION,
    narrativePaused: false,
    conversationActive: false,
    narrativePausedAtIso: null,
    narrativeResumedAtIso: null,
    narrativeResumeToken: token,
    narrativeAnchor: params.narrativeAnchor ?? null,
  };

  const snapshot = await refreshConversationalIdentitySnapshot({
    characterId: params.characterId,
    readerId: params.readerId,
    sceneId: session.sceneId,
    sessionId: session.id,
  });
  const conversationAnchor = computeConversationAnchor(snapshot);

  const merged = await persistOrchestration(
    session.id,
    orchestration,
    session.metadataJson,
    conversationAnchor
  );

  return {
    session: merged,
    readerMemory,
    orchestration: readOrchestration(merged.metadataJson)!,
  };
}

export type PauseNarrativeForConversationParams = {
  sessionId: string;
  characterId: string;
  readerId: string;
};

/** Marks narration as paused and conversation as active; records a small ledger row (metering hook). */
export async function pauseNarrativeForConversation(
  params: PauseNarrativeForConversationParams
): Promise<SessionOrchestrationContext> {
  const { row, orchestration } = await loadSessionOrThrow(
    params.sessionId,
    params.characterId,
    params.readerId
  );
  if (row.status !== "ACTIVE") {
    throw new Error(
      `[interaction-session-orchestration] pauseNarrativeForConversation requires ACTIVE session, got "${row.status}".`
    );
  }
  if (orchestration.narrativePaused && orchestration.conversationActive) {
    const readerMemory = await getOrCreateCharacterReaderMemory(params.characterId, params.readerId);
    return { session: row, readerMemory, orchestration };
  }

  const now = isoNow();
  const next: InteractiveOrchestrationState = {
    ...orchestration,
    narrativePaused: true,
    conversationActive: true,
    narrativePausedAtIso: now,
  };

  const rowPrisma = await prisma.characterConversationSession.findUniqueOrThrow({
    where: { id: params.sessionId.trim() },
  });
  const merged = await persistOrchestration(params.sessionId.trim(), next, rowPrisma.metadataJson);

  await createLedgerEntry({
    readerId: params.readerId,
    sessionId: merged.id,
    entryType: "other",
    unitCount: 1,
    estimatedCostUnits: 1,
    metadataJson: { kind: "p2x_pause_narrative", atIso: now },
  });

  const readerMemory = await getOrCreateCharacterReaderMemory(params.characterId, params.readerId);
  return {
    session: merged,
    readerMemory,
    orchestration: readOrchestration(merged.metadataJson)!,
  };
}

export type ResumeNarrativeAfterConversationParams = {
  sessionId: string;
  characterId: string;
  readerId: string;
};

/** Clears narrative pause flags; session stays ACTIVE until {@link endInteractivePauseSession}. */
export async function resumeNarrativeAfterConversation(
  params: ResumeNarrativeAfterConversationParams
): Promise<SessionOrchestrationContext> {
  const { row, orchestration } = await loadSessionOrThrow(
    params.sessionId,
    params.characterId,
    params.readerId
  );
  if (row.status !== "ACTIVE") {
    throw new Error(
      `[interaction-session-orchestration] resumeNarrativeAfterConversation requires ACTIVE session, got "${row.status}".`
    );
  }
  if (!orchestration.narrativePaused) {
    throw new Error(
      "[interaction-session-orchestration] resumeNarrativeAfterConversation requires narrativePaused === true."
    );
  }

  const now = isoNow();
  const next: InteractiveOrchestrationState = {
    ...orchestration,
    narrativePaused: false,
    conversationActive: false,
    narrativeResumedAtIso: now,
  };

  const rowPrisma = await prisma.characterConversationSession.findUniqueOrThrow({
    where: { id: params.sessionId.trim() },
  });
  const merged = await persistOrchestration(params.sessionId.trim(), next, rowPrisma.metadataJson);

  await createLedgerEntry({
    readerId: params.readerId,
    sessionId: merged.id,
    entryType: "other",
    unitCount: 1,
    estimatedCostUnits: 1,
    metadataJson: { kind: "p2x_resume_narrative", atIso: now },
  });

  const readerMemory = await getOrCreateCharacterReaderMemory(params.characterId, params.readerId);
  return {
    session: merged,
    readerMemory,
    orchestration: readOrchestration(merged.metadataJson)!,
  };
}

export type EndInteractivePauseSessionParams = {
  sessionId: string;
  characterId: string;
  readerId: string;
};

/** Ends the conversation session (ENDED) and records a ledger marker. Does not require orchestration metadata. */
export async function endInteractivePauseSession(
  params: EndInteractivePauseSessionParams
): Promise<{ session: CharacterConversationSession; readerMemory: CharacterReaderMemory }> {
  const row = await prisma.characterConversationSession.findUnique({
    where: { id: params.sessionId.trim() },
  });
  if (!row) {
    throw new Error(`[interaction-session-orchestration] Session not found: ${params.sessionId}`);
  }
  if (row.characterId !== params.characterId || row.readerId !== params.readerId) {
    throw new Error("[interaction-session-orchestration] sessionId does not match characterId/readerId.");
  }

  const ended = await markConversationSessionEnded(params.sessionId.trim());

  await createLedgerEntry({
    readerId: params.readerId,
    sessionId: ended.id,
    entryType: "other",
    unitCount: 1,
    estimatedCostUnits: 1,
    metadataJson: { kind: "p2x_end_interactive", atIso: isoNow() },
  });

  const readerMemory = await getOrCreateCharacterReaderMemory(params.characterId, params.readerId);
  return { session: ended, readerMemory };
}
