-- Epic → Book → Chapter → Scene → NarrativeBeat hierarchy + world-state overrides + assembly flags.

CREATE TYPE "NarrativeAssemblyStatus" AS ENUM ('CURRENT', 'STALE', 'REBUILDING');
CREATE TYPE "NarrativeContinuityState" AS ENUM ('OK', 'WARNING', 'BLOCKING');

ALTER TYPE "NarrativeDependencyConsumerKind" ADD VALUE 'BEAT';
ALTER TYPE "NarrativeDependencyProducerKind" ADD VALUE 'EPIC';
ALTER TYPE "NarrativeDependencyProducerKind" ADD VALUE 'BOOK';
ALTER TYPE "NarrativeDependencyProducerKind" ADD VALUE 'CHAPTER';

CREATE TABLE "Epic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "summary" TEXT,
    "movementCount" INTEGER NOT NULL DEFAULT 8,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "defaultWorldStateId" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "Epic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Epic_slug_key" ON "Epic"("slug");
CREATE INDEX "Epic_status_idx" ON "Epic"("status");

ALTER TABLE "Epic"
  ADD CONSTRAINT "Epic_defaultWorldStateId_fkey"
  FOREIGN KEY ("defaultWorldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "epicId" TEXT NOT NULL,
    "movementIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "readerFacingTitle" TEXT,
    "defaultWorldStateId" TEXT,
    "narrativeAssemblyStatus" "NarrativeAssemblyStatus" NOT NULL DEFAULT 'CURRENT',
    "assemblyInvalidatedAt" TIMESTAMP(3),
    "privateNotes" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Book_epicId_movementIndex_key" ON "Book"("epicId", "movementIndex");
CREATE INDEX "Book_epicId_idx" ON "Book"("epicId");
CREATE INDEX "Book_status_idx" ON "Book"("status");
CREATE INDEX "Book_narrativeAssemblyStatus_idx" ON "Book"("narrativeAssemblyStatus");

ALTER TABLE "Book"
  ADD CONSTRAINT "Book_epicId_fkey"
  FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Book"
  ADD CONSTRAINT "Book_defaultWorldStateId_fkey"
  FOREIGN KEY ("defaultWorldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Epic" ("id", "createdAt", "updatedAt", "title", "movementCount", "status")
VALUES ('epic_campti_default_001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Campti Epic', 8, 'draft');

INSERT INTO "Book" ("id", "createdAt", "updatedAt", "epicId", "movementIndex", "title", "status", "readerFacingTitle")
VALUES ('book_campti_default_001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'epic_campti_default_001', 1, 'Unplaced chapters (migration)', 'draft', 'Book I');

ALTER TABLE "Chapter" ADD COLUMN "bookId" TEXT;
UPDATE "Chapter" SET "bookId" = 'book_campti_default_001';
ALTER TABLE "Chapter" ALTER COLUMN "bookId" SET NOT NULL;

ALTER TABLE "Chapter" ADD COLUMN "sequenceInBook" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Chapter" ADD COLUMN "worldStateOverrideId" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "readerAssembledText" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "assemblyContentHash" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "lastAssembledAt" TIMESTAMP(3);
ALTER TABLE "Chapter" ADD COLUMN "narrativeAssemblyStatus" "NarrativeAssemblyStatus" NOT NULL DEFAULT 'CURRENT';
ALTER TABLE "Chapter" ADD COLUMN "assemblyInvalidatedAt" TIMESTAMP(3);
ALTER TABLE "Chapter" ADD COLUMN "generatedSummary" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "humanEditedSummary" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "generationMetadataJson" JSONB;
ALTER TABLE "Chapter" ADD COLUMN "continuityState" "NarrativeContinuityState" NOT NULL DEFAULT 'OK';

CREATE INDEX "Chapter_bookId_idx" ON "Chapter"("bookId");
CREATE INDEX "Chapter_bookId_sequenceInBook_idx" ON "Chapter"("bookId", "sequenceInBook");
CREATE INDEX "Chapter_narrativeAssemblyStatus_idx" ON "Chapter"("narrativeAssemblyStatus");
CREATE INDEX "Chapter_worldStateOverrideId_idx" ON "Chapter"("worldStateOverrideId");

ALTER TABLE "Chapter"
  ADD CONSTRAINT "Chapter_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Chapter"
  ADD CONSTRAINT "Chapter_worldStateOverrideId_fkey"
  FOREIGN KEY ("worldStateOverrideId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Scene" ADD COLUMN "generationText" TEXT;
ALTER TABLE "Scene" ADD COLUMN "authoringText" TEXT;
ALTER TABLE "Scene" ADD COLUMN "publishedReaderText" TEXT;
ALTER TABLE "Scene" ADD COLUMN "worldStateOverrideId" TEXT;
ALTER TABLE "Scene" ADD COLUMN "narrativeAssemblyStatus" "NarrativeAssemblyStatus" NOT NULL DEFAULT 'CURRENT';
ALTER TABLE "Scene" ADD COLUMN "assemblyInvalidatedAt" TIMESTAMP(3);
ALTER TABLE "Scene" ADD COLUMN "continuityState" "NarrativeContinuityState" NOT NULL DEFAULT 'OK';

CREATE INDEX "Scene_worldStateOverrideId_idx" ON "Scene"("worldStateOverrideId");
CREATE INDEX "Scene_narrativeAssemblyStatus_idx" ON "Scene"("narrativeAssemblyStatus");

ALTER TABLE "Scene"
  ADD CONSTRAINT "Scene_worldStateOverrideId_fkey"
  FOREIGN KEY ("worldStateOverrideId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NarrativeBeat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sceneId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "label" TEXT,
    "intentSummary" TEXT,
    "beatPlanJson" JSONB,
    "microbeatsJson" JSONB,
    "generationNotes" TEXT,
    "worldStateOverrideId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "narrativeAssemblyStatus" "NarrativeAssemblyStatus" NOT NULL DEFAULT 'CURRENT',
    "continuityState" "NarrativeContinuityState" NOT NULL DEFAULT 'OK',
    "metadataJson" JSONB,

    CONSTRAINT "NarrativeBeat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NarrativeBeat_sceneId_orderIndex_key" ON "NarrativeBeat"("sceneId", "orderIndex");
CREATE INDEX "NarrativeBeat_sceneId_idx" ON "NarrativeBeat"("sceneId");
CREATE INDEX "NarrativeBeat_orderIndex_idx" ON "NarrativeBeat"("orderIndex");
CREATE INDEX "NarrativeBeat_worldStateOverrideId_idx" ON "NarrativeBeat"("worldStateOverrideId");

ALTER TABLE "NarrativeBeat"
  ADD CONSTRAINT "NarrativeBeat_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NarrativeBeat"
  ADD CONSTRAINT "NarrativeBeat_worldStateOverrideId_fkey"
  FOREIGN KEY ("worldStateOverrideId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
