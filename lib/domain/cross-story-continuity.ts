export const CROSS_STORY_CONTINUITY_CONTRACT_VERSION = "1" as const;

export type ReaderCarryoverPreferences = {
  pacing: "slow" | "balanced" | "fast";
  tone: "gentle" | "balanced" | "intense";
};

export type CrossStoryContinuity = {
  contractVersion: typeof CROSS_STORY_CONTINUITY_CONTRACT_VERSION;
  readerId: string;
  enabled: boolean;
  carryoverPreferences: ReaderCarryoverPreferences | null;
  nonCanonicalSignals: Record<string, string>;
  canonicalCarryoverEvents: string[];
};
