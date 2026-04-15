/**
 * Conversation anchor drift detection (deterministic).
 * Run: npx tsx --test lib/services/conversation-anchor-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import {
  compareSnapshotToAnchor,
  computeConversationAnchor,
} from "@/lib/services/conversation-anchor-service";

function baseSnapshot(
  overrides?: Partial<ConversationalIdentitySnapshot>
): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-04-01T12:00:00.000Z",
    characterId: "char-anchor",
    readerId: "reader-anchor",
    sceneId: "scene-anchor",
    policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "char-anchor", name: "Camille", birthYear: 1810, deathYear: null },
      literaryProfile: {
        socialPosition: "merchant family",
        roleArchetype: "witness",
        educationLevel: "apprentice",
        narrativeFunction: "pressure valve",
        worldview: "cautious optimism",
        coreBeliefs: null,
        fears: null,
        desires: null,
      },
      coreHighlights: null,
    },
    knowledgeBoundary: {
      knownFacts: ["River port is active at dawn", "Trade records stop before 1820"],
      believedFacts: ["People whisper about a tax patrol"],
      unknownDomains: ["No knowledge of events after ~1820 (story calendar)"],
    },
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
    emotionalState: {
      latestCognitionSnapshot: null,
      latestLegacyCharacterState: null,
    },
    sessionContext: null,
    ...overrides,
  };
}

describe("computeConversationAnchor / compareSnapshotToAnchor", () => {
  it("same snapshot yields no drift", () => {
    const snap = baseSnapshot();
    const anchor = computeConversationAnchor(snap);
    const cmp = compareSnapshotToAnchor(snap, anchor);
    assert.equal(cmp.driftDetected, false);
    assert.deepEqual(cmp.driftSignals, []);
  });

  it("modified identity yields drift", () => {
    const snap = baseSnapshot();
    const anchor = computeConversationAnchor(snap);
    const changed = baseSnapshot({
      identity: {
        ...snap.identity,
        person: { ...snap.identity.person, name: "Camille Delacroix" },
      },
    });
    const cmp = compareSnapshotToAnchor(changed, anchor);
    assert.equal(cmp.driftDetected, true);
    assert.ok(cmp.driftSignals.includes("identity_hash_changed"));
  });

  it("modified knowledge boundary yields drift", () => {
    const snap = baseSnapshot();
    const anchor = computeConversationAnchor(snap);
    const changed = baseSnapshot({
      knowledgeBoundary: {
        ...snap.knowledgeBoundary,
        knownFacts: [...snap.knowledgeBoundary.knownFacts, "A new decree was posted at the square"],
      },
    });
    const cmp = compareSnapshotToAnchor(changed, anchor);
    assert.equal(cmp.driftDetected, true);
    assert.ok(cmp.driftSignals.includes("knowledge_boundary_hash_changed"));
  });
});
