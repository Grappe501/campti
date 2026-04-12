-- Phase 5C.1 — desire, pleasure, attachment longing (core + snapshot + world JSON).

ALTER TABLE "CharacterCoreProfile" ADD COLUMN "desireProfileJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "pleasurePatternJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "attachmentLongingJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "sexualConstraintProfileJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "notesDesire" TEXT;

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentArousal" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentLoneliness" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentWantednessHunger" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentNeedToBeNeeded" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentAttachmentAche" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentPleasureSeeking" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentForbiddenDesirePressure" INTEGER;
ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentResentmentAtDeprivation" INTEGER;

ALTER TABLE "WorldStateReference" ADD COLUMN "desireEnvironmentJson" JSONB;
