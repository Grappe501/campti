/**
 * Shared read-model mappers for conversation session/turn projection.
 *
 * Scope intentionally narrow: only canonical mapping logic reused by cockpit and observability
 * surfaces. Service-specific assembly remains in each service.
 */
import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type {
  ConversationIdentitySummary,
  ConversationSessionMetadata,
  ConversationTurnObservability,
} from "@/lib/domain/conversation-observability";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import { formatBoundedTurnSummary } from "@/lib/services/conversational-identity-refresh-service";

export function mapConversationSessionMetadata(
  session: CharacterConversationSession
): ConversationSessionMetadata {
  return {
    sessionId: session.id,
    characterId: session.characterId,
    readerId: session.readerId,
    sceneId: session.sceneId,
    status: session.status,
    interactionCount: session.interactionCount,
    startedAtIso: session.startedAt.toISOString(),
    lastInteractionAtIso: session.lastInteractionAt.toISOString(),
    endedAtIso: session.endedAt ? session.endedAt.toISOString() : null,
  };
}

export function mapConversationIdentitySummary(
  snapshot: ConversationalIdentitySnapshot
): ConversationIdentitySummary {
  const p = snapshot.identity.person;
  const lp = snapshot.identity.literaryProfile;
  return {
    characterId: snapshot.characterId,
    readerId: snapshot.readerId,
    sceneId: snapshot.sceneId,
    personName: p.name,
    personBirthYear: p.birthYear,
    personDeathYear: p.deathYear,
    roleArchetype: lp?.roleArchetype ?? null,
    narrativeFunction: lp?.narrativeFunction ?? null,
  };
}

function tryCharacterKnowledgeSource(payloadJson: unknown): CharacterResponse["knowledgeSource"] | undefined {
  if (payloadJson == null || typeof payloadJson !== "object" || Array.isArray(payloadJson)) return undefined;
  const ks = (payloadJson as Record<string, unknown>).knowledgeSource;
  if (ks === "known" || ks === "belief" || ks === "uncertain") return ks;
  return undefined;
}

export function mapConversationTurnObservability(
  turns: CharacterConversationTurn[]
): ConversationTurnObservability[] {
  return turns.map((t) => {
    const base: ConversationTurnObservability = {
      turnId: t.id,
      orderIndex: t.orderIndex,
      speakerType: t.speakerType,
      createdAtIso: t.createdAt.toISOString(),
      summaryLine: formatBoundedTurnSummary({
        speakerType: t.speakerType,
        orderIndex: t.orderIndex,
        payloadJson: t.payloadJson,
      }),
    };
    if (t.speakerType === "character") {
      const ks = tryCharacterKnowledgeSource(t.payloadJson);
      if (ks) return { ...base, characterKnowledgeSource: ks };
    }
    return base;
  });
}
