import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBookProgram,
  evaluateBookProgramTraceability,
} from "@/lib/services/book-program-service";

describe("book-program-service", () => {
  it("creates a deterministic structural book program", () => {
    const program = createBookProgram({
      bookId: "book-1",
      activeArcIds: ["arc-a", "arc-b"],
      chapterQueue: [
        {
          chapterId: "chapter-1",
          orderIndex: 1,
          targetFunction: "setup",
          requiredArcStates: [{ arcId: "arc-a", requiredLifecycleState: "active" }],
          structuralReadiness: "ready",
          draftStatus: "not_started",
          revisionHistoryPointer: null,
        },
      ],
      movementMap: { "chapter-1": ["setup"] },
      unresolvedDependencies: [],
      completionCriteria: [{ criterionId: "c1", description: "all chapters assembled", satisfied: false }],
      lineage: {
        createdFromPhase: "phase4",
        sourceRunId: "run-1",
        createdAtIso: "2026-04-15T00:00:00.000Z",
        updatedAtIso: "2026-04-15T00:00:00.000Z",
      },
    });

    assert.equal(program.contractVersion, "1");
    assert.equal(program.productionState, "planning");
    assert.equal(program.chapterQueue[0]?.chapterId, "chapter-1");
  });

  it("rejects certification when completion criteria are unmet", () => {
    assert.throws(() =>
      createBookProgram({
        bookId: "book-1",
        activeArcIds: ["arc-a"],
        chapterQueue: [
          {
            chapterId: "chapter-1",
            orderIndex: 1,
            targetFunction: "setup",
            requiredArcStates: [{ arcId: "arc-a", requiredLifecycleState: "active" }],
            structuralReadiness: "ready",
            draftStatus: "approved",
            revisionHistoryPointer: "rev-1",
          },
        ],
        movementMap: { "chapter-1": ["setup"] },
        unresolvedDependencies: [],
        completionCriteria: [{ criterionId: "c1", description: "all complete", satisfied: false }],
        productionState: "certified",
        lineage: {
          createdFromPhase: "phase4",
          sourceRunId: "run-1",
          createdAtIso: "2026-04-15T00:00:00.000Z",
          updatedAtIso: "2026-04-15T00:00:00.000Z",
        },
      })
    );
  });

  it("flags unresolved dependencies in traceability evaluation", () => {
    const program = createBookProgram({
      bookId: "book-2",
      activeArcIds: ["arc-a"],
      chapterQueue: [
        {
          chapterId: "chapter-1",
          orderIndex: 1,
          targetFunction: "setup",
          requiredArcStates: [{ arcId: "arc-a", requiredLifecycleState: "active" }],
          structuralReadiness: "conditionally_ready",
          draftStatus: "in_progress",
          revisionHistoryPointer: null,
        },
      ],
      movementMap: { "chapter-1": ["setup"] },
      unresolvedDependencies: ["carryover:arc-a"],
      completionCriteria: [{ criterionId: "c1", description: "all complete", satisfied: true }],
      lineage: {
        createdFromPhase: "phase4",
        sourceRunId: "run-2",
        createdAtIso: "2026-04-15T00:00:00.000Z",
        updatedAtIso: "2026-04-15T00:00:00.000Z",
      },
    });

    const traceability = evaluateBookProgramTraceability(program);
    assert.equal(traceability.traceabilityOk, false);
    assert.ok(traceability.missingTraceability.includes("unresolved_dependencies_present"));
  });
});
