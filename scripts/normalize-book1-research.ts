import "./load-env";
import { readFile } from "fs/promises";
import { join } from "path";
import { RecordType, SourceType, VisibilityStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const DEFAULT_SOURCE_ID = "book1-source-chunk-1";
const DEFAULT_RELATIVE_FILE_PATH = "docs/book1/chunk 1.txt";
const NORMALIZED_STATUS = "normalized_script_book1";
const CHUNK_TARGET_CHARS = 3500;
const MAX_TEXT_CHARS = 5_000_000;

function parseArgs() {
  const args = process.argv.slice(2);
  let sourceId = DEFAULT_SOURCE_ID;
  let relativeFilePath = DEFAULT_RELATIVE_FILE_PATH;
  let title = "Book 1 Research Chunk 1";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--source-id" && args[i + 1]) {
      sourceId = args[++i];
    } else if (arg === "--file" && args[i + 1]) {
      relativeFilePath = args[++i].replace(/\\/g, "/");
    } else if (arg === "--title" && args[i + 1]) {
      title = args[++i];
    }
  }

  return { sourceId, relativeFilePath, title };
}

function normalizeResearchText(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];

  let inFootnoteBlock = false;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const compact = line.trim();

    if (!compact) {
      kept.push("");
      continue;
    }

    if (/^\[\d+\]:\s+https?:\/\//i.test(compact)) {
      inFootnoteBlock = true;
      kept.push(line);
      continue;
    }
    if (inFootnoteBlock && !compact.startsWith("[") && compact.includes("http")) {
      kept.push(line);
      continue;
    }

    if (compact.startsWith("[![") || compact.startsWith("![Image]")) continue;
    if (compact.includes("images.openai.com/static-rsc-")) continue;
    if (/^yes\.\s+let.s build it as a layered portrait\.?$/i.test(compact)) continue;
    if (/^alright.?this is the right instinct/i.test(compact)) continue;
    if (/^what i.m going to do here is/i.test(compact)) continue;
    if (/^next,\s+i.d layer outward/i.test(compact)) continue;
    if (compact === "---") continue;

    kept.push(line);
  }

  const joined = kept.join("\n");
  const compactNewlines = joined
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  if (compactNewlines.length > MAX_TEXT_CHARS) {
    return compactNewlines.slice(0, MAX_TEXT_CHARS);
  }
  return compactNewlines;
}

function chunkTextByParagraph(text: string, targetChars = CHUNK_TARGET_CHARS): string[] {
  const paragraphs = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= targetChars) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);

    if (paragraph.length <= targetChars) {
      current = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + targetChars, paragraph.length);
      const piece = paragraph.slice(start, end).trim();
      if (piece) chunks.push(piece);
      start = end;
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

async function resolveSourceId(fallbackSourceId: string, relativeFilePath: string): Promise<string> {
  const existing = await prisma.source.findFirst({
    where: {
      OR: [{ filePath: relativeFilePath }, { filePath: relativeFilePath.replace(/\\/g, "/") }],
    },
    select: { id: true },
  });
  return existing?.id ?? fallbackSourceId;
}

async function main() {
  const { sourceId: fallbackSourceId, relativeFilePath, title } = parseArgs();
  const absoluteFilePath = join(process.cwd(), relativeFilePath);
  const rawText = await readFile(absoluteFilePath, "utf8");
  const normalizedText = normalizeResearchText(rawText);
  const chunks = chunkTextByParagraph(normalizedText);
  const sourceId = await resolveSourceId(fallbackSourceId, relativeFilePath);

  await prisma.$transaction(async (tx) => {
    await tx.source.upsert({
      where: { id: sourceId },
      update: {
        title,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HISTORICAL,
        sourceType: SourceType.NOTE,
        filePath: relativeFilePath,
        originalFilename: relativeFilePath.split("/").pop() ?? relativeFilePath,
        ingestionReady: normalizedText.length > 0,
        ingestionStatus: NORMALIZED_STATUS,
        archiveStatus: "book1-script-normalized",
        summary: `Book 1 normalization script output (${normalizedText.length} normalized chars).`,
        processingNotes:
          "Normalized by scripts/normalize-book1-research.ts. Image/link artifacts and scaffolding removed; chunks regenerated.",
      },
      create: {
        id: sourceId,
        title,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HISTORICAL,
        sourceType: SourceType.NOTE,
        filePath: relativeFilePath,
        originalFilename: relativeFilePath.split("/").pop() ?? relativeFilePath,
        ingestionReady: normalizedText.length > 0,
        ingestionStatus: NORMALIZED_STATUS,
        archiveStatus: "book1-script-normalized",
        summary: `Book 1 normalization script output (${normalizedText.length} normalized chars).`,
        processingNotes:
          "Created by scripts/normalize-book1-research.ts. Raw + normalized text captured for retrieval and downstream cataloging.",
      },
    });

    const sourceText = await tx.sourceText.upsert({
      where: { sourceId },
      update: {
        rawText,
        normalizedText,
        textStatus: NORMALIZED_STATUS,
        textNotes:
          "Raw file retained. normalizedText strips image/link artifacts + conversational scaffolding and preserves citations.",
      },
      create: {
        sourceId,
        rawText,
        normalizedText,
        textStatus: NORMALIZED_STATUS,
        textNotes:
          "Raw file retained. normalizedText strips image/link artifacts + conversational scaffolding and preserves citations.",
      },
    });

    await tx.sourceChunk.deleteMany({ where: { sourceId } });
    for (let i = 0; i < chunks.length; i++) {
      await tx.sourceChunk.create({
        data: {
          sourceId,
          sourceTextId: sourceText.id,
          chunkIndex: i,
          charCount: chunks[i].length,
          rawText: chunks[i],
          normalizedText: chunks[i],
          textStatus: NORMALIZED_STATUS,
          chunkLabel: `book1 chunk1 normalized ${i + 1}/${chunks.length}`,
        },
      });
    }
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceId,
        relativeFilePath,
        rawChars: rawText.length,
        normalizedChars: normalizedText.length,
        chunkCount: chunks.length,
        status: NORMALIZED_STATUS,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
