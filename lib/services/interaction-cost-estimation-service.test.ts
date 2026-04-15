/**
 * P2-W interaction cost estimation. Run: npx tsx --test lib/services/interaction-cost-estimation-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  estimateConversationTurnCostUnits,
  estimateTextTurnCostUnits,
  estimateVoiceRenderCostUnits,
  NEUTRAL_VOICE_PRESENTATION,
} from "@/lib/services/interaction-cost-estimation-service";

describe("estimateTextTurnCostUnits", () => {
  it("is chars + words (words = whitespace-separated tokens after trim)", () => {
    assert.equal(estimateTextTurnCostUnits(""), 0);
    assert.equal(estimateTextTurnCostUnits("a"), 1 + 1);
    assert.equal(estimateTextTurnCostUnits("hello world"), 11 + 2);
    assert.equal(estimateTextTurnCostUnits("  hi  there  "), 9 + 2);
  });
});

describe("estimateVoiceRenderCostUnits", () => {
  it("uses a flat base and bumps when translation is applied", () => {
    const base = estimateVoiceRenderCostUnits(NEUTRAL_VOICE_PRESENTATION);
    const withTranslation = estimateVoiceRenderCostUnits({
      ...NEUTRAL_VOICE_PRESENTATION,
      translationApplied: true,
    });
    assert.equal(withTranslation - base, 16);
    assert.ok(base > 0);
  });
});

describe("estimateConversationTurnCostUnits", () => {
  it("sums text estimate on combined segments and optional voice units", () => {
    const textOnly = estimateConversationTurnCostUnits({
      readerText: "Hi.",
      characterSpokenResponse: "Hello back.",
      characterInternalThought: "",
      includeVoiceRender: false,
    });
    assert.equal(textOnly.voiceRenderCostUnits, 0);
    assert.equal(textOnly.textTurnCostUnits, estimateTextTurnCostUnits("Hi.\nHello back.\n"));
    assert.equal(textOnly.totalCostUnits, textOnly.textTurnCostUnits);

    const withVoice = estimateConversationTurnCostUnits({
      readerText: "Hi.",
      characterSpokenResponse: "Hello.",
      characterInternalThought: "",
      includeVoiceRender: true,
      voicePresentationPayload: NEUTRAL_VOICE_PRESENTATION,
    });
    assert.equal(withVoice.totalCostUnits, withVoice.textTurnCostUnits + withVoice.voiceRenderCostUnits);
    assert.equal(withVoice.voiceRenderCostUnits, estimateVoiceRenderCostUnits(NEUTRAL_VOICE_PRESENTATION));
  });
});
