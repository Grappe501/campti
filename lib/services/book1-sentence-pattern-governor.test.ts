import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1SentencePatternGovernorService } from "@/lib/services/book1-sentence-pattern-governor";

describe("book1-sentence-pattern-governor", () => {
  it("builds machine-usable constraints for opener and rhythm variety", () => {
    const plan = new Book1SentencePatternGovernorService().buildPlan({
      segments: [
        { segment: 1, sceneFocus: "Opening pressure", setting: "Riverbank settlement" },
        { segment: 2, sceneFocus: "Ritual conflict", setting: "Council hearth" },
        { segment: 3, sceneFocus: "Observation under strain", setting: "Dock edge" },
      ],
    });
    assert.equal(plan.artifact, "chapter_sentence_pattern_plan");
    assert.equal(plan.segmentPlans.length, 3);
    assert.equal(plan.segmentPlans[1].bannedRecentOpenings.length > 0, true);
    assert.equal(plan.globalConstraints.maxRepeatedOpenersInWindow, 1);
  });
});
