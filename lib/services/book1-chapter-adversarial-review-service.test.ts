import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1ChapterAdversarialReviewService } from "@/lib/services/book1-chapter-adversarial-review-service";

describe("book1-chapter-adversarial-review-service", () => {
  it("includes prose-shape critic findings in adversarial summary", () => {
    const review = new Book1ChapterAdversarialReviewService().run({
      chapterDraft: {
        artifact: "chapter_draft",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        composerInputs: ["chapter_law"],
        title: "Chapter 1 - Test",
        segments: [
          { segment: 1, objective: "x", text: "In this scene, the purpose is clear. In this scene, the purpose is clear.", evidenceRefs: [] },
          { segment: 2, objective: "x", text: "In this scene, the purpose is clear. In this scene, the purpose is clear.", evidenceRefs: [] },
        ],
        fullText:
          "Chapter 1 - Test In this scene, the purpose is clear. In this scene, the purpose is clear. In this scene, the purpose is clear.",
      },
      outline: {
        chapter: 1,
        timeline: [
          {
            segment: 1,
            sceneFocus: "Focus",
            setting: "River",
            characters: ["Alexis"],
            psychology: "fear",
            narrativePurpose: "purpose",
            readerExperience: "experience",
            foreshadowing: "foreshadow",
            historicalContext: "history",
            transitionToNext: "next",
          },
          {
            segment: 2,
            sceneFocus: "Focus",
            setting: "River",
            characters: ["Alexis"],
            psychology: "fear",
            narrativePurpose: "purpose",
            readerExperience: "experience",
            foreshadowing: "foreshadow",
            historicalContext: "history",
            transitionToNext: "next",
          },
        ],
      },
    });
    assert.equal(review.proseShapeCritic.critic, "Prose Shape Critic");
    assert.equal(review.summary.critics.proseShape.findingCount >= 1, true);
  });
});
