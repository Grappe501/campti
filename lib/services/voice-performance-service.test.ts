/**
 * P3-P voice performance service. Run: npx tsx --test lib/services/voice-performance-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import { buildVoicePerformanceProfile } from "@/lib/services/voice-performance-service";

describe("buildVoicePerformanceProfile", () => {
  it("changes tone intensity for charged emotional continuity", () => {
    const out = buildVoicePerformanceProfile({
      response: {
        contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
        spokenResponse: "Hold the line.",
        internalThought: "No retreat.",
        knowledgeSource: "known",
        emotionalTone: "neutral",
      },
      emotionalContinuity: {
        baselineTone: "wary",
        currentConversationTone: "charged",
        carryoverSignals: ["unresolved_topics:2"],
        continuityWarnings: [],
        channel: "canonical_dyad",
        mode: "interaction_mode",
        pressureState: {
          currentAffectPressure: 61,
          volatilityPressure: 55,
          guardednessPressure: 43,
          opennessPressure: 37,
          griefFearResentmentCarryover: {
            grief: 10,
            fear: 22,
            resentment: 18,
          },
          conflictReadinessPressure: 40,
          avoidancePressure: 36,
          reasonCodes: ["charged_test_fixture"],
        },
      },
    });
    assert.equal(out.toneIntensityHint, "high");
    assert.equal(out.pauseStrategy, "dramatic");
  });

  it("remains deterministic for same input", () => {
    const input = {
      response: {
        contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
        spokenResponse: "Can we trust them?",
        internalThought: "",
        knowledgeSource: "uncertain" as const,
        emotionalTone: "wary",
      },
    };
    const a = buildVoicePerformanceProfile(input);
    const b = buildVoicePerformanceProfile(input);
    assert.deepEqual(a, b);
  });

  it("never leaks internalThought content in hints", () => {
    const out = buildVoicePerformanceProfile({
      response: {
        contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
        spokenResponse: "I answer plainly.",
        internalThought: "secret phrase XYZZY",
        knowledgeSource: "belief",
        emotionalTone: "guarded",
      },
    });
    const serialized = JSON.stringify(out);
    assert.equal(serialized.includes("XYZZY"), false);
  });
});
