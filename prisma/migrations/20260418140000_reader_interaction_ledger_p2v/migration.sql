-- P2-V — Reader interaction cost ledger (metering; no billing).

CREATE TYPE "ReaderInteractionLedgerEntryType" AS ENUM ('text_turn', 'voice_render', 'other');

CREATE TABLE "ReaderInteractionLedgerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "entryType" "ReaderInteractionLedgerEntryType" NOT NULL,
    "unitCount" INTEGER NOT NULL,
    "estimatedCostUnits" INTEGER NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "ReaderInteractionLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReaderInteractionLedgerEntry_readerId_idx" ON "ReaderInteractionLedgerEntry"("readerId");
CREATE INDEX "ReaderInteractionLedgerEntry_sessionId_idx" ON "ReaderInteractionLedgerEntry"("sessionId");
CREATE INDEX "ReaderInteractionLedgerEntry_createdAt_idx" ON "ReaderInteractionLedgerEntry"("createdAt");
CREATE INDEX "ReaderInteractionLedgerEntry_readerId_createdAt_idx" ON "ReaderInteractionLedgerEntry"("readerId", "createdAt");

ALTER TABLE "ReaderInteractionLedgerEntry" ADD CONSTRAINT "ReaderInteractionLedgerEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CharacterConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
