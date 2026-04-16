import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1ProseShapeCriticService } from "@/lib/services/book1-prose-shape-critic-service";

describe("book1-prose-shape-critic-service", () => {
  it("flags categorized prose-shape failures with clustering summary", () => {
    const segments = [
      {
        segment: 1,
        text: "In this scene, the purpose is clear. I think we must protect the house because fear grows. The river means danger and that symbol controls the room.",
      },
      {
        segment: 2,
        text: "In this scene, the purpose is clear. I think we must protect the house because fear grows. The river means danger and that symbol controls the room.",
      },
      {
        segment: 3,
        text: "In this scene, the purpose is clear. I think we must protect the house because fear grows. The river means danger and that symbol controls the room.",
      },
    ];
    const report = new Book1ProseShapeCriticService().run({
      segments,
      fullText: segments.map((row) => row.text).join(" "),
    });
    assert.equal(report.artifact, "chapter_prose_shape_critic");
    assert.equal(report.findings.length > 0, true);
    assert.equal(report.findings.some((row) => row.category === "repeated_opener"), true);
    assert.equal(report.findings.some((row) => row.category === "summary_writing"), true);
    assert.equal(report.findings.some((row) => row.category === "repeated_thought_content"), true);
    assert.equal(report.findings.some((row) => row.category === "paraphrased_motive_repetition"), true);
    assert.equal(report.findings.some((row) => row.category === "repeated_abstract_fear_language"), true);
    assert.equal(report.findings.some((row) => row.category === "repeated_symbolic_paraphrase"), true);
    assert.equal(report.summary.mostCommonFailurePattern !== null, true);
  });
});
