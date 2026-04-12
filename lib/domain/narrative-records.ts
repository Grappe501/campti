import type {
  Book,
  Chapter,
  Epic,
  NarrativeBeat,
  Scene,
} from "@prisma/client";

/**
 * Domain-facing record shapes (mirror Prisma; use for APIs and UI props).
 * Text roles:
 * - **machine**: `generationText`
 * - **human working**: `authoringText`
 * - **reader contract**: `publishedReaderText` (when set); else assembly falls back per `resolveSceneReaderText`
 * - **legacy**: `draftText`
 */
export type EpicRecord = Pick<
  Epic,
  | "id"
  | "title"
  | "slug"
  | "summary"
  | "movementCount"
  | "status"
  | "defaultWorldStateId"
  | "metadataJson"
  | "createdAt"
  | "updatedAt"
>;

export type BookRecord = Pick<
  Book,
  | "id"
  | "epicId"
  | "movementIndex"
  | "title"
  | "subtitle"
  | "summary"
  | "readerFacingTitle"
  | "status"
  | "defaultWorldStateId"
  | "narrativeAssemblyStatus"
  | "assemblyInvalidatedAt"
  | "metadataJson"
  | "createdAt"
  | "updatedAt"
>;

export type ChapterRecord = Pick<
  Chapter,
  | "id"
  | "bookId"
  | "sequenceInBook"
  | "title"
  | "summary"
  | "chapterNumber"
  | "worldStateOverrideId"
  | "readerAssembledText"
  | "assemblyContentHash"
  | "lastAssembledAt"
  | "narrativeAssemblyStatus"
  | "assemblyInvalidatedAt"
  | "generatedSummary"
  | "humanEditedSummary"
  | "continuityState"
  | "createdAt"
  | "updatedAt"
>;

export type SceneRecord = Pick<
  Scene,
  | "id"
  | "chapterId"
  | "description"
  | "summary"
  | "orderInChapter"
  | "draftText"
  | "generationText"
  | "authoringText"
  | "publishedReaderText"
  | "worldStateOverrideId"
  | "narrativeAssemblyStatus"
  | "assemblyInvalidatedAt"
  | "continuityState"
  | "narrativeIntent"
  | "writingMode"
  | "createdAt"
  | "updatedAt"
>;

export type BeatRecord = Pick<
  NarrativeBeat,
  | "id"
  | "sceneId"
  | "orderIndex"
  | "label"
  | "intentSummary"
  | "beatPlanJson"
  | "microbeatsJson"
  | "worldStateOverrideId"
  | "status"
  | "narrativeAssemblyStatus"
  | "continuityState"
  | "metadataJson"
  | "createdAt"
  | "updatedAt"
>;
