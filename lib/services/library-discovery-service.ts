import {
  LIBRARY_DISCOVERY_CONTRACT_VERSION,
  type LibraryStoryEntry,
  type ReaderLibrary,
  type ReaderStoryProgress,
} from "@/lib/domain/library-discovery";

function normalizeStories(stories: LibraryStoryEntry[]): LibraryStoryEntry[] {
  const seen = new Set<string>();
  const normalized: LibraryStoryEntry[] = [];
  for (const story of stories) {
    const storyId = story.storyId.trim();
    if (!storyId || seen.has(storyId)) continue;
    seen.add(storyId);
    normalized.push({
      ...story,
      storyId,
      tags: [...new Set(story.tags.map((tag) => tag.trim()).filter(Boolean))],
      entryPointSceneId: story.entryPointSceneId.trim(),
    });
  }
  return normalized;
}

export function buildReaderLibrary(input: {
  userId: string;
  availableStories: LibraryStoryEntry[];
  progress: ReaderStoryProgress[];
}): ReaderLibrary {
  const userId = input.userId.trim();
  if (!userId) {
    throw new Error("[library-discovery] userId is required.");
  }
  const stories = normalizeStories(input.availableStories);
  if (stories.length === 0) {
    throw new Error("[library-discovery] at least one story is required.");
  }

  const storyIds = new Set(stories.map((story) => story.storyId));
  for (const progressEntry of input.progress) {
    if (!storyIds.has(progressEntry.storyId)) {
      throw new Error(`[library-discovery] progress references unknown story ${progressEntry.storyId}.`);
    }
  }

  return {
    contractVersion: LIBRARY_DISCOVERY_CONTRACT_VERSION,
    userId,
    availableStories: stories,
    progress: input.progress.map((entry) => ({
      ...entry,
      completionPercent: Math.max(0, Math.min(100, entry.completionPercent)),
    })),
  };
}

export function selectStoryForResume(input: {
  library: ReaderLibrary;
  storyId: string;
}): { story: LibraryStoryEntry; progress: ReaderStoryProgress | null; resumeSceneId: string } {
  const storyId = input.storyId.trim();
  const story = input.library.availableStories.find((entry) => entry.storyId === storyId);
  if (!story) {
    throw new Error(`[library-discovery] story ${storyId} is not available for this library.`);
  }

  const progress = input.library.progress.find((entry) => entry.storyId === storyId) ?? null;
  const resumeSceneId = progress?.lastSceneId ?? story.entryPointSceneId;

  return {
    story,
    progress,
    resumeSceneId,
  };
}

export function suggestSafeStoryDiscoveries(input: {
  library: ReaderLibrary;
  maxResults: number;
}): LibraryStoryEntry[] {
  const completedStories = new Set(
    input.library.progress.filter((entry) => entry.completionPercent >= 100).map((entry) => entry.storyId)
  );

  return input.library.availableStories.filter((story) => !completedStories.has(story.storyId)).slice(0, input.maxResults);
}
