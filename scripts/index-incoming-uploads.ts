/**
 * Drop files under `uploads/incoming/` (any subfolder), then run:
 *   npx tsx scripts/index-incoming-uploads.ts
 *
 * Creates/updates `Source` rows tagged as script-indexed, attaches `SourceText` + `SourceChunk`
 * for readable text (.md, .txt, .markdown). Other types are registered with `filePath` for traceability.
 * Idempotent per relative path (stable ids from content path hash).
 */
import "./load-env";
import { createHash } from "crypto";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import {
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import {
  SCRIPT_UPLOAD_ARCHIVE_STATUS,
  SCRIPT_UPLOAD_INGESTION_STATUS,
} from "../lib/script-upload-index";
import { prisma } from "../lib/prisma";

const INCOMING_ROOT = join(process.cwd(), "uploads", "incoming");
const CHUNK_TARGET_CHARS = 4000;
const MAX_TEXT_CHARS = 5_000_000;

function stableSourceId(posixRel: string): string {
  const h = createHash("sha256").update(`campti-upload:${posixRel}`).digest("hex").slice(0, 32);
  return `upload-${h}`;
}

function toPosixRel(absFile: string): string {
  return relative(process.cwd(), absFile).replace(/\\/g, "/");
}

function mapExtToSourceType(ext: string): SourceType {
  const e = ext.toLowerCase();
  if (e === ".md" || e === ".txt" || e === ".markdown" || e === ".csv") return SourceType.NOTE;
  if (e === ".pdf") return SourceType.PDF;
  if (e === ".doc" || e === ".docx") return SourceType.DOCX;
  if (e === ".jpg" || e === ".jpeg" || e === ".png" || e === ".gif" || e === ".webp") {
    return SourceType.IMAGE;
  }
  if (e === ".mp3" || e === ".wav" || e === ".m4a") return SourceType.AUDIO;
  if (e === ".mp4" || e === ".webm" || e === ".mov") return SourceType.VIDEO;
  return SourceType.OTHER;
}

const TEXT_EXTS = new Set([".md", ".txt", ".markdown", ".csv"]);

function chunkText(text: string, target = CHUNK_TARGET_CHARS): string[] {
  const t = text.trim();
  if (!t) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + target, t.length);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const lastBreak = slice.lastIndexOf("\n\n");
      if (lastBreak > target * 0.25) end = start + lastBreak;
    }
    const piece = t.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = end;
  }
  return chunks;
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (ent.name === ".gitkeep" || ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = await walkFiles(INCOMING_ROOT);
  if (files.length === 0) {
    console.log(`No files under ${INCOMING_ROOT}. Add files, then re-run.`);
    return;
  }

  for (const abs of files) {
    const posixRel = toPosixRel(abs);
    const sourceId = stableSourceId(posixRel);
    const baseName = posixRel.split("/").pop() ?? posixRel;
    const ext = baseName.includes(".") ? baseName.slice(baseName.lastIndexOf(".")) : "";
    const sourceType = mapExtToSourceType(ext);
    const st = await stat(abs);
    const filePath = posixRel;

    let rawText: string | null = null;
    if (TEXT_EXTS.has(ext.toLowerCase())) {
      rawText = await readFile(abs, "utf8");
      if (rawText.length > MAX_TEXT_CHARS) {
        console.warn(`Skipping text over cap (${MAX_TEXT_CHARS} chars): ${posixRel}`);
        rawText = rawText.slice(0, MAX_TEXT_CHARS);
      }
    }

    const summary =
      rawText !== null
        ? `Script index: ${rawText.length} characters, chunked for search.`
        : `Script index: binary or non-text type; path recorded (${sourceType}).`;

    await prisma.$transaction(async (tx) => {
      await tx.source.upsert({
        where: { id: sourceId },
        update: {
          title: baseName,
          visibility: VisibilityStatus.PRIVATE,
          recordType: RecordType.HISTORICAL,
          sourceType,
          filePath,
          originalFilename: baseName,
          archiveStatus: SCRIPT_UPLOAD_ARCHIVE_STATUS,
          ingestionStatus: SCRIPT_UPLOAD_INGESTION_STATUS,
          ingestionReady: Boolean(rawText && rawText.trim()),
          processingNotes:
            "Created or refreshed by scripts/index-incoming-uploads.ts. Do not rely on admin manual entry for this row.",
          summary,
          updatedAt: new Date(),
        },
        create: {
          id: sourceId,
          title: baseName,
          visibility: VisibilityStatus.PRIVATE,
          recordType: RecordType.HISTORICAL,
          sourceType,
          filePath,
          originalFilename: baseName,
          archiveStatus: SCRIPT_UPLOAD_ARCHIVE_STATUS,
          ingestionStatus: SCRIPT_UPLOAD_INGESTION_STATUS,
          ingestionReady: Boolean(rawText && rawText.trim()),
          processingNotes:
            "Created by scripts/index-incoming-uploads.ts. Indexed for dashboard / ingestion views.",
          summary,
        },
      });

      await tx.sourceChunk.deleteMany({ where: { sourceId } });

      if (rawText !== null) {
        const textRow = await tx.sourceText.upsert({
          where: { sourceId },
          update: {
            rawText,
            normalizedText: rawText,
            textStatus: rawText.trim() ? "indexed_script" : "empty",
          },
          create: {
            sourceId,
            rawText,
            normalizedText: rawText,
            textStatus: rawText.trim() ? "indexed_script" : "empty",
          },
        });

        const parts = chunkText(rawText);
        for (let i = 0; i < parts.length; i++) {
          await tx.sourceChunk.create({
            data: {
              sourceId,
              sourceTextId: textRow.id,
              chunkIndex: i,
              charCount: parts[i].length,
              rawText: parts[i],
              normalizedText: parts[i],
              textStatus: "indexed_script",
              chunkLabel: `chunk ${i + 1}/${parts.length}`,
            },
          });
        }
      } else {
        await tx.sourceText.deleteMany({ where: { sourceId } });
      }
    });

    console.log(`Indexed ${posixRel} -> ${sourceId} (${sourceType}, ${st.size} bytes)`);
  }

  console.log(`Done. ${files.length} file(s). Open /admin/dashboard and /admin/ingestion?archiveStatus=${encodeURIComponent(SCRIPT_UPLOAD_ARCHIVE_STATUS)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
