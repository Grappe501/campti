-- CreateTable
CREATE TABLE "CharacterSimulationAuthorBundle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "simulationMindProfileJson" JSONB,
    "simulationVoiceProfileJson" JSONB,

    CONSTRAINT "CharacterSimulationAuthorBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSimulationAuthorBundle_personId_key" ON "CharacterSimulationAuthorBundle"("personId");

-- CreateIndex
CREATE INDEX "CharacterSimulationAuthorBundle_personId_idx" ON "CharacterSimulationAuthorBundle"("personId");

-- AddForeignKey
ALTER TABLE "CharacterSimulationAuthorBundle" ADD CONSTRAINT "CharacterSimulationAuthorBundle_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
