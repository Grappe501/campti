/**
 * P2-L character reply generation adapter (deterministic). Run: npx tsx --test lib/services/character-reply-generation-adapter.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import {
  CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
  type ConversationalTurnInput,
} from "@/lib/domain/conversational-turn-input";
import {
  CHARACTER_REPLY_GENERATION_PREPARED_KEYS,
  prepareCharacterReplyGenerationInput,
} from "@/lib/services/character-reply-generation-adapter";

const FORBIDDEN_OMNISCIENCE_KEYS = [
  "omniscientContext",
  "narratorNotes",
  "authorVoice",
  "godMode",
  "manuscriptExcerpt",
  "outOfWorldTruth",
] as const;

function minimalSnapshot(overrides: Partial<ConversationalIdentitySnapshot> = {}): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-01-01T00:00:00.000Z",
    characterId: "c1",
    readerId: "r1",
    sceneId: "scene-1",
    policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "c1", name: "Marie", birthYear: 1801, deathYear: null },
      literaryProfile: null,
      coreHighlights: null,
    },
    knowledgeBoundary: {
      knownFacts: ["Situated: river dock"],
      believedFacts: [],
      unknownDomains: ["No omniscient access to off-stage households."],
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

function minimalTurn(overrides: Partial<ConversationalTurnInput> = {}): ConversationalTurnInput {
  return {
    contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
    characterId: "c1",
    readerId: "r1",
    sceneId: "scene-1",
    inputMode: "text",
    readerText: "What do you see?",
    ...overrides,
  };
}

describe("prepareCharacterReplyGenerationInput", () => {
  it("returns only the structured keys (no omniscient or author-side fields)", () => {
    const out = prepareCharacterReplyGenerationInput({
      snapshot: minimalSnapshot(),
      turnInput: minimalTurn(),
    });
    const keys = Object.keys(out).sort();
    assert.deepEqual(keys, [...CHARACTER_REPLY_GENERATION_PREPARED_KEYS].sort());
    for (const forbidden of FORBIDDEN_OMNISCIENCE_KEYS) {
      assert.equal((out as Record<string, unknown>)[forbidden], undefined);
    }
  });

  it("includes policy summary with bounded flags", () => {
    const out = prepareCharacterReplyGenerationInput({
      snapshot: minimalSnapshot(),
      turnInput: minimalTurn(),
    });
    assert.ok(out.policySummary.includes("authorOmniscienceExcluded: true"));
    assert.ok(out.policySummary.includes("inWorldOnly: true"));
    assert.ok(out.policySummary.includes("Author/God/omniscient tooling: not in scope"));
  });

  it("embeds reader text in readerPromptText", () => {
    const out = prepareCharacterReplyGenerationInput({
      snapshot: minimalSnapshot(),
      turnInput: minimalTurn({ readerText: "  Hello there.  " }),
    });
    assert.ok(out.readerPromptText.includes("Hello there."));
  });

  it("throws when turn ids do not match snapshot", () => {
    assert.throws(
      () =>
        prepareCharacterReplyGenerationInput({
          snapshot: minimalSnapshot(),
          turnInput: minimalTurn({ readerId: "other" }),
        }),
      /must match snapshot/
    );
  });

  it("surfaces knowledge boundary and emotional sections without extra object keys", () => {
    const out = prepareCharacterReplyGenerationInput({
      snapshot: minimalSnapshot({
        emotionalState: {
          latestCognitionSnapshot: {
            id: "s1",
            sceneId: "scene-1",
            label: "test",
            currentFear: "water",
            currentDesire: null,
            currentObligation: null,
            currentShame: null,
            currentHope: null,
            currentAnger: null,
            currentSocialRisk: null,
            currentMask: null,
            currentContradiction: null,
            currentArousal: null,
            currentLoneliness: 10,
          },
          latestLegacyCharacterState: null,
        },
      }),
      turnInput: minimalTurn(),
    });
    assert.ok(out.knowledgeBoundarySummary.includes("Situated: river dock"));
    assert.ok(out.emotionalContextSummary.includes("water"));
    assert.ok(out.emotionalContextSummary.includes("loneliness: 10"));
    assert.equal(out.narrativeEmergenceBundle.mode, "interaction_mode");
    assert.equal(out.narrativeEmergenceBundle.channel, "reader_bond_dyad");
    assert.ok(out.narrativeEmergenceBundle.storylineGuidance);
    assert.equal(out.narrativeEmergenceBundle.storylineGuidance?.mode, "interaction_mode");
    assert.ok((out.narrativeEmergenceBundle.storylineGuidance?.tensionEmphasisWeights.length ?? 0) <= 6);
  });
});
