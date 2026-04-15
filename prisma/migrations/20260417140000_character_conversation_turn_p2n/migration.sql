-- P2-N — CharacterConversationTurn

CREATE TYPE "CharacterConversationTurnSpeaker" AS ENUM ('reader', 'character');

CREATE TABLE "CharacterConversationTurn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "speakerType" "CharacterConversationTurnSpeaker" NOT NULL,
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "CharacterConversationTurn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterConversationTurn_sessionId_orderIndex_key" ON "CharacterConversationTurn"("sessionId", "orderIndex");
CREATE INDEX "CharacterConversationTurn_sessionId_idx" ON "CharacterConversationTurn"("sessionId");

ALTER TABLE "CharacterConversationTurn" ADD CONSTRAINT "CharacterConversationTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CharacterConversationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
