/**
 * P2-J — Canonical **voice presentation** shapes (spoken rendering metadata only).
 *
 * This is not synthesis, not a provider API, and not {@link CharacterResponse} assembly.
 * Translation and language fields here are **presentation / routing** hints for voice pipelines.
 */

import type { CharacterVoiceProfileAssignment } from "@/lib/domain/character-voice-profile";
import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";
import type { VoicePerformanceProfile } from "@/lib/domain/voice-performance-profile";

/**
 * Bounded, provider-agnostic payload: cleaned text to speak plus deterministic delivery hints.
 * Does not include inner monologue; {@link CharacterResponse.internalThought} must never be copied in.
 */
export type VoicePresentationPayload = {
  /** {@link CharacterResponse.spokenResponse} after cleanup only. */
  cleanedSpokenText: string;
  /** Echo of {@link CharacterResponse.emotionalTone} (trimmed). */
  emotionalTone: string;
  /** Non-spoken rhythm / delivery hints for TTS direction (e.g. stance, pause posture). */
  pauseHints: string[];
  performanceProfile?: VoicePerformanceProfile;
  pronunciationHints?: string[];
  nativeLanguageCode?: string | null;
  translatedLanguageCode?: string | null;
};

export type BuildVoicePresentationPayloadOptions = {
  nativeLanguageCode?: string | null;
  translatedLanguageCode?: string | null;
  pronunciationHints?: string[];
  emotionalContinuity?: ConversationEmotionalContinuity | null;
  presentationMode?: CharacterPresentationMode | null;
  voiceProfile?: CharacterVoiceProfileAssignment | null;
};
