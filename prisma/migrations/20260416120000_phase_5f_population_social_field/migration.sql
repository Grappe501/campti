-- CreateEnum
CREATE TYPE "PopulationEntityRecordStatus" AS ENUM (
  'UNVERIFIED',
  'CENSUS_INGESTED',
  'LINKED_PERSON',
  'PROMOTED_MODELED',
  'MERGED'
);

-- CreateTable
CREATE TABLE "PopulationHousehold" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "displayName" TEXT,
    "worldStateReferenceId" TEXT,
    "primaryPlaceId" TEXT,
    "censusHouseholdKey" TEXT,
    "structuredDataJson" JSONB,
    "notes" TEXT,

    CONSTRAINT "PopulationHousehold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopulationEntity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliasesCompact" JSONB,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "gender" TEXT,
    "ethnicityOrBackground" TEXT,
    "statusOrClass" TEXT,
    "occupationOrRole" TEXT,
    "householdId" TEXT,
    "primaryLocationId" TEXT,
    "worldStateReferenceId" TEXT,
    "personId" TEXT,
    "isModeledCharacter" BOOLEAN NOT NULL DEFAULT false,
    "isPromotable" BOOLEAN NOT NULL DEFAULT true,
    "authorityWeight" INTEGER NOT NULL DEFAULT 50,
    "gossipWeight" INTEGER NOT NULL DEFAULT 50,
    "kinVisibilityWeight" INTEGER NOT NULL DEFAULT 50,
    "visibilityProfileJson" JSONB,
    "recordStatus" "PopulationEntityRecordStatus" NOT NULL DEFAULT 'CENSUS_INGESTED',
    "confidence" DOUBLE PRECISION DEFAULT 0.7,
    "sourceDataset" TEXT,
    "sourceRecordId" TEXT,
    "notes" TEXT,

    CONSTRAINT "PopulationEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopulationEntityAlias" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "populationEntityId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "PopulationEntityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopulationEntityPresence" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "populationEntityId" TEXT NOT NULL,
    "placeId" TEXT,
    "yearStart" INTEGER,
    "yearEnd" INTEGER,
    "confidence" DOUBLE PRECISION DEFAULT 0.7,
    "sourceNote" TEXT,

    CONSTRAINT "PopulationEntityPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PopulationEntity_personId_key" ON "PopulationEntity"("personId");

-- CreateIndex
CREATE INDEX "PopulationEntity_normalizedName_idx" ON "PopulationEntity"("normalizedName");
CREATE INDEX "PopulationEntity_worldStateReferenceId_idx" ON "PopulationEntity"("worldStateReferenceId");
CREATE INDEX "PopulationEntity_householdId_idx" ON "PopulationEntity"("householdId");
CREATE INDEX "PopulationEntity_primaryLocationId_idx" ON "PopulationEntity"("primaryLocationId");
CREATE INDEX "PopulationEntity_personId_idx" ON "PopulationEntity"("personId");

CREATE INDEX "PopulationHousehold_worldStateReferenceId_idx" ON "PopulationHousehold"("worldStateReferenceId");
CREATE INDEX "PopulationHousehold_primaryPlaceId_idx" ON "PopulationHousehold"("primaryPlaceId");
CREATE INDEX "PopulationHousehold_censusHouseholdKey_idx" ON "PopulationHousehold"("censusHouseholdKey");

CREATE UNIQUE INDEX "PopulationEntityAlias_populationEntityId_normalizedAlias_key" ON "PopulationEntityAlias"("populationEntityId", "normalizedAlias");
CREATE INDEX "PopulationEntityAlias_normalizedAlias_idx" ON "PopulationEntityAlias"("normalizedAlias");

CREATE INDEX "PopulationEntityPresence_populationEntityId_idx" ON "PopulationEntityPresence"("populationEntityId");
CREATE INDEX "PopulationEntityPresence_placeId_idx" ON "PopulationEntityPresence"("placeId");
CREATE INDEX "PopulationEntityPresence_yearStart_yearEnd_idx" ON "PopulationEntityPresence"("yearStart", "yearEnd");

-- AddForeignKey
ALTER TABLE "PopulationHousehold" ADD CONSTRAINT "PopulationHousehold_worldStateReferenceId_fkey" FOREIGN KEY ("worldStateReferenceId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PopulationHousehold" ADD CONSTRAINT "PopulationHousehold_primaryPlaceId_fkey" FOREIGN KEY ("primaryPlaceId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PopulationEntity" ADD CONSTRAINT "PopulationEntity_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "PopulationHousehold"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PopulationEntity" ADD CONSTRAINT "PopulationEntity_primaryLocationId_fkey" FOREIGN KEY ("primaryLocationId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PopulationEntity" ADD CONSTRAINT "PopulationEntity_worldStateReferenceId_fkey" FOREIGN KEY ("worldStateReferenceId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PopulationEntity" ADD CONSTRAINT "PopulationEntity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PopulationEntityAlias" ADD CONSTRAINT "PopulationEntityAlias_populationEntityId_fkey" FOREIGN KEY ("populationEntityId") REFERENCES "PopulationEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PopulationEntityPresence" ADD CONSTRAINT "PopulationEntityPresence_populationEntityId_fkey" FOREIGN KEY ("populationEntityId") REFERENCES "PopulationEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PopulationEntityPresence" ADD CONSTRAINT "PopulationEntityPresence_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
