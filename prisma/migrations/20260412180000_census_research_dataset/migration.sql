-- CreateTable
CREATE TABLE "CensusResearchDataset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "sqliteOriginPath" TEXT,
    "linkedSourceId" TEXT,

    CONSTRAINT "CensusResearchDataset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CensusResearchDataset_linkedSourceId_idx" ON "CensusResearchDataset"("linkedSourceId");

-- AddForeignKey
ALTER TABLE "CensusResearchDataset" ADD CONSTRAINT "CensusResearchDataset_linkedSourceId_fkey" FOREIGN KEY ("linkedSourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CensusResearchPage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "datasetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "pagerRaw" TEXT,
    "cleanLen" INTEGER,
    "textHash" TEXT,
    "textPreview" TEXT,
    "ocrText" TEXT,
    "pageType" TEXT,
    "docPageCode" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "titleGuess" TEXT,

    CONSTRAINT "CensusResearchPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CensusResearchPage_datasetId_sortOrder_key" ON "CensusResearchPage"("datasetId", "sortOrder");

-- CreateIndex
CREATE INDEX "CensusResearchPage_datasetId_idx" ON "CensusResearchPage"("datasetId");

-- CreateIndex
CREATE INDEX "CensusResearchPage_filename_idx" ON "CensusResearchPage"("filename");

-- CreateIndex
CREATE INDEX "CensusResearchPage_docPageCode_idx" ON "CensusResearchPage"("docPageCode");

-- AddForeignKey
ALTER TABLE "CensusResearchPage" ADD CONSTRAINT "CensusResearchPage_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "CensusResearchDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CensusResearchEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "datasetId" TEXT NOT NULL,
    "externalEntryId" INTEGER NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "sourceOrder" INTEGER,
    "docPageCode" TEXT,
    "pageType" TEXT,
    "rawEntry" TEXT NOT NULL,
    "displayName" TEXT,
    "childrenCount" DOUBLE PRECISION,
    "negroSlavesCount" DOUBLE PRECISION,
    "indianSlavesCount" DOUBLE PRECISION,
    "domesticCount" DOUBLE PRECISION,
    "wifeMentioned" BOOLEAN NOT NULL DEFAULT false,
    "widowMentioned" BOOLEAN NOT NULL DEFAULT false,
    "onHisLand" BOOLEAN NOT NULL DEFAULT false,
    "roleGuess" TEXT,

    CONSTRAINT "CensusResearchEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CensusResearchEntry_datasetId_externalEntryId_key" ON "CensusResearchEntry"("datasetId", "externalEntryId");

-- CreateIndex
CREATE INDEX "CensusResearchEntry_datasetId_idx" ON "CensusResearchEntry"("datasetId");

-- CreateIndex
CREATE INDEX "CensusResearchEntry_displayName_idx" ON "CensusResearchEntry"("displayName");

-- CreateIndex
CREATE INDEX "CensusResearchEntry_docPageCode_idx" ON "CensusResearchEntry"("docPageCode");

-- AddForeignKey
ALTER TABLE "CensusResearchEntry" ADD CONSTRAINT "CensusResearchEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "CensusResearchDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CensusResearchNameRow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "datasetId" TEXT NOT NULL,
    "externalEntryId" INTEGER,
    "displayName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "sourceFilename" TEXT,
    "docPageCode" TEXT,

    CONSTRAINT "CensusResearchNameRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CensusResearchNameRow_datasetId_idx" ON "CensusResearchNameRow"("datasetId");

-- CreateIndex
CREATE INDEX "CensusResearchNameRow_normalizedName_idx" ON "CensusResearchNameRow"("normalizedName");

-- AddForeignKey
ALTER TABLE "CensusResearchNameRow" ADD CONSTRAINT "CensusResearchNameRow_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "CensusResearchDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CensusResearchMissingPage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "datasetId" TEXT NOT NULL,
    "missingGroupId" TEXT NOT NULL,
    "status" TEXT,
    "description" TEXT,
    "insertAfterOrder" INTEGER,
    "expectedSource" TEXT,
    "notes" TEXT,

    CONSTRAINT "CensusResearchMissingPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CensusResearchMissingPage_datasetId_missingGroupId_key" ON "CensusResearchMissingPage"("datasetId", "missingGroupId");

-- AddForeignKey
ALTER TABLE "CensusResearchMissingPage" ADD CONSTRAINT "CensusResearchMissingPage_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "CensusResearchDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
