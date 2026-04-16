import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1LivedHistoryTransformer } from "@/lib/services/book1-lived-history-transformer";

describe("book1-lived-history-transformer", () => {
  it("builds lived-history packets without citation residue", () => {
    const outline = {
      chapter: 1 as const,
      timeline: [
        {
          segment: 1,
          sceneFocus: "Opening",
          setting: "River edge",
          characters: ["Alexis"],
          psychology: "pressure",
          narrativePurpose: "anchor",
          readerExperience: "tension",
          foreshadowing: "future",
          historicalContext: "context",
          transitionToNext: "next",
        },
      ],
    };
    const result = new Book1LivedHistoryTransformer().transform({
      outline,
      evidence: [{ statement: "https://example.com [1] - labor rhythms define obligation." }],
    });
    assert.equal(result.artifact, "chapter_lived_history");
    assert.equal(result.packets.length, 1);
    assert.equal(/https?:\/\//i.test(result.packets[0].environment), false);
  });
});
