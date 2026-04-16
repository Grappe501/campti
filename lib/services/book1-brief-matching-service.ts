import { parseChunkNumberFromFileName } from "@/lib/services/book1-bulk-ingestion-discovery";
import type {
  Book1BriefMatch,
  Book1ChunkBriefMatch,
  Book1RawChunkFile,
  Book1SupportingBriefFile,
} from "@/lib/services/book1-bulk-ingestion-types";

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function confidenceLabel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function scoreCandidate(chunk: Book1RawChunkFile, brief: Book1SupportingBriefFile): { confidence: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const chunkNumber = chunk.chunkNumber;
  const briefChunkNumber = parseChunkNumberFromFileName(brief.fileName);
  if (briefChunkNumber === chunkNumber) {
    score += 0.75;
    signals.push("chunk_number_match");
  }

  const chunkStem = chunk.fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/\s+/g, "");
  const briefStem = brief.fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/\s+/g, "");
  if (briefStem.includes(chunkStem) || chunkStem.includes(`chunk${chunkNumber}`) || briefStem.includes(`chunk${chunkNumber}`)) {
    score += 0.15;
    signals.push("stem_alignment");
  }

  if (briefStem.includes("book1")) {
    score += 0.05;
    signals.push("book_scope_alignment");
  }
  if (briefStem.includes("brief") || briefStem.includes("normalized")) {
    score += 0.05;
    signals.push("artifact_type_alignment");
  }

  return { confidence: Math.min(1, score), signals };
}

function fallbackSimilarity(chunk: Book1RawChunkFile, brief: Book1SupportingBriefFile): { confidence: number; signals: string[] } {
  const chunkTokens = tokenize(chunk.rawText.slice(0, 1800));
  const briefTokens = tokenize(brief.rawText.slice(0, 1800));
  const similarity = jaccard(chunkTokens, briefTokens);
  if (similarity < 0.08) return { confidence: 0, signals: [] };
  return {
    confidence: Math.min(0.45, similarity * 2),
    signals: ["fallback_text_similarity"],
  };
}

export class DeterministicBook1BriefMatcher {
  matchChunkToBriefs(chunk: Book1RawChunkFile, briefs: Book1SupportingBriefFile[]): Book1ChunkBriefMatch {
    const scored: Book1BriefMatch[] = [];

    for (const brief of briefs) {
      const primary = scoreCandidate(chunk, brief);
      const scoredCandidate = primary.confidence > 0 ? primary : fallbackSimilarity(chunk, brief);
      if (scoredCandidate.confidence <= 0) continue;
      scored.push({
        brief,
        confidence: Number(scoredCandidate.confidence.toFixed(4)),
        confidenceLabel: confidenceLabel(scoredCandidate.confidence),
        signals: scoredCandidate.signals,
      });
    }

    scored.sort((a, b) => b.confidence - a.confidence || a.brief.fileName.localeCompare(b.brief.fileName));
    const strongest = scored[0]?.confidence ?? 0;
    const accepted = scored.filter((candidate) => candidate.confidence >= 0.35);

    return {
      chunk,
      matchedBriefs: accepted,
      matchConfidence: strongest,
    };
  }
}
