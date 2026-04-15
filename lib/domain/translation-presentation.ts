/**
 * P2-S — Native-tongue vs reader-facing presentation (metadata only).
 *
 * **Cognition** is modeled in-world: inner speech and character-side reasoning use the character’s
 * linguistic frame (mind language, spoken profile, era register). That is not the same surface the
 * reader reads unless the product explicitly aligns them.
 *
 * **Translation** here is a *presentation* label: it records that the reader’s display language may
 * differ from the cognition language. This module does **not** call translators or emit localized
 * strings—only deterministic flags and codes for routing, prompts, and observability.
 */

/** Default when no reader locale is passed to the builder. */
export const DEFAULT_READER_PRESENTATION_LANGUAGE_CODE = "en" as const;

/**
 * How a conversational / character output relates linguistically to the reader’s presentation locale.
 *
 * - `cognitionLanguageCode`: best-effort tag for the language frame used for **in-world cognition**
 *   (character thought, diegetic inner voice). May be null when neither character nor world supplied
 *   a resolvable code.
 * - `readerPresentationLanguageCode`: language the **reader** is assumed to read in (product default
 *   or session preference). Does not imply any particular UI.
 * - `translationApplied`: true when cognition and reader presentation codes differ (normalized); false
 *   when unknown cognition or same code.
 * - `nativeTongueAvailable`: true when cognition language came from **character-specific** inputs
 *   (explicit mind language), not from era/world fallback alone.
 */
export type CharacterPresentationMode = {
  cognitionLanguageCode: string | null;
  readerPresentationLanguageCode: string;
  translationApplied: boolean;
  nativeTongueAvailable: boolean;
};
