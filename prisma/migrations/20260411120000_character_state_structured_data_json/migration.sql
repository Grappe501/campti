-- AlterTable: optional schema-free JSON for scene-time brain hints (e.g. counterpartPersonId).
ALTER TABLE "CharacterState" ADD COLUMN IF NOT EXISTS "structuredDataJson" JSONB;
