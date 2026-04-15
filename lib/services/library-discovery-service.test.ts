import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildReaderLibrary,
  selectStoryForResume,
  suggestSafeStoryDiscoveries,
} from "@/lib/services/library-discovery-service";

describe("library-discovery-service", () => {
  it("builds a library and resumes from reader progress", () => {
    const library = buildReaderLibrary({
      userId: "reader-1",
      availableStories: [
        { storyId: "story-a", title: "A", tags: ["origin"], entryPointSceneId: "scene-a1" },
        { storyId: "story-b", title: "B", tags: ["war"], entryPointSceneId: "scene-b1" },
      ],
      progress: [{ storyId: "story-b", completionPercent: 20, lastSceneId: "scene-b3" }],
    });
    const selected = selectStoryForResume({ library, storyId: "story-b" });
    assert.equal(selected.resumeSceneId, "scene-b3");
  });

  it("rejects progress that points to unknown stories", () => {
    assert.throws(() =>
      buildReaderLibrary({
        userId: "reader-1",
        availableStories: [{ storyId: "story-a", title: "A", tags: [], entryPointSceneId: "scene-a1" }],
        progress: [{ storyId: "story-x", completionPercent: 10, lastSceneId: "scene-x1" }],
      })
    );
  });

  it("returns safe recommendations from incomplete stories", () => {
    const library = buildReaderLibrary({
      userId: "reader-1",
      availableStories: [
        { storyId: "story-a", title: "A", tags: [], entryPointSceneId: "scene-a1" },
        { storyId: "story-b", title: "B", tags: [], entryPointSceneId: "scene-b1" },
      ],
      progress: [{ storyId: "story-a", completionPercent: 100, lastSceneId: "scene-a9" }],
    });
    const suggestions = suggestSafeStoryDiscoveries({ library, maxResults: 2 });
    assert.deepEqual(
      suggestions.map((story) => story.storyId),
      ["story-b"]
    );
  });
});
