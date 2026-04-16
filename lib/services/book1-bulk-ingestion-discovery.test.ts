import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { FilesystemBook1CorpusProvider } from "@/lib/services/book1-bulk-ingestion-discovery";

describe("book1 bulk ingestion discovery", () => {
  it("discovers raw chunks and applies range filter", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "book1-discovery-"));
    await mkdir(path.join(root, "docs", "book1"), { recursive: true });
    await mkdir(path.join(root, "docs", "build"), { recursive: true });

    await writeFile(path.join(root, "docs", "book1", "chunk1.txt"), "scene text 1", "utf8");
    await writeFile(path.join(root, "docs", "book1", "chunk2.txt"), "scene text 2", "utf8");
    await writeFile(path.join(root, "docs", "book1", "chunk8.txt"), "scene text 8", "utf8");
    await writeFile(path.join(root, "docs", "build", "book1-chunk2-core-story-brief.md"), "brief", "utf8");

    const provider = new FilesystemBook1CorpusProvider({ workspaceRoot: root });
    const chunks = await provider.discoverRawChunks({ fromChunk: 2, toChunk: 8 });
    const briefs = await provider.discoverSupportingBriefs();

    assert.deepEqual(
      chunks.map((chunk) => chunk.chunkNumber),
      [2, 8],
    );
    assert.equal(chunks[0].relativePath.includes("docs/book1/chunk2.txt"), true);
    assert.equal(briefs.length, 1);
    assert.equal(briefs[0].fileName, "book1-chunk2-core-story-brief.md");
  });
});
