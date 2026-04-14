/**
 * P2-J voice presentation (pure). Run: npx tsx --test lib/voice/voice-presentation.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import { toVoiceReadyText } from "@/lib/voice/voice-presentation";

function sample(overrides: Partial<CharacterResponse> = {}): CharacterResponse {
  return {
    contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
    spokenResponse: "I remember the river.",
    internalThought: "She cannot know.",
    knowledgeSource: "known",
    emotionalTone: "guarded",
    ...overrides,
  };
}

describe("toVoiceReadyText", () => {
  it("uses spoken line only in cleanedSpeech", () => {
    const out = toVoiceReadyText(sample());
    assert.equal(out.cleanedSpeech, "I remember the river.");
    assert.ok(out.emotionalCues.some((c) => c.startsWith("tone: guarded")));
    assert.ok(out.emotionalCues.some((c) => c.includes("grounded")));
  });

  it("strips bracket asides and collapses space", () => {
    const out = toVoiceReadyText(
      sample({
        spokenResponse: "  Wait [pause]   there.  ",
      })
    );
    assert.equal(out.cleanedSpeech, "Wait there.");
  });

  it("maps knowledgeSource to stance cue", () => {
    const out = toVoiceReadyText(sample({ knowledgeSource: "uncertain" }));
    assert.ok(out.emotionalCues.some((c) => c.includes("tentative")));
  });
});
