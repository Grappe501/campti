import {
  EventType,
  PlaceType,
  RecordType,
  SourceType,
  VisibilityStatus,
  WritingMode,
} from "@prisma/client";
import { z } from "zod";

export const visibilitySchema = z.nativeEnum(VisibilityStatus);
export const recordTypeSchema = z.nativeEnum(RecordType);
export const sourceTypeSchema = z.nativeEnum(SourceType);
export const placeTypeSchema = z.nativeEnum(PlaceType);
export const eventTypeSchema = z.nativeEnum(EventType);
export const writingModeSchema = z.nativeEnum(WritingMode);

export const confidenceSchema = z.coerce
  .number()
  .int()
  .min(1, "Confidence must be between 1 and 5")
  .max(5, "Confidence must be between 1 and 5");

export const optionalPriority = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  },
  z.number().int().min(1).max(5).optional(),
);

export const optionalIntYear = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  },
  z.number().int().optional(),
);

export const optionalFloatCoord = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  },
  z.number().optional(),
);

export const optionalInt = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  },
  z.number().int().optional(),
);

export const sourceCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  summary: z.string().trim().optional(),
  sourceType: sourceTypeSchema,
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
  filePath: z.string().trim().optional(),
  originalFilename: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  sourceDate: z.string().trim().optional(),
  sourceYear: optionalIntYear,
  authorOrOrigin: z.string().trim().optional(),
  archiveStatus: z.string().trim().optional(),
  ingestionStatus: z.string().trim().optional(),
});

export const claimCreateSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  sourceId: z.string().trim().min(1, "Source is required"),
  confidence: confidenceSchema,
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
  quoteExcerpt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  needsReview: z.boolean().optional(),
});

export const claimUpdateSchema = claimCreateSchema.extend({
  id: z.string().min(1),
});

export const personCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  birthYear: optionalIntYear,
  deathYear: optionalIntYear,
  enneagram: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(v);
      if (!Number.isFinite(n)) return undefined;
      return Math.min(9, Math.max(1, Math.trunc(n)));
    },
    z.number().int().min(1).max(9).optional(),
  ),
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
});

export const personUpdateSchema = personCreateSchema.extend({
  id: z.string().min(1),
});

export const placeCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  placeType: placeTypeSchema,
  latitude: optionalFloatCoord,
  longitude: optionalFloatCoord,
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
});

export const placeUpdateSchema = placeCreateSchema.extend({
  id: z.string().min(1),
});

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  eventType: eventTypeSchema,
  startYear: optionalIntYear,
  endYear: optionalIntYear,
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
});

export const eventUpdateSchema = eventCreateSchema.extend({
  id: z.string().min(1),
});

export const chapterCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  bookId: z.string().trim().min(1).optional(),
  summary: z.string().trim().optional(),
  timePeriod: z.string().trim().optional(),
  chapterNumber: optionalInt,
  status: z.string().trim().optional(),
  pov: z.string().trim().optional(),
  historicalAnchor: z.string().trim().optional(),
  privateNotes: z.string().trim().optional(),
  publicNotes: z.string().trim().optional(),
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
});

export const chapterUpdateSchema = chapterCreateSchema.extend({
  id: z.string().min(1),
});

export const sceneCreateSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  chapterId: z.string().trim().min(1, "Chapter is required"),
  historicalAnchor: z.string().trim().optional(),
  sceneNumber: optionalInt,
  locationNote: z.string().trim().optional(),
  pov: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  privateNotes: z.string().trim().optional(),
  orderInChapter: optionalInt,
  visibility: visibilitySchema,
  recordType: recordTypeSchema,
});

export const sceneUpdateSchema = sceneCreateSchema.extend({
  id: z.string().min(1),
});

export const sceneWorkspaceUpdateSchema = z.object({
  id: z.string().min(1),
  writingMode: writingModeSchema.optional(),
  draftText: z.string().optional(),
  narrativeIntent: z.string().trim().optional(),
  emotionalTone: z.string().trim().optional(),
  historicalConfidence: optionalInt,
  sourceTraceSummary: z.string().trim().optional(),
  continuitySummary: z.string().trim().optional(),
  sceneStatus: z.string().trim().optional(),
});

export const sceneEntityLinkSchema = z.object({
  sceneId: z.string().min(1),
  entityType: z.enum(["person", "place", "event", "symbol", "source", "openQuestion"]),
  entityId: z.string().min(1),
});

export const sceneScaffoldSchema = z.object({
  sceneId: z.string().min(1),
});

export const sceneGenerateSummarySchema = z.object({
  sceneId: z.string().min(1),
});

export const sceneReorderSchema = z.object({
  sceneId: z.string().min(1),
  orderInChapter: optionalInt,
});

export const openQuestionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  status: z.string().trim().min(1),
  priority: optionalPriority,
  linkedPersonId: z.string().trim().optional(),
  linkedPlaceId: z.string().trim().optional(),
  linkedEventId: z.string().trim().optional(),
  linkedSourceId: z.string().trim().optional(),
});

export const openQuestionUpdateSchema = openQuestionSchema.extend({
  id: z.string().min(1),
});

export const continuityNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  severity: z.string().trim().min(1),
  status: z.string().trim().min(1),
  linkedChapterId: z.string().trim().optional(),
  linkedSceneId: z.string().trim().optional(),
  linkedPersonId: z.string().trim().optional(),
  linkedEventId: z.string().trim().optional(),
});

export const continuityNoteUpdateSchema = continuityNoteSchema.extend({
  id: z.string().min(1),
});

export {
  fragmentCreateSchema,
  fragmentUpdateSchema,
  fragmentDecomposePreviewSchema,
  fragmentDecomposeSaveSchema,
  fragmentDecomposeChildSchema,
  fragmentReviewSchema,
  placementCandidateDecisionSchema,
  fragmentLinkCreateSchema,
  fragmentLinkDeleteSchema,
  fragmentInsightCreateSchema,
} from "./fragment-validation";
