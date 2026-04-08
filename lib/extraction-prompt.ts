import type { IngestionPacketInput } from "@/lib/ingestion-contracts";
import { EXTRACTION_PROMPT_VERSION } from "@/lib/ingestion-constants";
import type { ChunkDraft } from "@/lib/source-chunking";

const JSON_SHAPE_HINT = `
Return a single JSON object with exactly these top-level keys (use arrays, may be empty):
- "summaryDraft": string or null — concise summary grounded only in the source.
- "peopleDraft": array of person objects.
- "placesDraft": array of place objects.
- "eventsDraft": array of event objects.
- "symbolsDraft": array of symbol objects.
- "claimsDraft": array of claim objects.
- "chaptersDraft": array of chapter objects (if the text suggests chapter-like structure).
- "scenesDraft": array of scene objects (if clearly present as scenes).
- "questionsDraft": array of open-question objects for unresolved ambiguities.
- "continuityDraft": array of continuity-note objects for internal tensions or timeline issues.

Each draft object (except summary) should include:
- "kind": one of "person"|"place"|"event"|"symbol"|"claim"|"chapter"|"scene"|"open_question"|"continuity" as appropriate.
- "confidence": integer 1–5 (5 = strongly supported by quoted text).
- Prefer "name" or "title" plus optional "description" or "summary".
- "sourceExcerpt": string — short verbatim or near-verbatim quote from the source when possible.
- "notes": string — optional reviewer-facing caveats.
- "recordTypeSuggestion": one of "historical"|"oral_history"|"inferred"|"fictional"|"hybrid" when you can justify it from the text.
- "visibilitySuggestion": optional — "private"|"review"|"public" only when clearly implied.

Person: optional "birthYear", "deathYear" (numbers or null).
Place: optional "placeTypeSuggestion" (string; e.g. town, lake, church, region, cemetery, home, field, river, other).
Event: optional "startYear", "endYear", "eventTypeSuggestion" (string).
Symbol: optional "categorySuggestion".
Claim: optional "quoteExcerpt" (alias for excerpted claim text).
Chapter: optional "chapterNumber".
Scene: optional "chapterTitleHint".
Open question: optional "priority" (number).
Continuity: optional "severitySuggestion", "statusSuggestion".

Do not invent specific dates, relationships, or proper-noun facts that do not appear in the source text or metadata.
Prefer marking uncertainty as questions with lower confidence.
Preserve names and spellings as in the source unless normalization is obviously safe.
`.trim();

/**
 * System prompt: conservative family-history extraction with structured JSON only.
 */
export function buildExtractionSystemPrompt(): string {
  return [
    `You are a careful research assistant for family history and narrative sources (Campti). Prompt version: ${EXTRACTION_PROMPT_VERSION}.`,
    "Extract structure only from the provided source text and metadata. Do not use outside knowledge.",
    "Classify content when possible as historical, oral_history, inferred, fictional, hybrid — use recordTypeSuggestion fields and notes.",
    "Output must be valid JSON only. No markdown fences, no commentary outside JSON.",
    "Be conservative: prefer uncertainty, lower confidence, and open questions over invention.",
    "Literary or narrative observations are allowed only when clearly grounded in the source (quote or paraphrase with excerpt).",
    JSON_SHAPE_HINT,
  ].join("\n\n");
}

function metadataBlock(packet: IngestionPacketInput): string {
  return [
    `sourceId: ${packet.sourceId}`,
    `title: ${packet.sourceTitle}`,
    `sourceType: ${packet.sourceType ?? "unknown"}`,
    `recordType (archive): ${packet.recordType ?? "unknown"}`,
    `visibility (archive): ${packet.visibility ?? "unknown"}`,
    `summary: ${packet.sourceSummary ?? ""}`,
    `notes: ${packet.sourceNotes ?? ""}`,
    `sourceDate: ${packet.sourceDate ?? ""}`,
    `sourceYear: ${packet.sourceYear ?? ""}`,
    `authorOrOrigin: ${packet.authorOrOrigin ?? ""}`,
    `instructionsVersion: ${packet.instructionsVersion}`,
  ].join("\n");
}

/**
 * User message: metadata + full text body used for extraction (already truncated upstream if needed).
 */
export function buildExtractionUserPrompt(packet: IngestionPacketInput): string {
  return [
    "### Metadata",
    metadataBlock(packet),
    "",
    "### Source text (extract only from below)",
    packet.rawText,
  ].join("\n");
}

export function buildChunkExtractionUserPrompt(params: {
  packet: IngestionPacketInput;
  chunk: ChunkDraft;
  totalChunks?: number;
}): string {
  const { packet, chunk, totalChunks } = params;
  const total = typeof totalChunks === "number" && totalChunks > 0 ? totalChunks : null;
  const chunkIndex1 = chunk.chunkIndex + 1;

  return [
    "### Context",
    "You are seeing ONE chunk of a larger source document.",
    "Extract ONLY what is supported by the text in this chunk.",
    "Do NOT infer facts that might exist elsewhere in the source.",
    "If something is ambiguous, surface it as an open question instead of guessing.",
    "",
    "### Source metadata (global)",
    metadataBlock(packet),
    "",
    "### Chunk info",
    `chunkIndex: ${chunkIndex1}${total ? ` of ${total}` : ""}`,
    `chunkLabel: ${chunk.chunkLabel}`,
    `headingHint: ${chunk.headingHint ?? ""}`,
    `normalizedOffsets: ${chunk.startOffset}–${chunk.endOffset}`,
    `charCount: ${chunk.charCount}`,
    "",
    "### Chunk text (extract only from below)",
    chunk.normalizedText,
  ].join("\n");
}
