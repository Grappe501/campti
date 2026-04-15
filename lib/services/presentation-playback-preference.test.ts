/**
 * P3-G — Presentation playback preference does not alter cognition metadata builders.
 * Run: npx tsx --test lib/services/presentation-playback-preference.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCharacterPresentationMode } from "@/lib/services/translation-presentation-service";

describe("presentation vs cognition separation", () => {
  it("keeps CharacterPresentationMode deterministic for the same inputs (toggle is routing metadata elsewhere)", () => {
    const a = buildCharacterPresentationMode({
      characterPrimaryMindLanguage: "fr",
      readerPresentationLanguageCode: "en",
    });
    const b = buildCharacterPresentationMode({
      characterPrimaryMindLanguage: "fr",
      readerPresentationLanguageCode: "en",
    });
    assert.deepEqual(a, b);
    assert.equal(a.translationApplied, true);
  });
});
