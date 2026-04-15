/**
 * P2-J — Voice presentation **service**: {@link CharacterResponse} → {@link VoicePresentationPayload}.
 *
 * - Prepares **spoken** text for downstream voice rendering (TTS, SSML, or provider adapters).
 * - **Translation** language fields are presentation / routing metadata only (not cognition).
 * - **`internalThought` is never included** in the payload; callers must not merge it into audio text.
 * - **No network calls**, no synthesis, no ElevenLabs or other provider integration — adapter-agnostic.
 *
 * Stays separate from: response assembly (P2-I.2), transcript persistence, and author/God modes.
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type {
  BuildVoicePresentationPayloadOptions,
  VoicePresentationPayload,
} from "@/lib/domain/voice-presentation";
import { buildVoicePerformanceProfile } from "@/lib/services/voice-performance-service";

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Uses {@link CharacterResponse.spokenResponse} only — never `internalThought`. */
function cleanSpokenLine(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").trim();

  s = s.replace(/^```[\w]*\n?([\s\S]*?)\n?```$/m, "$1").trim();
  s = s.replace(/\[[^\]]{1,120}\]/g, " ");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  return collapseWhitespace(s);
}

function deliveryHintForKnowledgeSource(source: CharacterResponse["knowledgeSource"]): string {
  switch (source) {
    case "known":
      return "delivery: grounded stance (firm in-world claim)";
    case "belief":
      return "delivery: interpretive stance (softer certainty)";
    case "uncertain":
      return "delivery: tentative stance (leave rhythmic space)";
  }
}

/**
 * Build the canonical voice presentation payload from a validated {@link CharacterResponse}.
 * Does not read or surface `internalThought`.
 */
export function buildVoicePresentationPayload(
  characterResponse: CharacterResponse,
  options?: BuildVoicePresentationPayloadOptions
): VoicePresentationPayload {
  const cleanedSpokenText = cleanSpokenLine(characterResponse.spokenResponse);
  const emotionalTone = collapseWhitespace(characterResponse.emotionalTone);

  const performanceProfile = buildVoicePerformanceProfile({
    response: characterResponse,
    emotionalContinuity: options?.emotionalContinuity ?? null,
    presentationMode: options?.presentationMode ?? null,
    voiceProfile: options?.voiceProfile ?? null,
  });

  const pauseHints = [
    deliveryHintForKnowledgeSource(characterResponse.knowledgeSource),
    `pause_strategy:${performanceProfile.pauseStrategy}`,
  ];

  const out: VoicePresentationPayload = {
    cleanedSpokenText,
    emotionalTone,
    pauseHints,
    performanceProfile,
  };

  if (options?.pronunciationHints?.length) {
    out.pronunciationHints = [...options.pronunciationHints];
  }
  if (performanceProfile.pronunciationGuidance?.length) {
    out.pronunciationHints = [...(out.pronunciationHints ?? []), ...performanceProfile.pronunciationGuidance];
  }
  if (options?.nativeLanguageCode !== undefined) {
    out.nativeLanguageCode = options.nativeLanguageCode;
  }
  if (options?.translatedLanguageCode !== undefined) {
    out.translatedLanguageCode = options.translatedLanguageCode;
  }

  return out;
}
