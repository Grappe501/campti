/**
 * Premium-ready content categories (no billing enforcement yet).
 * Used to tag passes, assets, and UI gates consistently.
 */
export const PREMIUM_CONTENT_CATEGORIES = {
  alternateVoicePass: "alternate_voice_pass",
  extendedNarrativePass: "extended_narrative_pass",
  premiumAudio: "premium_audio",
  deepSymbolEssay: "deep_symbol_essay",
  expandedCharacterHistory: "expanded_character_history",
  relationshipDeepDive: "relationship_deep_dive",
  alternatePovPass: "alternate_pov_pass",
  premiumCinematicPass: "premium_cinematic_pass",
  extendedAudioNarration: "extended_audio_narration",
  deepSymbolicExperience: "deep_symbolic_experience",
  characterVoiceMonologue: "character_voice_monologue",
} as const;

export type PremiumContentCategory =
  (typeof PREMIUM_CONTENT_CATEGORIES)[keyof typeof PREMIUM_CONTENT_CATEGORIES];

export function isPremiumCategory(value: string): value is PremiumContentCategory {
  return (Object.values(PREMIUM_CONTENT_CATEGORIES) as string[]).includes(value);
}
