/**
 * P3-P — Voice performance enrichment service.
 *
 * Provider-agnostic deterministic hints derived from response tone and continuity.
 */
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { CharacterVoiceProfileAssignment } from "@/lib/domain/character-voice-profile";
import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";
import type { VoicePerformanceProfile } from "@/lib/domain/voice-performance-profile";

function intensityFromTone(tone: string): VoicePerformanceProfile["toneIntensityHint"] {
  const t = tone.toLowerCase();
  if (/\b(charged|angry|fearful|urgent|joyful)\b/.test(t)) return "high";
  if (/\b(wary|guarded|tense|warm)\b/.test(t)) return "medium";
  return "low";
}

function pauseStrategyForTone(
  intensity: VoicePerformanceProfile["toneIntensityHint"]
): VoicePerformanceProfile["pauseStrategy"] {
  if (intensity === "high") return "dramatic";
  if (intensity === "medium") return "measured";
  return "minimal";
}

function emphasisHints(response: CharacterResponse, continuity: ConversationEmotionalContinuity | null): string[] {
  const out: string[] = [];
  if (response.knowledgeSource === "uncertain") out.push("soft certainty endings");
  if (continuity?.carryoverSignals.some((s) => s.includes("unresolved_topics"))) {
    out.push("hold tension on unresolved clauses");
  }
  if (response.spokenResponse.includes("?")) out.push("slight lift on interrogatives");
  return out.slice(0, 4);
}

function speakingStyleHints(input: {
  response: CharacterResponse;
  presentationMode: CharacterPresentationMode | null;
  voiceProfile: CharacterVoiceProfileAssignment | null;
}): string[] {
  const out: string[] = [];
  if (input.presentationMode?.translationApplied) out.push("slower phrasing for translated cadence");
  if (input.response.knowledgeSource === "known") out.push("grounded declarative cadence");
  if (input.voiceProfile?.displayLabel?.trim()) out.push(`voice profile: ${input.voiceProfile.displayLabel.trim()}`);
  return out.slice(0, 4);
}

function pronunciationGuidance(input: {
  presentationMode: CharacterPresentationMode | null;
  continuity: ConversationEmotionalContinuity | null;
}): string[] | undefined {
  const out: string[] = [];
  if (input.presentationMode?.nativeTongueAvailable) {
    out.push(`respect native cognition code: ${input.presentationMode.cognitionLanguageCode ?? "unknown"}`);
  }
  if (input.continuity?.currentConversationTone === "wary") {
    out.push("clip final consonants less aggressively");
  }
  return out.length ? out.slice(0, 3) : undefined;
}

export function buildVoicePerformanceProfile(input: {
  response: CharacterResponse;
  emotionalContinuity?: ConversationEmotionalContinuity | null;
  presentationMode?: CharacterPresentationMode | null;
  voiceProfile?: CharacterVoiceProfileAssignment | null;
}): VoicePerformanceProfile {
  const continuity = input.emotionalContinuity ?? null;
  const effectiveTone = continuity?.currentConversationTone?.trim() || input.response.emotionalTone;
  const toneIntensityHint = intensityFromTone(effectiveTone);
  return {
    pauseStrategy: pauseStrategyForTone(toneIntensityHint),
    emphasisHints: emphasisHints(input.response, continuity),
    toneIntensityHint,
    speakingStyleHints: speakingStyleHints({
      response: input.response,
      presentationMode: input.presentationMode ?? null,
      voiceProfile: input.voiceProfile ?? null,
    }),
    pronunciationGuidance: pronunciationGuidance({
      presentationMode: input.presentationMode ?? null,
      continuity,
    }),
  };
}
