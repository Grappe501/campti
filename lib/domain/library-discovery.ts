export const LIBRARY_DISCOVERY_CONTRACT_VERSION = "1" as const;

export type LibraryStoryEntry = {
  storyId: string;
  title: string;
  tags: string[];
  entryPointSceneId: string;
};

export type ReaderStoryProgress = {
  storyId: string;
  completionPercent: number;
  lastSceneId: string | null;
};

export type ReaderLibrary = {
  contractVersion: typeof LIBRARY_DISCOVERY_CONTRACT_VERSION;
  userId: string;
  availableStories: LibraryStoryEntry[];
  progress: ReaderStoryProgress[];
};
