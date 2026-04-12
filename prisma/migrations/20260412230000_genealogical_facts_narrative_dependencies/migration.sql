-- Genealogical fact slots + competing assertions + narrative dependency edges + revision jobs.

CREATE TYPE "GenealogicalPredicate" AS ENUM (
  'BIRTH_YEAR',
  'DEATH_YEAR',
  'BIRTH_PLACE',
  'DEATH_PLACE',
  'BURIAL_PLACE',
  'FATHER_ID',
  'MOTHER_ID',
  'FREEDOM_STATUS',
  'RACIAL_CLASSIFICATION_RECORDED',
  'ENSLAVED_NAME',
  'FREE_NAME',
  'UNION_SPOUSE_ID',
  'RESIDENCE_AT_DATE',
  'LAND_TENURE',
  'OTHER'
);

CREATE TYPE "FactAssertionStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'REJECTED');

CREATE TYPE "NarrativeDependencyConsumerKind" AS ENUM (
  'SCENE',
  'CHAPTER',
  'BOOK',
  'META_SCENE',
  'EXPORT_BUNDLE'
);

CREATE TYPE "NarrativeDependencyProducerKind" AS ENUM (
  'GENEALOGICAL_ASSERTION',
  'PERSON',
  'WORLD_STATE_REFERENCE',
  'PLACE',
  'HISTORICAL_EVENT',
  'LEGACY_CLAIM'
);

CREATE TYPE "DependencyStrength" AS ENUM ('HARD', 'SOFT');

CREATE TYPE "RevisionJobKind" AS ENUM (
  'REEVALUATE_SCENE',
  'REGENERATE_SCENE_AI',
  'CONTINUITY_CHECK',
  'MARK_STALE'
);

CREATE TYPE "RevisionJobStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "GenealogicalFactSlot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "predicate" "GenealogicalPredicate" NOT NULL,
    "discriminator" TEXT NOT NULL DEFAULT '',
    "slotLabel" TEXT,
    "notes" TEXT,

    CONSTRAINT "GenealogicalFactSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GenealogicalFactSlot_subjectType_subjectId_predicate_discriminat_key"
  ON "GenealogicalFactSlot"("subjectType", "subjectId", "predicate", "discriminator");

CREATE INDEX "GenealogicalFactSlot_subjectType_subjectId_idx"
  ON "GenealogicalFactSlot"("subjectType", "subjectId");

CREATE TABLE "GenealogicalAssertion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slotId" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "visibility" "VisibilityStatus" NOT NULL,
    "recordType" "RecordType" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "quoteExcerpt" TEXT,
    "notes" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "sourceId" TEXT,
    "status" "FactAssertionStatus" NOT NULL DEFAULT 'ACTIVE',
    "supersedesId" TEXT,
    "legacyClaimId" TEXT,
    "narrativePreferred" BOOLEAN NOT NULL DEFAULT false,
    "branchTag" TEXT,

    CONSTRAINT "GenealogicalAssertion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GenealogicalAssertion_slotId_idx" ON "GenealogicalAssertion"("slotId");
CREATE INDEX "GenealogicalAssertion_sourceId_idx" ON "GenealogicalAssertion"("sourceId");
CREATE INDEX "GenealogicalAssertion_status_idx" ON "GenealogicalAssertion"("status");
CREATE INDEX "GenealogicalAssertion_legacyClaimId_idx" ON "GenealogicalAssertion"("legacyClaimId");

ALTER TABLE "GenealogicalAssertion"
  ADD CONSTRAINT "GenealogicalAssertion_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "GenealogicalFactSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GenealogicalAssertion"
  ADD CONSTRAINT "GenealogicalAssertion_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GenealogicalAssertion"
  ADD CONSTRAINT "GenealogicalAssertion_supersedesId_fkey"
  FOREIGN KEY ("supersedesId") REFERENCES "GenealogicalAssertion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GenealogicalAssertion"
  ADD CONSTRAINT "GenealogicalAssertion_legacyClaimId_fkey"
  FOREIGN KEY ("legacyClaimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NarrativeDependencyEdge" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumerKind" "NarrativeDependencyConsumerKind" NOT NULL,
    "consumerId" TEXT NOT NULL,
    "producerKind" "NarrativeDependencyProducerKind" NOT NULL,
    "producerId" TEXT NOT NULL,
    "strength" "DependencyStrength" NOT NULL DEFAULT 'HARD',
    "inputSnapshotHash" TEXT,

    CONSTRAINT "NarrativeDependencyEdge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NarrativeDependencyEdge_consumerKind_consumerId_idx"
  ON "NarrativeDependencyEdge"("consumerKind", "consumerId");

CREATE INDEX "NarrativeDependencyEdge_producerKind_producerId_idx"
  ON "NarrativeDependencyEdge"("producerKind", "producerId");

CREATE INDEX "NarrativeDependencyEdge_strength_idx" ON "NarrativeDependencyEdge"("strength");

CREATE TABLE "RevisionJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" "RevisionJobKind" NOT NULL,
    "status" "RevisionJobStatus" NOT NULL DEFAULT 'PENDING',
    "sceneId" TEXT,
    "payload" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RevisionJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RevisionJob_status_idx" ON "RevisionJob"("status");
CREATE INDEX "RevisionJob_kind_idx" ON "RevisionJob"("kind");
CREATE INDEX "RevisionJob_sceneId_idx" ON "RevisionJob"("sceneId");

ALTER TABLE "RevisionJob"
  ADD CONSTRAINT "RevisionJob_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
