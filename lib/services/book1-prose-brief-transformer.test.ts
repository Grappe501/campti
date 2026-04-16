import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1ProseBriefTransformer } from "@/lib/services/book1-prose-brief-transformer";
import { Book1VoiceContractService } from "@/lib/services/book1-voice-contract-service";

describe("book1-prose-brief-transformer", () => {
  it("transforms outline fields into prose-only briefs", () => {
    const outline = {
      chapter: 1 as const,
      timeline: [
        {
          segment: 1,
          sceneFocus: "Opening",
          setting: "River settlement at dawn",
          characters: ["Alexis", "Augustin"],
          psychology: "fear against duty",
          narrativePurpose: "anchor",
          readerExperience: "tension",
          foreshadowing: "future stress",
          historicalContext: "context",
          transitionToNext: "next",
        },
      ],
    };
    const voiceContract = new Book1VoiceContractService().buildContract();
    const result = new Book1ProseBriefTransformer().transform({ outline, voiceContract });
    assert.equal(result.artifact, "chapter_prose_briefs");
    assert.equal(result.segments.length, 1);
    assert.equal(/reader should feel|this beat matters because|psychologically/i.test(result.segments[0].mustShow), false);
  });
});
