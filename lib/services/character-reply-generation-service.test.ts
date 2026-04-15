/**
 * P3-C character reply generation. Run: npx tsx --test lib/services/character-reply-generation-service.test.ts
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
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import {
  buildConservativeBoundedCharacterResponse,
  generateCharacterReplyFromTurn,
  type CharacterReplyLlmStructuredOutput,
} from "@/lib/services/character-reply-generation-service";

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
      knownFacts: ["Situated: river dock; steamboat smoke on the water"],
      believedFacts: [],
      unknownDomains: ["Events beyond the parish line are hearsay only."],
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

describe("generateCharacterReplyFromTurn", () => {
  it("returns registry-valid CharacterResponse for bounded mock LLM output", async () => {
    const mock: CharacterReplyLlmStructuredOutput = {
      spokenResponse: "I see the river and the smoke—nothing more I can claim as certain.",
      internalThought: "Hold to what the eyes report; no borrowed certainty.",
    };
    const out = await generateCharacterReplyFromTurn(
      {
        snapshot: minimalSnapshot(),
        turnInput: minimalTurn(),
        responseIntent: "statement",
      },
      {
        callStructuredReplyLlm: async () => mock,
      }
    );
    assert.equal(out.usedPolicyFallback, false);
    assert.equal(out.finalPolicyPass, true);
    validateRegisteredContractPayload("characterResponse", out.response, "write");
    assert.ok(out.response.spokenResponse.length > 0);
  });

  it("uses conservative fallback when LLM delegate throws", async () => {
    const out = await generateCharacterReplyFromTurn(
      {
        snapshot: minimalSnapshot(),
        turnInput: minimalTurn(),
      },
      {
        callStructuredReplyLlm: async () => {
          throw new Error("network_down");
        },
      }
    );
    assert.equal(out.usedPolicyFallback, true);
    assert.ok(out.llmError?.includes("network_down"));
    validateRegisteredContractPayload("characterResponse", out.response, "write");
  });

  it("downgrades to conservative response when guardrails reject model output", async () => {
    const out = await generateCharacterReplyFromTurn(
      {
        snapshot: minimalSnapshot(),
        turnInput: minimalTurn(),
      },
      {
        callStructuredReplyLlm: async () => ({
          spokenResponse: "As the narrator, I will tell you the real history from Wikipedia.",
          internalThought: "",
        }),
      }
    );
    assert.equal(out.usedPolicyFallback, true);
    assert.equal(out.finalPolicyPass, true);
    assert.equal(out.modelOutputViolatedPolicy, true);
    validateRegisteredContractPayload("characterResponse", out.response, "write");
    assert.ok(!out.response.spokenResponse.toLowerCase().includes("wikipedia"));
  });

  it("passes bounded storyline guidance section to interaction generation prompt", async () => {
    let capturedUserPrompt = "";
    const out = await generateCharacterReplyFromTurn(
      {
        snapshot: minimalSnapshot(),
        turnInput: minimalTurn(),
      },
      {
        callStructuredReplyLlm: async ({ userPrompt }) => {
          capturedUserPrompt = userPrompt;
          return {
            spokenResponse: "I will answer from what this moment allows.",
            internalThought: "Keep close to what can be witnessed.",
          };
        },
      }
    );
    assert.equal(out.finalPolicyPass, true);
    assert.ok(capturedUserPrompt.includes("Storyline interaction guidance (bounded, non-omniscient)"));
    assert.ok(capturedUserPrompt.includes("Safety: use as soft weighting only"));
  });
});

describe("buildConservativeBoundedCharacterResponse", () => {
  it("produces contract-valid bounded shape without omniscient phrasing", () => {
    const r = buildConservativeBoundedCharacterResponse(minimalSnapshot());
    validateRegisteredContractPayload("characterResponse", r, "write");
    assert.ok(!/omniscient|narrator|wikipedia/i.test(r.spokenResponse));
  });
});
