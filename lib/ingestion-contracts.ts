import type { RecordType, SourceType, VisibilityStatus } from "@prisma/client";

/** Base fields shared by draft extractions before promotion. */
export type DraftBase = {
  label?: string;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  confidence: number;
  sourceExcerpt?: string;
  notes?: string;
  recordTypeSuggestion?: RecordType;
  visibilitySuggestion?: VisibilityStatus;
};

export type PersonDraft = DraftBase & {
  kind?: "person";
  birthYear?: number | null;
  deathYear?: number | null;
};

export type PlaceDraft = DraftBase & {
  kind?: "place";
  placeTypeSuggestion?: string;
};

export type EventDraft = DraftBase & {
  kind?: "event";
  startYear?: number | null;
  endYear?: number | null;
  eventTypeSuggestion?: string;
};

export type SymbolDraft = DraftBase & {
  kind?: "symbol";
  categorySuggestion?: string;
};

export type ClaimDraft = DraftBase & {
  kind?: "claim";
  quoteExcerpt?: string;
};

export type ChapterDraft = DraftBase & {
  kind?: "chapter";
  chapterNumber?: number | null;
};

export type SceneDraft = DraftBase & {
  kind?: "scene";
  chapterTitleHint?: string;
};

export type OpenQuestionDraft = DraftBase & {
  kind?: "open_question";
  priority?: number | null;
};

export type ContinuityDraft = DraftBase & {
  kind?: "continuity";
  severitySuggestion?: string;
  statusSuggestion?: string;
};

/**
 * Normalized input for a future AI extraction call (packet builder output).
 */
export type IngestionPacketInput = {
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType | null;
  recordType: RecordType | null;
  visibility: VisibilityStatus | null;
  sourceSummary: string | null;
  sourceNotes: string | null;
  sourceDate: string | null;
  sourceYear: number | null;
  authorOrOrigin: string | null;
  rawText: string;
  normalizedText: string | null;
  instructionsVersion: string;
  packetJson: Record<string, unknown> | null;
};

/**
 * Structured extraction output shape (mirrors DB JSON columns + summary).
 */
export type ExtractionResultShape = {
  summaryDraft: string | null;
  peopleDraft: PersonDraft[];
  placesDraft: PlaceDraft[];
  eventsDraft: EventDraft[];
  symbolsDraft: SymbolDraft[];
  claimsDraft: ClaimDraft[];
  chaptersDraft: ChapterDraft[];
  /** Optional; stored in DB as scenesDraft JSON when present. */
  scenesDraft: SceneDraft[];
  questionsDraft: OpenQuestionDraft[];
  continuityDraft: ContinuityDraft[];
};

/**
 * One reviewable row derived from drafts (before DB persistence).
 */
export type ExtractedEntityShape = {
  entityType: string;
  proposedName: string | null;
  proposedTitle: string | null;
  proposedData: Record<string, unknown>;
  confidence: number | null;
};
