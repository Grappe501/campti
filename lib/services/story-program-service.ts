import {
  STORY_PROGRAM_CONTRACT_VERSION,
  type SharedWorldLink,
  type StoryProgram,
} from "@/lib/domain/story-program";

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSharedWorldLink(sharedWorldLink?: Partial<SharedWorldLink>): SharedWorldLink {
  if (!sharedWorldLink?.enabled) {
    return {
      enabled: false,
      sharedWorldId: null,
      nonCanonicalSignals: [],
    };
  }

  const sharedWorldId = sharedWorldLink.sharedWorldId?.trim() ?? "";
  if (!sharedWorldId) {
    throw new Error("[story-program] sharedWorldId is required when shared-world linking is enabled.");
  }

  return {
    enabled: true,
    sharedWorldId,
    nonCanonicalSignals: uniqueNonEmpty(sharedWorldLink.nonCanonicalSignals ?? []),
  };
}

export function createStoryProgram(input: {
  storyId: string;
  bookProgram: StoryProgram["bookProgram"];
  arcStateIds: string[];
  continuityAnchorIds: string[];
  sessionIds: string[];
  sharedWorldLink?: Partial<SharedWorldLink>;
}): StoryProgram {
  const storyId = input.storyId.trim();
  if (!storyId) {
    throw new Error("[story-program] storyId is required.");
  }

  const arcStateIds = uniqueNonEmpty(input.arcStateIds);
  const continuityAnchorIds = uniqueNonEmpty(input.continuityAnchorIds);
  const sessionIds = uniqueNonEmpty(input.sessionIds);

  return {
    contractVersion: STORY_PROGRAM_CONTRACT_VERSION,
    storyId,
    bookProgram: input.bookProgram,
    arcStateIds,
    continuityAnchorIds,
    sessionIds,
    sharedWorldLink: normalizeSharedWorldLink(input.sharedWorldLink),
  };
}

export function assertStoryProgramIsolation(programs: StoryProgram[]): void {
  const arcToStory = new Map<string, string>();
  const continuityToStory = new Map<string, string>();
  const sessionToStory = new Map<string, string>();

  for (const program of programs) {
    for (const arcId of program.arcStateIds) {
      const owner = arcToStory.get(arcId);
      if (owner && owner !== program.storyId) {
        throw new Error(`[story-program] arc ${arcId} overlaps across stories ${owner} and ${program.storyId}.`);
      }
      arcToStory.set(arcId, program.storyId);
    }

    for (const continuityAnchorId of program.continuityAnchorIds) {
      const owner = continuityToStory.get(continuityAnchorId);
      if (owner && owner !== program.storyId) {
        throw new Error(
          `[story-program] continuity anchor ${continuityAnchorId} overlaps across stories ${owner} and ${program.storyId}.`
        );
      }
      continuityToStory.set(continuityAnchorId, program.storyId);
    }

    for (const sessionId of program.sessionIds) {
      const owner = sessionToStory.get(sessionId);
      if (owner && owner !== program.storyId) {
        throw new Error(
          `[story-program] session ${sessionId} overlaps across stories ${owner} and ${program.storyId}.`
        );
      }
      sessionToStory.set(sessionId, program.storyId);
    }
  }
}
