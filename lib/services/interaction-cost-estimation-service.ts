/**
 * P2-W — Heuristic **cost units** for conversational interactions (metering / planning).
 *
 * This is an **estimation layer** for a future token or credit economy — not quoted prices, not tax
 * authority, and not final billing truth. Product and finance must replace or calibrate these formulas
 * before any user-facing charges.
 *
 * **No payment integration** and no provider-specific pricing — only dimensionless integers suitable
 * for ledger rows (e.g. {@link ReaderInteractionLedgerEntry}).
 */

import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";

/** Default presentation when voice is counted but no payload was supplied (deterministic, neutral). */
export const NEUTRAL_VOICE_PRESENTATION: CharacterPresentationMode = {
  cognitionLanguageCode: null,
  readerPresentationLanguageCode: "en",
  translationApplied: false,
  nativeTongueAvailable: false,
};

function countWords(trimmed: string): number {
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Text-side units: **trimmed character count** (JS string length after `trim`) + **word count**
 * on that same trimmed slice. Leading/trailing whitespace does not add units.
 */
export function estimateTextTurnCostUnits(text: string): number {
  const t = text.trim();
  const charCount = t.length;
  const wordCount = countWords(t);
  return charCount + wordCount;
}

/** Flat voice path overhead + small bump when translation presentation is active (routing complexity). */
const VOICE_RENDER_BASE_UNITS = 64;
const VOICE_RENDER_TRANSLATION_BUMP_UNITS = 16;

/**
 * Voice synthesis slice: does not use audio duration (unknown here) — only presentation metadata.
 */
export function estimateVoiceRenderCostUnits(
  voicePresentationPayload: CharacterPresentationMode
): number {
  let u = VOICE_RENDER_BASE_UNITS;
  if (voicePresentationPayload.translationApplied) {
    u += VOICE_RENDER_TRANSLATION_BUMP_UNITS;
  }
  return u;
}

export type EstimateConversationTurnCostUnitsInput = {
  /** Reader message (or empty). */
  readerText: string;
  /** Character spoken line for the turn. */
  characterSpokenResponse: string;
  /** Inner thought / cognition text (often excluded from TTS). */
  characterInternalThought: string;
  /** When true, adds {@link estimateVoiceRenderCostUnits} using `voicePresentationPayload` or neutral default. */
  includeVoiceRender: boolean;
  /** Required when `includeVoiceRender` is true for meaningful voice metadata; otherwise neutral defaults apply. */
  voicePresentationPayload?: CharacterPresentationMode | null;
};

export type ConversationTurnCostEstimate = {
  textTurnCostUnits: number;
  voiceRenderCostUnits: number;
  totalCostUnits: number;
};

/**
 * One turn: combined text material (reader + spoken + internal) as a single text estimate, plus
 * optional voice path units.
 */
export function estimateConversationTurnCostUnits(
  input: EstimateConversationTurnCostUnitsInput
): ConversationTurnCostEstimate {
  const combined = [input.readerText, input.characterSpokenResponse, input.characterInternalThought].join(
    "\n"
  );
  const textTurnCostUnits = estimateTextTurnCostUnits(combined);

  const voiceRenderCostUnits = input.includeVoiceRender
    ? estimateVoiceRenderCostUnits(input.voicePresentationPayload ?? NEUTRAL_VOICE_PRESENTATION)
    : 0;

  return {
    textTurnCostUnits,
    voiceRenderCostUnits,
    totalCostUnits: textTurnCostUnits + voiceRenderCostUnits,
  };
}
