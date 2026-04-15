import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBookProgram } from "@/lib/services/book-program-service";
import { assertStoryProgramIsolation, createStoryProgram } from "@/lib/services/story-program-service";

function buildBookProgram(bookId: string) {
  return createBookProgram({
    bookId,
    activeArcIds: ["arc-core"],
    chapterQueue: [
      {
        chapterId: `${bookId}-chapter-1`,
        orderIndex: 1,
        targetFunction: "setup",
        requiredArcStates: [{ arcId: "arc-core", requiredLifecycleState: "active" }],
        structuralReadiness: "ready",
        draftStatus: "approved",
        revisionHistoryPointer: null,
      },
    ],
    movementMap: { chapter_1: ["setup"] },
    unresolvedDependencies: [],
    completionCriteria: [{ criterionId: "criterion-1", description: "ready", satisfied: true }],
    lineage: {
      createdFromPhase: "phase6_chunk1",
      sourceRunId: "run-1",
      createdAtIso: "2026-04-15T00:00:00.000Z",
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    },
    productionState: "certified",
  });
}

describe("story-program-service", () => {
  it("defaults shared world linking to disabled", () => {
    const program = createStoryProgram({
      storyId: "story-alpha",
      bookProgram: buildBookProgram("book-alpha"),
      arcStateIds: ["arc-alpha"],
      continuityAnchorIds: ["cont-alpha"],
      sessionIds: ["session-alpha"],
    });
    assert.equal(program.sharedWorldLink.enabled, false);
    assert.equal(program.sharedWorldLink.sharedWorldId, null);
  });

  it("rejects cross-story overlap for arc ids", () => {
    const alpha = createStoryProgram({
      storyId: "story-alpha",
      bookProgram: buildBookProgram("book-alpha"),
      arcStateIds: ["arc-shared"],
      continuityAnchorIds: ["cont-alpha"],
      sessionIds: ["session-alpha"],
    });
    const beta = createStoryProgram({
      storyId: "story-beta",
      bookProgram: buildBookProgram("book-beta"),
      arcStateIds: ["arc-shared"],
      continuityAnchorIds: ["cont-beta"],
      sessionIds: ["session-beta"],
    });
    assert.throws(() => assertStoryProgramIsolation([alpha, beta]));
  });
});
