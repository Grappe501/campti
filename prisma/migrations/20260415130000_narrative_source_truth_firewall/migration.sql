-- P2-B — Narrative source ingestion (temporal truth firewall). Backend-only table; no FK yet (per schema).

CREATE TABLE "NarrativeSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveStartWorldStateId" TEXT NOT NULL,
    "effectiveEndWorldStateId" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "scope" TEXT NOT NULL,
    "truthMode" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "content" TEXT NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "NarrativeSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NarrativeSource_effectiveStartWorldStateId_idx" ON "NarrativeSource"("effectiveStartWorldStateId");
CREATE INDEX "NarrativeSource_startYear_idx" ON "NarrativeSource"("startYear");
