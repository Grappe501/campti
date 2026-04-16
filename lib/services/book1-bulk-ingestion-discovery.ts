import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Book1IngestionRange, Book1RawChunkFile, Book1SupportingBriefFile } from "@/lib/services/book1-bulk-ingestion-types";

type DiscoveryOptions = {
  workspaceRoot?: string;
  docsBook1Dir?: string;
  docsBuildDir?: string;
};

const RAW_CHUNK_FILE_PATTERN = /^chunk\s*(\d+)\.txt$/i;

export class FilesystemBook1CorpusProvider {
  constructor(private readonly options: DiscoveryOptions = {}) {}

  async discoverRawChunks(range: Book1IngestionRange): Promise<Book1RawChunkFile[]> {
    const docsBook1Dir = this.options.docsBook1Dir ?? path.join(this.workspaceRoot, "docs", "book1");
    const files = await readdir(docsBook1Dir, { withFileTypes: true });
    const discovered: Book1RawChunkFile[] = [];

    for (const entry of files) {
      if (!entry.isFile()) continue;
      const chunkMatch = entry.name.match(RAW_CHUNK_FILE_PATTERN);
      if (!chunkMatch) continue;

      const chunkNumber = Number(chunkMatch[1]);
      if (range.fromChunk !== null && chunkNumber < range.fromChunk) continue;
      if (range.toChunk !== null && chunkNumber > range.toChunk) continue;

      const absolutePath = path.join(docsBook1Dir, entry.name);
      const rawText = await readFile(absolutePath, "utf8");

      discovered.push({
        chunkNumber,
        uploadSequence: chunkNumber,
        fileName: entry.name,
        relativePath: normalizeRelativePath(path.relative(this.workspaceRoot, absolutePath)),
        absolutePath,
        rawText,
      });
    }

    discovered.sort((a, b) => a.chunkNumber - b.chunkNumber);
    return discovered;
  }

  async discoverSupportingBriefs(): Promise<Book1SupportingBriefFile[]> {
    const docsBuildDir = this.options.docsBuildDir ?? path.join(this.workspaceRoot, "docs", "build");
    const files = await readdir(docsBuildDir, { withFileTypes: true });
    const briefs: Book1SupportingBriefFile[] = [];

    for (const entry of files) {
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (![".md", ".markdown", ".txt"].includes(extension)) continue;

      const absolutePath = path.join(docsBuildDir, entry.name);
      const rawText = await readFile(absolutePath, "utf8");
      briefs.push({
        fileName: entry.name,
        relativePath: normalizeRelativePath(path.relative(this.workspaceRoot, absolutePath)),
        absolutePath,
        rawText,
      });
    }

    briefs.sort((a, b) => a.fileName.localeCompare(b.fileName));
    return briefs;
  }

  private get workspaceRoot(): string {
    return this.options.workspaceRoot ?? process.cwd();
  }
}

export function parseChunkNumberFromFileName(fileName: string): number | null {
  const match = fileName.match(/chunk\s*(\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/");
}
