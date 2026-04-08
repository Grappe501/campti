-- CreateEnum
CREATE TYPE "EnneagramType" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE');

-- AlterTable
ALTER TABLE "CharacterProfile" ADD COLUMN     "enneagramType" "EnneagramType",
ADD COLUMN     "enneagramWing" TEXT,
ADD COLUMN     "enneagramConfidence" INTEGER,
ADD COLUMN     "enneagramSource" TEXT,
ADD COLUMN     "stressPattern" TEXT,
ADD COLUMN     "growthPattern" TEXT,
ADD COLUMN     "defensiveStyle" TEXT,
ADD COLUMN     "coreLonging" TEXT,
ADD COLUMN     "coreFear" TEXT,
ADD COLUMN     "attentionBias" TEXT,
ADD COLUMN     "relationalStyle" TEXT,
ADD COLUMN     "conflictStyle" TEXT,
ADD COLUMN     "attachmentPattern" TEXT,
ADD COLUMN     "shameTrigger" TEXT,
ADD COLUMN     "angerPattern" TEXT,
ADD COLUMN     "griefPattern" TEXT,
ADD COLUMN     "controlPattern" TEXT,
ADD COLUMN     "notesOnTypeUse" TEXT;

-- CreateTable
CREATE TABLE "CharacterRelationship" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "relationshipSummary" TEXT,
    "emotionalPattern" TEXT,
    "conflictPattern" TEXT,
    "attachmentPattern" TEXT,
    "powerDynamic" TEXT,
    "enneagramDynamic" TEXT,
    "confidence" INTEGER,
    "notes" TEXT,

    CONSTRAINT "CharacterRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneSoulSuggestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaSceneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SceneSoulSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterRelationship_personAId_idx" ON "CharacterRelationship"("personAId");

-- CreateIndex
CREATE INDEX "CharacterRelationship_personBId_idx" ON "CharacterRelationship"("personBId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterRelationship_personAId_personBId_key" ON "CharacterRelationship"("personAId", "personBId");

-- CreateIndex
CREATE INDEX "SceneSoulSuggestion_metaSceneId_idx" ON "SceneSoulSuggestion"("metaSceneId");

-- CreateIndex
CREATE INDEX "SceneSoulSuggestion_status_idx" ON "SceneSoulSuggestion"("status");

-- CreateIndex
CREATE INDEX "SceneSoulSuggestion_suggestionType_idx" ON "SceneSoulSuggestion"("suggestionType");

-- AddForeignKey
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterRelationship" ADD CONSTRAINT "CharacterRelationship_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneSoulSuggestion" ADD CONSTRAINT "SceneSoulSuggestion_metaSceneId_fkey" FOREIGN KEY ("metaSceneId") REFERENCES "MetaScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
