-- P3-H — Reader interaction unit balance (consumption gating; not payments).

CREATE TABLE "ReaderInteractionBalance" (
    "readerId" TEXT NOT NULL,
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderInteractionBalance_pkey" PRIMARY KEY ("readerId")
);
