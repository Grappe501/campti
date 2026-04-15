/**
 * P3-R — Author-only inspection entry. **Does not** widen bounded character epistemics for reader mode.
 */

import { NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION, NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE } from "@/lib/domain/narration-modes";
import type { Prisma } from "@prisma/client";
import type { AuthorialAccessMode } from "@/lib/domain/authorial-access";
import { AUTHORIAL_ACCESS_MODE } from "@/lib/domain/authorial-access";
import {
  AUTHOR_INSPECTION_PAYLOAD_CONTRACT_VERSION,
  type AuthorInspectionPayload,
} from "@/lib/domain/author-inspection-payload";
import type { ProductRole } from "@/lib/domain/role-permissions";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import {
  compareSnapshotToAnchor,
  readConversationAnchorFromMetadata,
} from "@/lib/services/conversation-anchor-service";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { canAccessAuthorMode } from "@/lib/services/permission-service";
import { buildStorylineExplainabilitySummary } from "@/lib/services/storyline-explainability-service";
import { prisma } from "@/lib/prisma";

export type AuthorialInspectionRequest = {
  mode: AuthorialAccessMode;
  characterId: string;
  sceneId: string | null;
  readerId?: string | null;
  sessionId?: string | null;
  /** Opaque author session / operator id for audit hooks (optional). */
  operatorId?: string | null;
  operatorRole?: ProductRole;
};

/**
 * Author/admin payload only. Never merge this into reader cockpit flows.
 */
export async function runAuthorialInspection(
  request: AuthorialInspectionRequest
): Promise<AuthorInspectionPayload> {
  void request.operatorId;
  const operatorRole = request.operatorRole ?? "author";
  if (!canAccessAuthorMode(operatorRole)) {
    throw new Error("[authorial-inspection] Unauthorized: author mode access denied for this role.");
  }
  const sessionId = request.sessionId?.trim() || null;
  let resolvedReaderId = request.readerId?.trim() || null;
  let sessionMetadata: Prisma.JsonValue | null = null;
  let latestInternalThought: string | null = null;

  if (sessionId) {
    const session = await prisma.characterConversationSession.findUnique({
      where: { id: sessionId },
      select: { id: true, readerId: true, characterId: true, metadataJson: true },
    });
    if (!session) {
      throw new Error(`[authorial-inspection] Session not found: ${sessionId}`);
    }
    if (session.characterId !== request.characterId) {
      throw new Error("[authorial-inspection] sessionId does not belong to requested characterId.");
    }
    resolvedReaderId = resolvedReaderId ?? session.readerId;
    sessionMetadata = session.metadataJson;
    const turns = await listSessionTurnsOrdered(session.id);
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.speakerType !== "character") continue;
      if (t.payloadJson == null || typeof t.payloadJson !== "object" || Array.isArray(t.payloadJson)) continue;
      const internal = (t.payloadJson as Record<string, unknown>).internalThought;
      if (typeof internal === "string") {
        latestInternalThought = internal;
        break;
      }
    }
  }

  if (!resolvedReaderId) {
    const storylineExplainability = buildStorylineExplainabilitySummary({
      mode: "scene_mode",
      channel: "canonical_dyad",
      seamId: `author-inspection:${request.characterId}:${request.sceneId ?? "no-scene"}`,
      relationshipSignalCodes: [
        `author_mode:${request.mode}`,
        request.sceneId ? `scene_present:${request.sceneId}` : "scene_absent",
      ],
    });
    assertMemoryBoundary({
      source: "author_inspection_notes",
      target: "author_inspection_notes",
      payload: { internalThoughtVisibility: true },
    });
    return validateRegisteredContractPayload("authorInspectionPayload", {
      contractVersion: AUTHOR_INSPECTION_PAYLOAD_CONTRACT_VERSION,
      mode: request.mode,
      characterId: request.characterId,
      sceneId: request.sceneId,
      readerId: null,
      sessionId,
      modeSeparation: {
        boundedReaderCharacterMode: NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION,
        authorGodInspectionMode: NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE,
        separationEnforced: true as const,
      },
      characterKnowledgeBoundary: { knownFacts: [], believedFacts: [], unknownDomains: [] },
      canonicalTruthRelevantToCharacter: { relevantKnownFacts: [] },
      readerInteractionMemory: null,
      currentEmotionalState: { baselineTone: "neutral", latestCharacterEmotionalTone: null },
      driftAnchorComparison: { anchorPresent: false, driftDetected: false, driftSignals: [] },
      internalThoughtVisibility: {
        allowed: request.mode === AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection,
        latestInternalThought:
          request.mode === AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection ? latestInternalThought : null,
      },
      storylineExplainability,
    }, "write");
  }

  const snapshot = await refreshConversationalIdentitySnapshot({
    characterId: request.characterId,
    readerId: resolvedReaderId,
    sceneId: request.sceneId,
    sessionId,
  });
  const continuity = deriveConversationEmotionalContinuity({ snapshot });
  const knownFactsKeys =
    snapshot.readerMemory?.knownFacts &&
    typeof snapshot.readerMemory.knownFacts === "object" &&
    !Array.isArray(snapshot.readerMemory.knownFacts)
      ? Object.keys(snapshot.readerMemory.knownFacts as Record<string, unknown>)
      : [];

  const anchor = readConversationAnchorFromMetadata(sessionMetadata);
  const compared = anchor
    ? compareSnapshotToAnchor(snapshot, anchor)
    : { driftDetected: false, driftSignals: [] as string[] };
  const storylineExplainability = buildStorylineExplainabilitySummary({
    mode: "interaction_mode",
    channel: "reader_bond_dyad",
    seamId: `author-inspection:${request.characterId}:${resolvedReaderId}:${request.sceneId ?? "no-scene"}`,
    relationshipSignalCodes: [
      `author_mode:${request.mode}`,
      `baseline_tone:${continuity.baselineTone}`,
      `current_tone:${continuity.currentConversationTone}`,
      ...compared.driftSignals.slice(0, 2),
    ],
    emotionalContinuity: continuity,
  });

  assertMemoryBoundary({
    source: "author_inspection_notes",
    target: "author_inspection_notes",
    payload: {
      internalThoughtVisibility: request.mode === AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection,
      driftSignals: compared.driftSignals,
    },
  });
  return validateRegisteredContractPayload("authorInspectionPayload", {
    contractVersion: AUTHOR_INSPECTION_PAYLOAD_CONTRACT_VERSION,
    mode: request.mode,
    characterId: request.characterId,
    sceneId: request.sceneId,
    readerId: resolvedReaderId,
    sessionId,
    modeSeparation: {
      boundedReaderCharacterMode: NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION,
      authorGodInspectionMode: NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE,
      separationEnforced: true as const,
    },
    characterKnowledgeBoundary: {
      knownFacts: snapshot.knowledgeBoundary.knownFacts.slice(0, 32),
      believedFacts: snapshot.knowledgeBoundary.believedFacts.slice(0, 32),
      unknownDomains: snapshot.knowledgeBoundary.unknownDomains.slice(0, 32),
    },
    canonicalTruthRelevantToCharacter: {
      relevantKnownFacts: snapshot.knowledgeBoundary.knownFacts.slice(0, 12),
    },
    readerInteractionMemory: snapshot.readerMemory
      ? {
          familiarityLevel: snapshot.readerMemory.familiarityLevel,
          interactionCount: snapshot.readerMemory.interactionCount,
          knownFactsKeys,
        }
      : null,
    currentEmotionalState: {
      baselineTone: continuity.baselineTone,
      latestCharacterEmotionalTone: continuity.currentConversationTone ?? null,
    },
    driftAnchorComparison: {
      anchorPresent: Boolean(anchor),
      driftDetected: compared.driftDetected,
      driftSignals: compared.driftSignals,
    },
    internalThoughtVisibility: {
      allowed: request.mode === AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection,
      latestInternalThought:
        request.mode === AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection
          ? latestInternalThought
          : null,
    },
    storylineExplainability,
  }, "write");
}
