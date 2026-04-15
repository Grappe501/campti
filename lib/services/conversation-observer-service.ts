/**
 * P2-R — Build {@link ConversationObservabilitySnapshot} for a persisted conversation session.
 * Observability only: no UI, no LLM calls.
 */

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import {
  CONVERSATION_OBSERVABILITY_CONTRACT_VERSION,
  type ConversationAnchorDriftSummary,
  type ConversationGuardrailAssessmentSnapshot,
  type ConversationObservabilitySnapshot,
  type ConversationReaderMemorySummary,
} from "@/lib/domain/conversation-observability";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import {
  compareSnapshotToAnchor,
  readConversationAnchorFromMetadata,
} from "@/lib/services/conversation-anchor-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import {
  mapConversationIdentitySummary,
  mapConversationSessionMetadata,
  mapConversationTurnObservability,
} from "@/lib/services/conversation-read-model-mapper";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";
import { summarizeDegradedInteractionState } from "@/lib/services/degraded-interaction-observability-service";
import { assessCharacterResponsePolicyViolations } from "@/lib/services/character-response-guardrail-service";
import { buildStorylineExplainabilitySummary } from "@/lib/services/storyline-explainability-service";
import { listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import { readSessionMemorySummaryFromMetadata } from "@/lib/services/session-memory-compression-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_MAX_RECENT_TURNS = 12;
const HARD_MAX_RECENT_TURNS = 24;

function isoNow(): string {
  return new Date().toISOString();
}

function summarizeReaderMemory(snapshot: ConversationalIdentitySnapshot): ConversationReaderMemorySummary | null {
  const m = snapshot.readerMemory;
  if (!m) return null;
  const kf = m.knownFacts;
  let knownFactsKeyCount = 0;
  if (kf && typeof kf === "object" && !Array.isArray(kf)) {
    knownFactsKeyCount = Object.keys(kf as Record<string, unknown>).length;
  }
  return {
    characterReaderMemoryId: m.id,
    familiarityLevel: m.familiarityLevel,
    interactionCount: m.interactionCount,
    knownFactsKeyCount,
    lastInteractionAtIso: m.lastInteractionAt.toISOString(),
  };
}

function toGuardrailSnapshot(
  a: ReturnType<typeof assessCharacterResponsePolicyViolations>
): ConversationGuardrailAssessmentSnapshot {
  return {
    pass: a.pass,
    violations: a.violations.map((v) => ({ code: v.code, message: v.message })),
    suggestedDowngradeAction: a.suggestedDowngradeAction,
  };
}

function latestCharacterGuardrailAssessment(
  identitySnapshot: ConversationalIdentitySnapshot,
  orderedTurns: CharacterConversationTurn[]
): ConversationGuardrailAssessmentSnapshot | null {
  for (let i = orderedTurns.length - 1; i >= 0; i--) {
    const t = orderedTurns[i];
    if (t.speakerType !== "character") continue;
    try {
      const cr = validateRegisteredContractPayload(
        "characterResponse",
        t.payloadJson as unknown as CharacterResponse,
        "read"
      );
      return toGuardrailSnapshot(assessCharacterResponsePolicyViolations({ snapshot: identitySnapshot, response: cr }));
    } catch {
      return null;
    }
  }
  return null;
}

function summarizeAnchorDrift(
  session: CharacterConversationSession,
  identitySnapshot: ConversationalIdentitySnapshot
): ConversationAnchorDriftSummary {
  const anchor = readConversationAnchorFromMetadata(session.metadataJson);
  if (!anchor) {
    return { anchorPresent: false, driftDetected: false, driftSignals: [] };
  }
  const compared = compareSnapshotToAnchor(identitySnapshot, anchor);
  return {
    anchorPresent: true,
    driftDetected: compared.driftDetected,
    driftSignals: compared.driftSignals,
  };
}

export type ComposeConversationObservabilitySnapshotParams = {
  session: CharacterConversationSession;
  identitySnapshot: ConversationalIdentitySnapshot;
  /** Ascending by `orderIndex` (as from {@link listSessionTurnsOrdered}). */
  orderedTurns: CharacterConversationTurn[];
  maxRecentTurns?: number;
};

/**
 * Pure assembly for tests and callers that already have session + identity + turns in memory.
 */
export function composeConversationObservabilitySnapshot(
  params: ComposeConversationObservabilitySnapshotParams
): ConversationObservabilitySnapshot {
  const { session, identitySnapshot, orderedTurns } = params;
  const max = Math.min(
    HARD_MAX_RECENT_TURNS,
    Math.max(1, params.maxRecentTurns ?? DEFAULT_MAX_RECENT_TURNS)
  );
  const slice = orderedTurns.slice(-max);
  const sessionMemorySummary = readSessionMemorySummaryFromMetadata(session.metadataJson);
  const recentCharacterTones = slice
    .filter((t) => t.speakerType === "character")
    .map((t) => {
      if (t.payloadJson == null || typeof t.payloadJson !== "object" || Array.isArray(t.payloadJson)) {
        return "";
      }
      const tone = (t.payloadJson as Record<string, unknown>).emotionalTone;
      return typeof tone === "string" ? tone : "";
    })
    .filter(Boolean);
  const emotionalContinuity = deriveConversationEmotionalContinuity({
    snapshot: identitySnapshot,
    sessionMemorySummary,
    recentCharacterTones,
  });
  const anchorDrift = summarizeAnchorDrift(session, identitySnapshot);
  const storylineExplainability = buildStorylineExplainabilitySummary({
    mode: "interaction_mode",
    channel: "reader_bond_dyad",
    seamId: `conversation-observer:${session.id}`,
    relationshipSignalCodes: [
      `session_status:${session.status}`,
      `interaction_count:${session.interactionCount}`,
      ...anchorDrift.driftSignals.slice(0, 2),
    ],
    emotionalContinuity,
  });

  return validateRegisteredContractPayload("conversationObservabilitySnapshot", {
    contractVersion: CONVERSATION_OBSERVABILITY_CONTRACT_VERSION,
    builtAtIso: isoNow(),
    conversationalIdentityBuiltAtIso: identitySnapshot.builtAtIso,
    session: mapConversationSessionMetadata(session),
    identitySummary: mapConversationIdentitySummary(identitySnapshot),
    readerMemorySummary: summarizeReaderMemory(identitySnapshot),
    policySummary: identitySnapshot.policy,
    recentTurns: mapConversationTurnObservability(slice),
    latestGuardrailAssessment: latestCharacterGuardrailAssessment(identitySnapshot, orderedTurns),
    conversationAnchorDrift: anchorDrift,
    sessionMemorySummaryHash: sessionMemorySummary?.latestSessionSummaryHash ?? null,
    emotionalContinuity,
    degradedInteraction: summarizeDegradedInteractionState(session.metadataJson),
    storylineExplainability,
  }, "write");
}

export type BuildConversationObservabilitySnapshotParams = {
  sessionId: string;
  maxRecentTurns?: number;
};

/**
 * Loads session + identity (session-scoped) + turns from persistence and composes observability.
 */
export async function buildConversationObservabilitySnapshot(
  params: BuildConversationObservabilitySnapshotParams
): Promise<ConversationObservabilitySnapshot> {
  const sid = params.sessionId.trim();
  if (!sid) {
    throw new Error("[conversation-observer] sessionId is required.");
  }

  const row = await prisma.characterConversationSession.findUnique({ where: { id: sid } });
  if (!row) {
    throw new Error(`[conversation-observer] Session not found: ${sid}`);
  }

  const session: CharacterConversationSession = {
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

  const identitySnapshot = await refreshConversationalIdentitySnapshot({
    characterId: session.characterId,
    readerId: session.readerId,
    sceneId: session.sceneId,
    sessionId: sid,
    maxRecentTurnLines: Math.min(
      HARD_MAX_RECENT_TURNS,
      Math.max(1, params.maxRecentTurns ?? DEFAULT_MAX_RECENT_TURNS)
    ),
  });

  const orderedTurns = await listSessionTurnsOrdered(sid);

  return composeConversationObservabilitySnapshot({
    session,
    identitySnapshot,
    orderedTurns,
    maxRecentTurns: params.maxRecentTurns,
  });
}
