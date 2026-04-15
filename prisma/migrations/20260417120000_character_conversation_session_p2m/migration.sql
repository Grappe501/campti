-- P2-M — CharacterConversationSession

CREATE TYPE "CharacterConversationSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

CREATE TABLE "CharacterConversationSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "sceneId" TEXT,
    "status" "CharacterConversationSessionStatus" NOT NULL,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "metadataJson" JSONB,

    CONSTRAINT "CharacterConversationSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharacterConversationSession_characterId_idx" ON "CharacterConversationSession"("characterId");
CREATE INDEX "CharacterConversationSession_readerId_idx" ON "CharacterConversationSession"("readerId");
CREATE INDEX "CharacterConversationSession_status_idx" ON "CharacterConversationSession"("status");
CREATE INDEX "CharacterConversationSession_lastInteractionAt_idx" ON "CharacterConversationSession"("lastInteractionAt");

ALTER TABLE "CharacterConversationSession" ADD CONSTRAINT "CharacterConversationSession_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterConversationSession" ADD CONSTRAINT "CharacterConversationSession_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
