/**
 * P2-S translation presentation (deterministic). Run: npx tsx --test lib/services/translation-presentation-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_READER_PRESENTATION_LANGUAGE_CODE } from "@/lib/domain/translation-presentation";
import type { WorldStateLanguageEnvironment } from "@/lib/domain/thought-language";
import { buildCharacterPresentationMode } from "@/lib/services/translation-presentation-service";

function worldFr(): WorldStateLanguageEnvironment {
  return {
    worldStateId: "ws-1",
    eraId: "era-1",
    dominantLanguages: [{ code: "fr", label: "French" }],
    prestigeLanguage: "fr",
    sacredLanguage: null,
    legalLanguage: null,
    tradeLanguage: null,
    householdLanguage: null,
    literacyNorm: { clericalLiteracy: "minority", vernacularPrint: false },
    languageHierarchy: [],
    translationPressure: 40,
  };
}

describe("buildCharacterPresentationMode", () => {
  it("falls back to default reader language and null cognition when no world or character hints", () => {
    const m = buildCharacterPresentationMode({});
    assert.equal(m.readerPresentationLanguageCode, DEFAULT_READER_PRESENTATION_LANGUAGE_CODE);
    assert.equal(m.cognitionLanguageCode, null);
    assert.equal(m.translationApplied, false);
    assert.equal(m.nativeTongueAvailable, false);
  });

  it("uses explicit reader presentation code when provided", () => {
    const m = buildCharacterPresentationMode({ readerPresentationLanguageCode: "es" });
    assert.equal(m.readerPresentationLanguageCode, "es");
    assert.equal(m.cognitionLanguageCode, null);
    assert.equal(m.translationApplied, false);
  });

  it("prefers character primary mind language over world dominant", () => {
    const m = buildCharacterPresentationMode({
      worldLanguageEnvironment: worldFr(),
      characterPrimaryMindLanguage: "ht",
      readerPresentationLanguageCode: "en",
    });
    assert.equal(m.cognitionLanguageCode, "ht");
    assert.equal(m.nativeTongueAvailable, true);
    assert.equal(m.translationApplied, true);
  });

  it("uses world dominant when character is absent", () => {
    const m = buildCharacterPresentationMode({
      worldLanguageEnvironment: worldFr(),
      readerPresentationLanguageCode: "en",
    });
    assert.equal(m.cognitionLanguageCode, "fr");
    assert.equal(m.nativeTongueAvailable, false);
    assert.equal(m.translationApplied, true);
  });

  it("does not set translationApplied when cognition matches reader (case-insensitive)", () => {
    const m = buildCharacterPresentationMode({
      characterPrimaryMindLanguage: "EN",
      readerPresentationLanguageCode: "en",
    });
    assert.equal(m.cognitionLanguageCode, "en");
    assert.equal(m.nativeTongueAvailable, true);
    assert.equal(m.translationApplied, false);
  });

  it("treats blank character language as missing and falls through to world", () => {
    const m = buildCharacterPresentationMode({
      worldLanguageEnvironment: worldFr(),
      characterPrimaryMindLanguage: "   ",
      readerPresentationLanguageCode: "en",
    });
    assert.equal(m.cognitionLanguageCode, "fr");
    assert.equal(m.nativeTongueAvailable, false);
  });
});
