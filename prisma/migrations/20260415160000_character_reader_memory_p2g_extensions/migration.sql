-- P2-G extensions — firstInteractionAt, relationshipNotes, metadataJson (relationship-bounded memory only).

ALTER TABLE "CharacterReaderMemory" ADD COLUMN "firstInteractionAt" TIMESTAMP(3);
ALTER TABLE "CharacterReaderMemory" ADD COLUMN "relationshipNotes" JSONB;
ALTER TABLE "CharacterReaderMemory" ADD COLUMN "metadataJson" JSONB;

UPDATE "CharacterReaderMemory" SET "firstInteractionAt" = "lastInteractionAt" WHERE "firstInteractionAt" IS NULL;
