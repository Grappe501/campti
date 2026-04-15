/**
 * Shared read-model mapper tests.
 * Run: npx tsx --test lib/services/conversation-read-model-mapper.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import {
  mapConversationIdentitySummary,
  mapConversationSessionMetadata,
  mapConversationTurnObservability,
} from "@/lib/services/conversation-read-model-mapper";

describe("conversation-read-model-mapper", () => {
  it("maps canonical session metadata consistently", () => {
    const session: CharacterConversationSession = {
      id: "sess-1",
      characterId: "char-1",
      readerId: "reader-1",
      sceneId: "scene-1",
      status: "ACTIVE",
      interactionCount: 4,
      startedAt: new Date("2026-04-15T00:00:00.000Z"),
      lastInteractionAt: new Date("2026-04-15T01:00:00.000Z"),
      endedAt: null,
      metadataJson: null,
    };

    const out = mapConversationSessionMetadata(session);
    assert.deepEqual(out, {
      sessionId: "sess-1",
      characterId: "char-1",
      readerId: "reader-1",
      sceneId: "scene-1",
      status: "ACTIVE",
      interactionCount: 4,
      startedAtIso: "2026-04-15T00:00:00.000Z",
      lastInteractionAtIso: "2026-04-15T01:00:00.000Z",
      endedAtIso: null,
    });
  });

  it("maps identity summary without leaking extra identity fields", () => {
    const snapshot: ConversationalIdentitySnapshot = {
      contractVersion: "1",
      builtAtIso: "2026-04-15T00:00:00.000Z",
      characterId: "char-1",
      readerId: "reader-1",
      sceneId: "scene-1",
      policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
      identity: {
        person: {
          id: "char-1",
          name: "Élodie",
          birthYear: 1810,
          deathYear: null,
        },
        literaryProfile: {
          socialPosition: null,
          roleArchetype: "witness",
          educationLevel: null,
          narrativeFunction: "pressure valve",
          worldview: null,
          coreBeliefs: null,
          fears: null,
          desires: null,
        },
        coreHighlights: null,
      },
      knowledgeBoundary: { knownFacts: [], believedFacts: [], unknownDomains: [] },
      relationships: [],
      readerMemory: null,
      readerRelationshipProgression: {
        relationshipState: "stranger",
        directnessLevel: "guarded",
        vulnerabilityAllowance: "minimal",
        disclosureComfortBand: "none",
        greetingStyleHint: "formal distance",
        familiarityLevel: 0,
        interactionCount: 0,
        keyDisclosureCount: 0,
      },
      emotionalState: { latestCognitionSnapshot: null, latestLegacyCharacterState: null },
      sessionContext: null,
    };

    const out = mapConversationIdentitySummary(snapshot);
    assert.deepEqual(out, {
      characterId: "char-1",
      readerId: "reader-1",
      sceneId: "scene-1",
      personName: "Élodie",
      personBirthYear: 1810,
      personDeathYear: null,
      roleArchetype: "witness",
      narrativeFunction: "pressure valve",
    });
  });

  it("maps turn observability and keeps character knowledge source when valid", () => {
    const turns: CharacterConversationTurn[] = [
      {
        id: "turn-r-1",
        sessionId: "sess-1",
        orderIndex: 0,
        speakerType: "reader",
        payloadJson: {
          contractVersion: "1",
          inputMode: "text",
          readerText: "Hello there.",
          characterId: "char-1",
          readerId: "reader-1",
          sessionId: "sess-1",
        },
        createdAt: new Date("2026-04-15T00:10:00.000Z"),
      },
      {
        id: "turn-c-1",
        sessionId: "sess-1",
        orderIndex: 1,
        speakerType: "character",
        payloadJson: {
          contractVersion: "1",
          spokenResponse: "Good day.",
          internalThought: "Stay measured.",
          knowledgeSource: "belief",
          emotionalTone: "warm",
        },
        createdAt: new Date("2026-04-15T00:11:00.000Z"),
      },
    ];

    const out = mapConversationTurnObservability(turns);
    assert.equal(out.length, 2);
    assert.equal(out[0].turnId, "turn-r-1");
    assert.ok(out[0].summaryLine.includes("Hello"));
    assert.equal(out[1].turnId, "turn-c-1");
    assert.equal(out[1].characterKnowledgeSource, "belief");
  });

  it("omits invalid character knowledge source values", () => {
    const turns: CharacterConversationTurn[] = [
      {
        id: "turn-c-2",
        sessionId: "sess-1",
        orderIndex: 2,
        speakerType: "character",
        payloadJson: {
          contractVersion: "1",
          spokenResponse: "I should not expose invalid source.",
          internalThought: "",
          knowledgeSource: "invalid",
          emotionalTone: "neutral",
        },
        createdAt: new Date("2026-04-15T00:12:00.000Z"),
      },
    ];

    const out = mapConversationTurnObservability(turns);
    assert.equal(out[0].characterKnowledgeSource, undefined);
  });
});
