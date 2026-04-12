-- CreateTable
CREATE TABLE "WorldStateEraProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "coreEconomicDrivers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "powerSummary" TEXT,
    "meaningOfWork" TEXT,
    "knobEconomicPressure" INTEGER NOT NULL DEFAULT 50,
    "knobRelationalInterdependence" INTEGER NOT NULL DEFAULT 50,
    "knobAutonomyBaseline" INTEGER NOT NULL DEFAULT 50,
    "knobSystemicExtraction" INTEGER NOT NULL DEFAULT 50,
    "knobCollectiveCohesion" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'HYBRID',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'REVIEW',
    "certainty" TEXT,

    CONSTRAINT "WorldStateEraProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldStateEraProfile_worldStateId_key" ON "WorldStateEraProfile"("worldStateId");

-- CreateIndex
CREATE INDEX "WorldStateEraProfile_worldStateId_idx" ON "WorldStateEraProfile"("worldStateId");

-- AddForeignKey
ALTER TABLE "WorldStateEraProfile" ADD CONSTRAINT "WorldStateEraProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
