-- Enneagram-aware cognition fields on CharacterCoreProfile (deterministic shaping + author overrides).

ALTER TABLE "CharacterCoreProfile" ADD COLUMN "enneagramType" "EnneagramType";
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "enneagramWing" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "instinctStacking" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "baselineIntegrationLevel" INTEGER;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "stressPatternJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "growthPatternJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "egoFixation" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "coreFear" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "coreDesire" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "virtue" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "vice" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "harmDefenseStyle" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "imageStrategy" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "attachmentPatternOverride" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "notesEnneagram" TEXT;

CREATE INDEX "CharacterCoreProfile_enneagramType_idx" ON "CharacterCoreProfile"("enneagramType");
