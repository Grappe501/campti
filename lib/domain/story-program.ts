import type { BookProgram } from "@/lib/domain/book-program";

export const STORY_PROGRAM_CONTRACT_VERSION = "1" as const;

export type SharedWorldLink = {
  enabled: boolean;
  sharedWorldId: string | null;
  nonCanonicalSignals: string[];
};

export type StoryProgram = {
  contractVersion: typeof STORY_PROGRAM_CONTRACT_VERSION;
  storyId: string;
  bookProgram: BookProgram;
  arcStateIds: string[];
  continuityAnchorIds: string[];
  sessionIds: string[];
  sharedWorldLink: SharedWorldLink;
};
