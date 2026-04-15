import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSceneSequencePlan } from "@/lib/services/scene-sequence-planner-service";

describe("scene-sequence-planner-service", () => {
  it("builds ordered slots with reveal placement and dependency links", () => {
    const plan = createSceneSequencePlan({
      chapterId: "chapter-3",
      orderedRoles: ["transition", "conflict", "reveal", "escalation"],
      dependencyLinks: { 1: [0], 2: [1], 3: [2] },
      unresolvedThreadCarryover: ["thread-x"],
    });

    assert.equal(plan.slots.length, 4);
    assert.deepEqual(plan.revealPlacementIndexes, [3]);
    assert.equal(plan.escalationProgressionValid, true);
    assert.equal(plan.slots[2]?.dependsOnSlotIds[0], "chapter-3:slot:2");
  });

  it("rejects unsupported free-form scene roles", () => {
    assert.throws(() =>
      createSceneSequencePlan({
        chapterId: "chapter-3",
        orderedRoles: ["dreamlike-prose-freeplay"],
        dependencyLinks: {},
        unresolvedThreadCarryover: [],
      })
    );
  });
});
