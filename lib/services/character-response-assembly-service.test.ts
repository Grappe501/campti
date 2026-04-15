/**
 * P2-I.2 — Character response assembly (deterministic). Run: npx tsx --test lib/services/character-response-assembly-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import {
  assembleCharacterResponse,
  assembleCharacterResponseWithDiagnostics,
  type AssembleCharacterResponseParams,
} from "@/lib/services/character-response-assembly-service";

function baseSnapshot(
  knowledgeBoundary: ConversationalIdentitySnapshot["knowledgeBoundary"],
  policy?: ConversationalIdentitySnapshot["policy"]
): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-01-01T00:00:00.000Z",
    characterId: "person-test",
    readerId: "reader-test",
    sceneId: null,
    policy: policy ?? BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "person-test", name: "Test", birthYear: 1800, deathYear: null },
      literaryProfile: null,
      coreHighlights: null,
    },
    knowledgeBoundary,
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
  };
}

describe("assembleCharacterResponse", () => {
  it("returns a valid CharacterResponse shape and passes registry write validation", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: ["gap"],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "Hello.",
      internalThoughtText: "Testing.",
    });
    assert.equal(out.contractVersion, CHARACTER_RESPONSE_CONTRACT_VERSION);
    assert.equal(typeof out.spokenResponse, "string");
    assert.equal(typeof out.internalThought, "string");
    assert.ok(["known", "belief", "uncertain"].includes(out.knowledgeSource));
    assert.equal(typeof out.emotionalTone, "string");
    const validated = validateRegisteredContractPayload("characterResponse", out, "write");
    assert.deepEqual(validated, out);
  });

  it("classifies as known when text overlaps a knownFacts line anchor", () => {
    const anchor = "Situated in era slice Louisiana 1820 plantation";
    const snap = baseSnapshot({
      knownFacts: [anchor, "other line"],
      believedFacts: [],
      unknownDomains: [],
    });
    const params: AssembleCharacterResponseParams = {
      conversationalIdentitySnapshot: snap,
      spokenResponseText: `I recall ${anchor} today.`,
      internalThoughtText: "…",
    };
    const out = assembleCharacterResponse(params);
    assert.equal(out.knowledgeSource, "known");
  });

  it("classifies as belief when text overlaps believedFacts more than known", () => {
    const anchor = "Scholarly / interpretive reading (not court truth): Parish gossip trail";
    const snap = baseSnapshot({
      knownFacts: ["Short"],
      believedFacts: [anchor],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: anchor,
      internalThoughtText: "",
    });
    assert.equal(out.knowledgeSource, "belief");
  });

  it("classifies gossip-like diction as belief when no bucket overlap", () => {
    const snap = baseSnapshot({
      knownFacts: ["Alpha bravo charlie delta echo foxtrot"],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "The rumor is they already left.",
      internalThoughtText: "Unsure.",
    });
    assert.equal(out.knowledgeSource, "belief");
  });

  it("defaults to uncertain when no boundary overlap and not gossip-like", () => {
    const snap = baseSnapshot({
      knownFacts: ["Alpha bravo charlie delta echo"],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "Unrelated prose with no shared substring.",
      internalThoughtText: "Same.",
    });
    assert.equal(out.knowledgeSource, "uncertain");
  });

  it("downgrades to uncertain when original text violates bounded mode (author voice)", () => {
    const snap = baseSnapshot({
      knownFacts: ["Situated in era slice Louisiana 1820 plantation"],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText:
        "Situated in era slice Louisiana 1820 plantation — as the author I know the ending.",
      internalThoughtText: "…",
    });
    assert.equal(out.knowledgeSource, "uncertain");
    assert.equal(out.spokenResponse.includes("as the author"), false);
  });

  it("downgrades to uncertain when calendar year exceeds boundary ceiling", () => {
    const snap = baseSnapshot({
      knownFacts: ["River road"],
      believedFacts: [],
      unknownDomains: ["No knowledge of real-world events after ~1820 (story calendar); no anachronism."],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "They said 1950 would matter.",
      internalThoughtText: "",
    });
    assert.equal(out.knowledgeSource, "uncertain");
  });

  it("downgrades to uncertain when snapshot policy deviates from bounded baseline", () => {
    const badPolicy = {
      ...BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
      authorOmniscienceExcluded: false,
    };
    const snap = baseSnapshot(
      {
        knownFacts: ["Situated in era slice Louisiana 1820 plantation"],
        believedFacts: [],
        unknownDomains: [],
      },
      badPolicy
    );
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "Situated in era slice Louisiana 1820 plantation",
      internalThoughtText: "",
    });
    assert.equal(out.knowledgeSource, "uncertain");
  });

  it("matches knownFacts with punctuation and whitespace differences (normalized token overlap)", () => {
    const snap = baseSnapshot({
      knownFacts: ["Situated, in era—slice; Louisiana  1820   plantation"],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "Well… situated — in era slice, Louisiana (1820) plantation, yes.",
      internalThoughtText: "",
    });
    assert.equal(out.knowledgeSource, "known");
  });

  it("placeholder-style spoken line defaults to uncertain when no grounding exists", () => {
    const snap = baseSnapshot({
      knownFacts: ["Alpha bravo charlie delta echo foxtrot"],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "Hello.",
      internalThoughtText: "Unrelated.",
    });
    assert.equal(out.knowledgeSource, "uncertain");
  });

  it("policy downgrade sets policyDowngraded when knowledgeSource was not already uncertain", () => {
    const snap = baseSnapshot({
      knownFacts: ["Situated in era slice Louisiana 1820 plantation"],
      believedFacts: [],
      unknownDomains: [],
    });
    const withMeta = assembleCharacterResponseWithDiagnostics({
      conversationalIdentitySnapshot: snap,
      spokenResponseText:
        "Situated in era slice Louisiana 1820 plantation — as the author I know the ending.",
      internalThoughtText: "…",
    });
    assert.equal(withMeta.response.knowledgeSource, "uncertain");
    assert.equal(withMeta.policyDowngraded, true);
    assert.match(withMeta.classificationReason, /policy_downgrade_guardrail/);
  });

  it("policy assessment does not set policyDowngraded when classification was already uncertain", () => {
    const snap = baseSnapshot({
      knownFacts: ["River road"],
      believedFacts: [],
      unknownDomains: ["No knowledge of real-world events after ~1820 (story calendar); no anachronism."],
    });
    const withMeta = assembleCharacterResponseWithDiagnostics({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: "They said 1950 would matter.",
      internalThoughtText: "",
    });
    assert.equal(withMeta.response.knowledgeSource, "uncertain");
    assert.equal(withMeta.policyDowngraded, false);
  });
});
