import type { Source, SourceText } from "@prisma/client";
import { INSTRUCTIONS_VERSION } from "@/lib/ingestion-constants";
import type { IngestionPacketInput } from "@/lib/ingestion-contracts";

/** Rough token estimate for budgeting (not for billing). ~4 chars per token for English. */
export function estimateTokenCount(text: string): number {
  if (!text.length) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Normalize pasted or extracted text for consistent downstream processing. */
export function normalizeRawText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function placeholderText(source: Source): string {
  return `[No source text yet for "${source.title}". Paste text on the source detail page under Source text.]`;
}

/**
 * Build a prompt-ready packet object from a loaded Source (+ optional SourceText).
 * Does not persist or call external APIs.
 */
export function buildIngestionPacket(
  source: Source,
  sourceText: SourceText | null,
): IngestionPacketInput {
  const raw =
    sourceText?.rawText?.trim().length ? sourceText.rawText : placeholderText(source);
  const normalized = normalizeRawText(raw);
  return {
    sourceId: source.id,
    sourceTitle: source.title,
    sourceType: source.sourceType,
    recordType: source.recordType,
    visibility: source.visibility,
    sourceSummary: source.summary ?? null,
    sourceNotes: source.notes ?? null,
    sourceDate: source.sourceDate ?? null,
    sourceYear: source.sourceYear ?? null,
    authorOrOrigin: source.authorOrOrigin ?? null,
    rawText: raw,
    normalizedText: normalized.length ? normalized : null,
    instructionsVersion: INSTRUCTIONS_VERSION,
    packetJson: {
      phase: "prepare",
      sourceId: source.id,
      title: source.title,
    },
  };
}
