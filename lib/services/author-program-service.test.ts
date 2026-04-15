import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBookProgram } from "@/lib/services/book-program-service";
import {
  createAuthorProgram,
  updateAuthorBookProductionState,
} from "@/lib/services/author-program-service";

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
      createdFromPhase: "phase6_chunk6",
      sourceRunId: "run-1",
      createdAtIso: "2026-04-15T00:00:00.000Z",
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    },
    productionState: "certified",
  });
}

describe("author-program-service", () => {
  it("manages workflows across multiple books", () => {
    const program = createAuthorProgram({
      authorId: "author-1",
      books: [
        {
          bookId: "book-1",
          bookProgram: buildBookProgram("book-1"),
          productionState: "planning",
          pipelineId: "pipeline-1",
        },
        {
          bookId: "book-2",
          bookProgram: buildBookProgram("book-2"),
          productionState: "drafting",
          pipelineId: "pipeline-2",
        },
      ],
    });
    assert.equal(program.books.length, 2);
  });

  it("updates one book state without contaminating sibling books", () => {
    const initial = createAuthorProgram({
      authorId: "author-1",
      books: [
        {
          bookId: "book-1",
          bookProgram: buildBookProgram("book-1"),
          productionState: "planning",
          pipelineId: "pipeline-1",
        },
        {
          bookId: "book-2",
          bookProgram: buildBookProgram("book-2"),
          productionState: "drafting",
          pipelineId: "pipeline-2",
        },
      ],
    });
    const updated = updateAuthorBookProductionState({
      program: initial,
      bookId: "book-1",
      productionState: "revision",
    });
    assert.equal(updated.books.find((book) => book.bookId === "book-1")?.productionState, "revision");
    assert.equal(updated.books.find((book) => book.bookId === "book-2")?.productionState, "drafting");
  });
});
