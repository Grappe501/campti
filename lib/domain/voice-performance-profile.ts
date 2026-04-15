/**
 * P3-P — Deterministic voice performance enrichment (provider-agnostic).
 */
export type VoicePerformanceProfile = {
  pauseStrategy: "minimal" | "measured" | "dramatic";
  emphasisHints: string[];
  toneIntensityHint: "low" | "medium" | "high";
  speakingStyleHints: string[];
  pronunciationGuidance?: string[];
};
