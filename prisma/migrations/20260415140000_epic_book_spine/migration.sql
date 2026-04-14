-- P2-C — Canonical epic timeline / book spine (`EpicBook`). Distinct from narrative `Book` rows.

CREATE TABLE "EpicBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "startWorldStateId" TEXT,
    "endWorldStateId" TEXT,
    "summary" TEXT,
    "themes" TEXT[] NOT NULL,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" JSONB,

    CONSTRAINT "EpicBook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EpicBook_orderIndex_idx" ON "EpicBook"("orderIndex");
