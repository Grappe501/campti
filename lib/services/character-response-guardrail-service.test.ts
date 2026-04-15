/**
 * P2-Q — Character response guardrail (deterministic). Run: npx tsx --test lib/services/character-response-guardrail-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHARACTER_RESPONSE_CONTRACT_VERSION,
  type CharacterResponse,
} from "@/lib/domain/character-response-contract";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import {
  assessCharacterResponsePolicyViolations,
  type CharacterResponsePolicyViolationCode,
} from "@/lib/services/character-response-guardrail-service";

function baseSnapshot(
  knowledgeBoundary: ConversationalIdentitySnapshot["knowledgeBoundary"],
  overrides?: Partial<Pick<ConversationalIdentitySnapshot, "policy" | "readerMemory">>
): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-01-01T00:00:00.000Z",
    characterId: "person-test",
    readerId: "reader-test",
    sceneId: null,
    policy: overrides?.policy ?? BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "person-test", name: "Test", birthYear: 1800, deathYear: null },
      literaryProfile: null,
      coreHighlights: null,
    },
    knowledgeBoundary,
    relationships: [],
    readerMemory: overrides?.readerMemory ?? null,
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

function response(spoken: string, internal: string): CharacterResponse {
  return {
    contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
    spokenResponse: spoken,
    internalThought: internal,
    knowledgeSource: "uncertain",
    emotionalTone: "neutral",
  };
}

function assertHasCode(violations: { code: CharacterResponsePolicyViolationCode }[], code: CharacterResponsePolicyViolationCode) {
  assert.ok(violations.some((v) => v.code === code), `expected violation code ${code}, got ${JSON.stringify(violations)}`);
}

describe("assessCharacterResponsePolicyViolations", () => {
  it("passes when snapshot is bounded and text is clean", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("River road bends east.", "Quiet."),
    });
    assert.equal(out.pass, true);
    assert.deepEqual(out.violations, []);
    assert.equal(out.suggestedDowngradeAction, "none");
  });

  it("policy_flags_not_bounded when policy diverges from bounded baseline", () => {
    const snap = baseSnapshot(
      {
        knownFacts: [],
        believedFacts: [],
        unknownDomains: [],
      },
      {
        policy: { ...BOUNDED_CHARACTER_CONVERSATIONAL_POLICY, inWorldOnly: false },
      }
    );
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("Hello.", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "policy_flags_not_bounded");
    assert.equal(out.suggestedDowngradeAction, "force_knowledge_uncertain");
  });

  it("future_knowledge_vs_boundary when calendar year exceeds inferred ceiling", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: ["No knowledge of real-world events after ~1820 (story calendar); no anachronism."],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("They said 1950 would matter.", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "future_knowledge_vs_boundary");
  });

  it("future_knowledge_vs_boundary on explicit future/modern substring list", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("quantum computing will change everything", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "future_knowledge_vs_boundary");
  });

  it("out_of_world_teaching", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("according to wikipedia the battle was in 1066", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "out_of_world_teaching");
  });

  it("omniscient_or_meta_voice", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("as the author I know the ending", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "omniscient_or_meta_voice");
  });

  it("translation_cognition_confusion", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("the english translation of my thoughts is plain", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "translation_cognition_confusion");
  });

  it("reader_memory_claim_without_dyad when readerMemory is null", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("Last time we spoke you told me your name.", ""),
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "reader_memory_claim_without_dyad");
  });

  it("does not flag reader-memory phrasing when P2-G dyad exists", () => {
    const snap = baseSnapshot(
      {
        knownFacts: [],
        believedFacts: [],
        unknownDomains: [],
      },
      {
        readerMemory: {
          id: "rm-1",
          characterId: "person-test",
          readerId: "reader-test",
          familiarityLevel: 10,
          interactionCount: 2,
          knownFacts: {},
          relationshipNotes: null,
          firstInteractionAt: null,
          lastInteractionAt: new Date("2026-01-02T00:00:00.000Z"),
          metadataJson: null,
        },
      }
    );
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("Last time we spoke you told me your name.", ""),
    });
    assert.equal(out.pass, true);
    assert.ok(!out.violations.some((v) => v.code === "reader_memory_claim_without_dyad"));
  });

  it("scans originalCombinedText for violations stripped from response", () => {
    const snap = baseSnapshot({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const out = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: response("Clean line.", ""),
      originalCombinedText: "as the narrator I see all\nClean line.",
    });
    assert.equal(out.pass, false);
    assertHasCode(out.violations, "omniscient_or_meta_voice");
  });
});
