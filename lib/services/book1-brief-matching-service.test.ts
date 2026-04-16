import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DeterministicBook1BriefMatcher } from "@/lib/services/book1-brief-matching-service";
import type { Book1RawChunkFile, Book1SupportingBriefFile } from "@/lib/services/book1-bulk-ingestion-types";

describe("book1 brief matching", () => {
  it("prefers chunk number and stem alignment deterministically", () => {
    const matcher = new DeterministicBook1BriefMatcher();
    const chunk: Book1RawChunkFile = {
      chunkNumber: 6,
      uploadSequence: 6,
      fileName: "chunk6.txt",
      relativePath: "docs/book1/chunk6.txt",
      rawText: "Scene 6 at river edge with lineage echoes.",
    };
    const briefs: Book1SupportingBriefFile[] = [
      {
        fileName: "book1-chunk6-core-story-brief.md",
        relativePath: "docs/build/book1-chunk6-core-story-brief.md",
        rawText: "Scene 6 core story brief.",
      },
      {
        fileName: "book1-chunk2-core-story-brief.md",
        relativePath: "docs/build/book1-chunk2-core-story-brief.md",
        rawText: "Scene 2 core story brief.",
      },
    ];

    const result = matcher.matchChunkToBriefs(chunk, briefs);
    assert.equal(result.matchedBriefs.length >= 1, true);
    assert.equal(result.matchedBriefs[0].brief.fileName, "book1-chunk6-core-story-brief.md");
    assert.equal(result.matchedBriefs[0].signals.includes("chunk_number_match"), true);
    assert.equal(result.matchConfidence > 0.7, true);
  });
});
