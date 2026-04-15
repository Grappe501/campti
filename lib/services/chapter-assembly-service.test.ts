import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateChapterAssembly } from "@/lib/services/chapter-assembly-service";

describe("chapter-assembly-service", () => {
  it("keeps chapter incomplete when carryover remains unresolved", () => {
    const result = evaluateChapterAssembly({
      chapterId: "chapter-2",
      dependencies: [],
      entryConditions: [{ conditionId: "entry_ok", satisfied: true }],
      completionConditions: [{ conditionId: "done", satisfied: true }],
      transitionBurden: {
        burdenId: "b1",
        sourceChapterId: "chapter-1",
        targetChapterId: "chapter-2",
        mustResolveNow: ["thread-a"],
        mustCarryForward: ["thread-b"],
        unresolvedCarryover: ["thread-b"],
      },
    });
    assert.equal(result.state.complete, false);
    assert.ok(result.state.justificationCodes.includes("carryover_unresolved_explicit"));
  });

  it("marks chapter complete only with structural justification", () => {
    const result = evaluateChapterAssembly({
      chapterId: "chapter-2",
      dependencies: [],
      entryConditions: [{ conditionId: "entry_ok", satisfied: true }],
      completionConditions: [{ conditionId: "done", satisfied: true }],
      transitionBurden: {
        burdenId: "b1",
        sourceChapterId: "chapter-1",
        targetChapterId: "chapter-2",
        mustResolveNow: ["thread-a"],
        mustCarryForward: [],
        unresolvedCarryover: [],
      },
    });
    assert.equal(result.state.complete, true);
    assert.ok(result.state.justificationCodes.includes("structural_completion_justified"));
  });

  it("blocks entry when dependencies remain unresolved", () => {
    const result = evaluateChapterAssembly({
      chapterId: "chapter-3",
      dependencies: ["arc:still-open"],
      entryConditions: [{ conditionId: "entry_ok", satisfied: true }],
      completionConditions: [{ conditionId: "done", satisfied: true }],
      transitionBurden: {
        burdenId: "b2",
        sourceChapterId: "chapter-2",
        targetChapterId: "chapter-3",
        mustResolveNow: [],
        mustCarryForward: ["thread-c"],
        unresolvedCarryover: [],
      },
    });
    assert.equal(result.output.entryStatus, "blocked");
    assert.equal(result.output.completionStatus, "incomplete");
  });
});
