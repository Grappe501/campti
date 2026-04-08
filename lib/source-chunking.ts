import {
  MAX_CHUNK_CHARS,
  TARGET_CHUNK_CHARS,
} from "@/lib/ingestion-constants";
import { estimateTokenCount, normalizeRawText } from "@/lib/ingestion-packet";

export type ChunkDraft = {
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  charCount: number;
  tokenEstimate: number;
  headingHint?: string;
  chunkLabel: string;
  rawText: string;
  normalizedText: string;
};

function clampHeadingHint(text: string): string | undefined {
  const hint = text.trim().replace(/\s+/g, " ");
  if (!hint) return undefined;
  const max = 70;
  if (hint.length <= max) return hint;
  return hint.slice(0, max - 1).trimEnd() + "…";
}

function deriveHeadingHintFromChunk(normalizedChunk: string): string | undefined {
  const firstNonEmptyLine = normalizedChunk
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstNonEmptyLine) return undefined;

  // Avoid hints that are just very long paragraphs.
  const shortLine = firstNonEmptyLine.length <= 120 ? firstNonEmptyLine : "";
  const candidate = shortLine || firstNonEmptyLine.slice(0, 120);
  return clampHeadingHint(candidate);
}

function chunkLabelFor(index0: number, headingHint?: string): string {
  const n = index0 + 1;
  const base = `Chunk ${String(n).padStart(2, "0")}`;
  return headingHint?.trim() ? `${base} — ${headingHint.trim()}` : base;
}

/**
 * Review-friendly chunk splitting:
 * - Split on paragraph boundaries (double newlines)
 * - If paragraph too large, split on single newlines
 * - If still too large, split on sentence-ish boundaries
 * - Only then hard-cut by character window
 *
 * Offsets are measured against the FULL normalized text returned by normalizeRawText().
 */
export function splitSourceTextIntoChunks(params: {
  rawText: string;
  targetChunkChars?: number;
  maxChunkChars?: number;
}): { normalizedFullText: string; chunks: ChunkDraft[] } {
  const target = params.targetChunkChars ?? TARGET_CHUNK_CHARS;
  const max = params.maxChunkChars ?? MAX_CHUNK_CHARS;

  const normalizedFullText = normalizeRawText(params.rawText);
  if (!normalizedFullText.length) {
    return { normalizedFullText, chunks: [] };
  }

  const blocks: { text: string; separator: string }[] = [];
  const paras = normalizedFullText.split("\n\n");
  for (let i = 0; i < paras.length; i++) {
    const t = paras[i] ?? "";
    const sep = i === paras.length - 1 ? "" : "\n\n";
    blocks.push({ text: t, separator: sep });
  }

  const pushChunk = (
    out: ChunkDraft[],
    chunkIndex: number,
    startOffset: number,
    normalizedText: string,
  ) => {
    const charCount = normalizedText.length;
    const endOffset = startOffset + charCount;
    const headingHint = deriveHeadingHintFromChunk(normalizedText);
    out.push({
      chunkIndex,
      startOffset,
      endOffset,
      charCount,
      tokenEstimate: estimateTokenCount(normalizedText),
      headingHint,
      chunkLabel: chunkLabelFor(chunkIndex, headingHint),
      rawText: normalizedText,
      normalizedText,
    });
  };

  const chunks: ChunkDraft[] = [];
  let cursor = 0; // offset into normalizedFullText
  let pending = ""; // chunk content (normalized)
  let pendingStartOffset = 0;

  const flushPending = () => {
    if (!pending.length) return;
    pushChunk(chunks, chunks.length, pendingStartOffset, pending);
    pending = "";
  };

  const appendToPending = (s: string) => {
    if (!pending.length) pendingStartOffset = cursor;
    pending += s;
    cursor += s.length;
  };

  for (const b of blocks) {
    const seg = b.text + b.separator;

    if (!pending.length) {
      pendingStartOffset = cursor;
    }

    // If this paragraph boundary fits comfortably, keep it human.
    if (pending.length + seg.length <= target) {
      appendToPending(seg);
      continue;
    }

    // If pending is non-empty, flush it to preserve paragraph boundary.
    if (pending.length > 0) {
      flushPending();
    }

    // Now we need to emit this segment, potentially splitting it.
    if (seg.length <= max) {
      appendToPending(seg);
      continue;
    }

    // Split long paragraph on single newlines first.
    const lines = seg.split("\n");
    let lineBuf = "";
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li] ?? "";
      const withNl = li === lines.length - 1 ? line : line + "\n";
      if (lineBuf.length + withNl.length <= max) {
        lineBuf += withNl;
        continue;
      }
      if (lineBuf.length) {
        appendToPending(lineBuf);
        flushPending();
        lineBuf = "";
      }

      // Still too large: split this single line on sentence-ish boundaries.
      if (withNl.length > max) {
        const sentenceish = withNl.split(/(?<=[.!?])\s+/);
        let sentBuf = "";
        for (const s0 of sentenceish) {
          const s = sentBuf.length ? sentBuf + " " + s0 : s0;
          if (s.length <= max) {
            sentBuf = s;
            continue;
          }
          if (sentBuf.length) {
            appendToPending(sentBuf);
            flushPending();
            sentBuf = "";
          }

          // Hard-cut last resort.
          let hard = s0;
          while (hard.length > 0) {
            const cut = hard.slice(0, max);
            appendToPending(cut);
            flushPending();
            hard = hard.slice(max);
          }
        }
        if (sentBuf.length) {
          appendToPending(sentBuf);
          flushPending();
          sentBuf = "";
        }
      } else {
        appendToPending(withNl);
        flushPending();
      }
    }

    if (lineBuf.length) {
      appendToPending(lineBuf);
      flushPending();
      lineBuf = "";
    }
  }

  flushPending();

  return { normalizedFullText, chunks };
}

