export const CONTENT_RELEASE_CONTRACT_VERSION = "1" as const;

export const CONTENT_VERSION_STATES = ["draft", "candidate", "published", "archived"] as const;
export type ContentVersionState = (typeof CONTENT_VERSION_STATES)[number];

export type StoryContentVersion = {
  versionId: string;
  storyId: string;
  state: ContentVersionState;
  createdAtIso: string;
};

export type StoryReleaseLedger = {
  contractVersion: typeof CONTENT_RELEASE_CONTRACT_VERSION;
  storyId: string;
  versions: StoryContentVersion[];
};
