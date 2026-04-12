-- Thought language / register mediation (character + world JSON).

ALTER TABLE "CharacterCoreProfile" ADD COLUMN "mindLanguagePrimary" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "mindLanguageSecondary" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "spokenLanguageProfileJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "registerProfileJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "translationRenderMode" TEXT;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "codeSwitchTriggersJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "retainedLexiconJson" JSONB;

ALTER TABLE "WorldStateReference" ADD COLUMN "languageEnvironmentJson" JSONB;
