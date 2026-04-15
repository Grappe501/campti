/**
 * P2-J — Voice presentation layer (TTS prep).
 *
 * Canonical building block is {@link buildVoicePresentationPayload} in `./voice-presentation-service`.
 * {@link toVoiceReadyText} remains a narrow legacy shape for callers that expect `cleanedSpeech` +
 * `emotionalCues`; it never places `internalThought` in the spoken string or cue list.
 *
 * **No network calls** — provider adapters consume {@link VoicePresentationPayload} or the legacy shape.
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import { buildVoicePresentationPayload } from "@/lib/voice/voice-presentation-service";

export type { BuildVoicePresentationPayloadOptions, VoicePresentationPayload } from "@/lib/domain/voice-presentation";
export { buildVoicePresentationPayload } from "@/lib/voice/voice-presentation-service";

/**
 * @deprecated Prefer {@link VoicePresentationPayload} via {@link buildVoicePresentationPayload}.
 * Legacy adapter for older call sites (`cleanedSpeech` + flat `emotionalCues` list).
 */
export type VoiceReadyText = {
  cleanedSpeech: string;
  emotionalCues: string[];
};

/**
 * @deprecated Prefer {@link buildVoicePresentationPayload}.
 * Maps canonical payload to the legacy cue list (no `internalThought` content).
 */
export function toVoiceReadyText(response: CharacterResponse): VoiceReadyText {
  const p = buildVoicePresentationPayload(response);
  const emotionalCues: string[] = [];
  if (p.emotionalTone) {
    emotionalCues.push(`tone: ${p.emotionalTone}`);
  }
  emotionalCues.push(...p.pauseHints);
  return {
    cleanedSpeech: p.cleanedSpokenText,
    emotionalCues,
  };
}
