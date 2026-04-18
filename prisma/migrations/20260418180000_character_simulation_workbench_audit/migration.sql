-- AlterTable: workbench metadata (author notes, accepted advisory conflict ids).
ALTER TABLE "CharacterSimulationAuthorBundle" ADD COLUMN "workbenchMetaJson" JSONB;

-- CreateTable: durable audit for Character Simulation Workbench actions.
CREATE TABLE "CharacterSimulationAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorNote" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,

    CONSTRAINT "CharacterSimulationAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharacterSimulationAuditLog_personId_createdAt_idx" ON "CharacterSimulationAuditLog"("personId", "createdAt" DESC);

ALTER TABLE "CharacterSimulationAuditLog" ADD CONSTRAINT "CharacterSimulationAuditLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
