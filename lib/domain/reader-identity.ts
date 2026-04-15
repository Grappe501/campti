export const READER_IDENTITY_CONTRACT_VERSION = "1" as const;

export type ReaderAccountMetadata = {
  tier: "free" | "premium" | "enterprise";
  locale: string;
  createdAtIso: string;
};

export type ReaderPreferences = {
  pacing: "slow" | "balanced" | "fast";
  presentationLanguageCode: string;
  audioEnabled: boolean;
};

export type ReaderLibraryState = {
  storyProgressByStoryId: Record<string, { lastSceneId: string | null; completionPercent: number }>;
  pinnedStoryIds: string[];
};

export type ReaderIdentity = {
  contractVersion: typeof READER_IDENTITY_CONTRACT_VERSION;
  userId: string;
  accountMetadata: ReaderAccountMetadata;
  preferences: ReaderPreferences;
  libraryState: ReaderLibraryState;
};
