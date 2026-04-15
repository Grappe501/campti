/**
 * P2-S — Build {@link CharacterPresentationMode} from world + character hints.
 * No translation generation and no UI; deterministic flags only.
 */

import type { WorldStateLanguageEnvironment } from "@/lib/domain/thought-language";
import {
  DEFAULT_READER_PRESENTATION_LANGUAGE_CODE,
  type CharacterPresentationMode,
} from "@/lib/domain/translation-presentation";

export type BuildCharacterPresentationModeParams = {
  /**
   * Era/world language ecology when available (e.g. from
   * {@link buildWorldStateLanguageEnvironment} / `WorldStateReference.languageEnvironmentJson`).
   */
  worldLanguageEnvironment?: WorldStateLanguageEnvironment | null;
  /**
   * Character cognition language when available — typically `ThoughtLanguageProfile.primaryMindLanguage`
   * or `CharacterCore.mindLanguagePrimary` after trim.
   */
  characterPrimaryMindLanguage?: string | null;
  /**
   * Reader-facing presentation locale (browser/session/product default). Falls back to
   * {@link DEFAULT_READER_PRESENTATION_LANGUAGE_CODE}.
   */
  readerPresentationLanguageCode?: string | null;
};

function normalizeLangCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  return t.toLowerCase();
}

function firstWorldCognitionCode(world: WorldStateLanguageEnvironment | null | undefined): string | null {
  const first = world?.dominantLanguages?.[0]?.code;
  return normalizeLangCode(first ?? undefined);
}

/**
 * Resolve native-tongue vs translated-presentation metadata for a character turn or snapshot.
 *
 * Precedence for `cognitionLanguageCode`: character mind language → world dominant (first) → null.
 * `nativeTongueAvailable` is true only when the character supplied a non-empty primary mind language.
 */
export function buildCharacterPresentationMode(
  params: BuildCharacterPresentationModeParams
): CharacterPresentationMode {
  const readerPresentationLanguageCode =
    normalizeLangCode(params.readerPresentationLanguageCode ?? undefined) ??
    DEFAULT_READER_PRESENTATION_LANGUAGE_CODE;

  const fromCharacter = normalizeLangCode(params.characterPrimaryMindLanguage ?? undefined);
  const fromWorld = firstWorldCognitionCode(params.worldLanguageEnvironment ?? undefined);

  const cognitionLanguageCode = fromCharacter ?? fromWorld ?? null;
  const nativeTongueAvailable = fromCharacter != null;

  const translationApplied =
    cognitionLanguageCode != null && cognitionLanguageCode !== readerPresentationLanguageCode;

  return {
    cognitionLanguageCode,
    readerPresentationLanguageCode,
    translationApplied,
    nativeTongueAvailable,
  };
}
