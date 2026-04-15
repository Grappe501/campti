/**
 * P3-I conversation quality review. Run: npx tsx --test lib/services/conversation-quality-review-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import { reviewBoundedConversationTurn } from "@/lib/services/conversation-quality-review-service";

function snap(): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-01-01T00:00:00.000Z",
    characterId: "c1",
    readerId: "r1",
    sceneId: "s1",
    policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "c1", name: "A", birthYear: 1800, deathYear: null },
      literaryProfile: null,
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
}

describe("reviewBoundedConversationTurn", () => {
  it("flags relationship-memory claims without dyad as fail", () => {
    const r = reviewBoundedConversationTurn({
      snapshot: snap(),
      response: {
        contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
        spokenResponse: "Last time we spoke you promised me the truth.",
        internalThought: "",
        knowledgeSource: "uncertain",
        emotionalTone: "wary",
      },
      recentTranscriptExcerpts: [],
    });
    assert.equal(r.pass, false);
    assert.ok(r.issues.some((i) => i.code === "relationship_memory_without_dyad"));
  });

  it("passes clean bounded lines", () => {
    const r = reviewBoundedConversationTurn({
      snapshot: snap(),
      response: {
        contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
        spokenResponse: "The river is wide tonight.",
        internalThought: "Hold steady.",
        knowledgeSource: "belief",
        emotionalTone: "neutral",
      },
      recentTranscriptExcerpts: ["reader: hello"],
    });
    assert.equal(r.pass, true);
    assert.equal(r.scoreBand, "green");
  });
});
