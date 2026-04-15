/**
 * P2-J voice presentation. Run: npx tsx --test lib/voice/voice-presentation.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import { buildVoicePresentationPayload } from "@/lib/voice/voice-presentation-service";
import { toVoiceReadyText } from "@/lib/voice/voice-presentation";

function sample(overrides: Partial<CharacterResponse> = {}): CharacterResponse {
  return {
    contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
    spokenResponse: "I remember the river.",
    internalThought: "She cannot know this secret phrase XYZZY.",
    knowledgeSource: "known",
    emotionalTone: "guarded",
    ...overrides,
  };
}

describe("buildVoicePresentationPayload", () => {
  it("uses spokenResponse only for cleanedSpokenText; internalThought never appears in payload", () => {
    const p = buildVoicePresentationPayload(sample());
    assert.equal(p.cleanedSpokenText, "I remember the river.");
    assert.equal(p.emotionalTone, "guarded");
    const serialized = JSON.stringify(p);
    assert.equal(serialized.includes("XYZZY"), false);
    assert.equal(serialized.includes("She cannot"), false);
    assert.equal(serialized.includes("internalThought"), false);
  });

  it("trims whitespace and collapses duplicated spacing on spoken line", () => {
    const p = buildVoicePresentationPayload(
      sample({
        spokenResponse: "  Wait   there.  ",
      })
    );
    assert.equal(p.cleanedSpokenText, "Wait there.");
  });

  it("strips bracket stage directions while preserving spoken words", () => {
    const p = buildVoicePresentationPayload(
      sample({
        spokenResponse: "  Wait [pause]   there.  ",
      })
    );
    assert.equal(p.cleanedSpokenText, "Wait there.");
  });

  it("preserves emotionalTone from CharacterResponse", () => {
    const p = buildVoicePresentationPayload(sample({ emotionalTone: "  warm  " }));
    assert.equal(p.emotionalTone, "warm");
  });

  it("returns a stable VoicePresentationPayload shape", () => {
    const p = buildVoicePresentationPayload(sample());
    assert.deepEqual(Object.keys(p).sort(), [
      "cleanedSpokenText",
      "emotionalTone",
      "pauseHints",
      "performanceProfile",
    ]);
    assert.ok(Array.isArray(p.pauseHints));
    assert.equal(p.pauseHints.length, 2);
    assert.ok(p.performanceProfile);
  });

  it("passes optional language and pronunciation hints through when provided", () => {
    const p = buildVoicePresentationPayload(sample(), {
      nativeLanguageCode: "fr",
      translatedLanguageCode: "en",
      pronunciationHints: ["bay-zil for basil"],
    });
    assert.equal(p.nativeLanguageCode, "fr");
    assert.equal(p.translatedLanguageCode, "en");
    assert.deepEqual(p.pronunciationHints, ["bay-zil for basil"]);
  });

  it("maps knowledgeSource into deterministic pauseHints (delivery stance)", () => {
    const uncertain = buildVoicePresentationPayload(sample({ knowledgeSource: "uncertain" }));
    assert.ok(uncertain.pauseHints[0]!.includes("tentative"));
  });
});

describe("toVoiceReadyText (legacy adapter)", () => {
  it("uses spoken line only in cleanedSpeech", () => {
    const out = toVoiceReadyText(sample());
    assert.equal(out.cleanedSpeech, "I remember the river.");
    assert.ok(out.emotionalCues.some((c) => c.startsWith("tone: guarded")));
    assert.ok(out.emotionalCues.some((c) => c.includes("grounded")));
    const joined = out.emotionalCues.join(" ");
    assert.equal(joined.includes("XYZZY"), false);
  });

  it("strips bracket asides and collapses space", () => {
    const out = toVoiceReadyText(
      sample({
        spokenResponse: "  Wait [pause]   there.  ",
      })
    );
    assert.equal(out.cleanedSpeech, "Wait there.");
  });

  it("maps knowledgeSource to stance via pauseHints reflected in cues", () => {
    const out = toVoiceReadyText(sample({ knowledgeSource: "uncertain" }));
    assert.ok(out.emotionalCues.some((c) => c.includes("tentative")));
  });
});
