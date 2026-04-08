import { RecordType, VisibilityStatus } from "@prisma/client";
import { z } from "zod";
import type {
  ChapterDraft,
  ClaimDraft,
  ContinuityDraft,
  EventDraft,
  ExtractionResultShape,
  ExtractedEntityShape,
  OpenQuestionDraft,
  PersonDraft,
  PlaceDraft,
  SceneDraft,
  SymbolDraft,
} from "@/lib/ingestion-contracts";

const recordTypeEnum = z.nativeEnum(RecordType);
const visibilityEnum = z.nativeEnum(VisibilityStatus);

const draftBaseSchema = z.object({
  label: z.string().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  confidence: z.coerce.number().int().min(1).max(5).default(3),
  sourceExcerpt: z.string().optional(),
  notes: z.string().optional(),
  recordTypeSuggestion: recordTypeEnum.optional(),
  visibilitySuggestion: visibilityEnum.optional(),
});

const personDraftSchema = draftBaseSchema.extend({
  kind: z.literal("person").optional(),
  birthYear: z.number().int().nullable().optional(),
  deathYear: z.number().int().nullable().optional(),
});

const placeDraftSchema = draftBaseSchema.extend({
  kind: z.literal("place").optional(),
  placeTypeSuggestion: z.string().optional(),
});

const eventDraftSchema = draftBaseSchema.extend({
  kind: z.literal("event").optional(),
  startYear: z.number().int().nullable().optional(),
  endYear: z.number().int().nullable().optional(),
  eventTypeSuggestion: z.string().optional(),
});

const symbolDraftSchema = draftBaseSchema.extend({
  kind: z.literal("symbol").optional(),
  categorySuggestion: z.string().optional(),
});

const claimDraftSchema = draftBaseSchema.extend({
  kind: z.literal("claim").optional(),
  quoteExcerpt: z.string().optional(),
});

const chapterDraftSchema = draftBaseSchema.extend({
  kind: z.literal("chapter").optional(),
  chapterNumber: z.number().int().nullable().optional(),
});

const sceneDraftSchema = draftBaseSchema.extend({
  kind: z.literal("scene").optional(),
  chapterTitleHint: z.string().optional(),
});

const questionDraftSchema = draftBaseSchema.extend({
  kind: z.literal("open_question").optional(),
  priority: z.number().int().nullable().optional(),
});

const continuityDraftSchema = draftBaseSchema.extend({
  kind: z.literal("continuity").optional(),
  severitySuggestion: z.string().optional(),
  statusSuggestion: z.string().optional(),
});

function asArray<T>(v: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    const p = schema.safeParse(item);
    if (p.success) out.push(p.data);
  }
  return out;
}

const extractionResultShapeSchema = z.object({
  summaryDraft: z.string().nullable().optional(),
  peopleDraft: z.array(z.unknown()).optional(),
  placesDraft: z.array(z.unknown()).optional(),
  eventsDraft: z.array(z.unknown()).optional(),
  symbolsDraft: z.array(z.unknown()).optional(),
  claimsDraft: z.array(z.unknown()).optional(),
  chaptersDraft: z.array(z.unknown()).optional(),
  scenesDraft: z.array(z.unknown()).optional(),
  questionsDraft: z.array(z.unknown()).optional(),
  continuityDraft: z.array(z.unknown()).optional(),
});

export function validateExtractionResultShape(
  result: unknown,
): ExtractionResultShape | null {
  const parsed = extractionResultShapeSchema.safeParse(result);
  if (!parsed.success) return null;
  return normalizeExtractionResult(parsed.data);
}

/**
 * Coerce an unknown payload (e.g. future LLM JSON) into the internal extraction shape.
 */
export function normalizeExtractionResult(raw: unknown): ExtractionResultShape {
  const base =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  return {
    summaryDraft:
      typeof base.summaryDraft === "string" ? base.summaryDraft : null,
    peopleDraft: asArray(base.peopleDraft, personDraftSchema),
    placesDraft: asArray(base.placesDraft, placeDraftSchema),
    eventsDraft: asArray(base.eventsDraft, eventDraftSchema),
    symbolsDraft: asArray(base.symbolsDraft, symbolDraftSchema),
    claimsDraft: asArray(base.claimsDraft, claimDraftSchema),
    chaptersDraft: asArray(base.chaptersDraft, chapterDraftSchema),
    scenesDraft: asArray(base.scenesDraft, sceneDraftSchema),
    questionsDraft: asArray(base.questionsDraft, questionDraftSchema),
    continuityDraft: asArray(base.continuityDraft, continuityDraftSchema),
  };
}

function draftToProposed(
  d:
    | PersonDraft
    | PlaceDraft
    | EventDraft
    | SymbolDraft
    | ClaimDraft
    | ChapterDraft
    | SceneDraft
    | OpenQuestionDraft
    | ContinuityDraft,
): Record<string, unknown> {
  return { ...d } as Record<string, unknown>;
}

function displayNameForDraft(
  d: {
    name?: string;
    title?: string;
    label?: string;
    description?: string;
    summary?: string;
  },
): string | null {
  return d.name ?? d.title ?? d.label ?? d.description ?? d.summary ?? null;
}

function displayTitleForDraft(d: { title?: string; label?: string }): string | null {
  return d.title ?? d.label ?? null;
}

/**
 * Flatten structured drafts into per-entity review rows for persistence as ExtractedEntity.
 */
export function splitDraftsIntoExtractedEntities(
  result: ExtractionResultShape,
): ExtractedEntityShape[] {
  const rows: ExtractedEntityShape[] = [];

  const push = (
    entityType: string,
    d:
      | PersonDraft
      | PlaceDraft
      | EventDraft
      | SymbolDraft
      | ClaimDraft
      | ChapterDraft
      | SceneDraft
      | OpenQuestionDraft
      | ContinuityDraft,
  ) => {
    rows.push({
      entityType,
      proposedName: displayNameForDraft(d),
      proposedTitle: displayTitleForDraft(d),
      proposedData: draftToProposed(d),
      confidence: typeof d.confidence === "number" ? d.confidence : null,
    });
  };

  for (const d of result.peopleDraft) push("person", d);
  for (const d of result.placesDraft) push("place", d);
  for (const d of result.eventsDraft) push("event", d);
  for (const d of result.symbolsDraft) push("symbol", d);
  for (const d of result.claimsDraft) push("claim", d);
  for (const d of result.chaptersDraft) push("chapter", d);
  for (const d of result.scenesDraft) push("scene", d);
  for (const d of result.questionsDraft) push("question", d);
  for (const d of result.continuityDraft) push("continuity", d);

  return rows;
}
