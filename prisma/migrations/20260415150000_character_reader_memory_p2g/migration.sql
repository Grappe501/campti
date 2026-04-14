-- P2-G — Reader–character relationship memory (bounded, interaction-earned).

CREATE TABLE "CharacterReaderMemory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "familiarityLevel" INTEGER NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "knownFacts" JSONB NOT NULL DEFAULT '{}',
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterReaderMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterReaderMemory_characterId_readerId_key" ON "CharacterReaderMemory"("characterId", "readerId");
CREATE INDEX "CharacterReaderMemory_readerId_idx" ON "CharacterReaderMemory"("readerId");
CREATE INDEX "CharacterReaderMemory_characterId_idx" ON "CharacterReaderMemory"("characterId");
CREATE INDEX "CharacterReaderMemory_lastInteractionAt_idx" ON "CharacterReaderMemory"("lastInteractionAt");

ALTER TABLE "CharacterReaderMemory" ADD CONSTRAINT "CharacterReaderMemory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
