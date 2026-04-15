-- P2-T — External TTS voice assignment per character (ElevenLabs id, etc.).
-- Distinct from prose texture table `CharacterVoiceProfile`.

CREATE TYPE "CharacterVoiceProviderKind" AS ENUM ('elevenlabs', 'other');

CREATE TABLE "CharacterTtsVoiceProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "provider" "CharacterVoiceProviderKind" NOT NULL,
    "externalVoiceId" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "emotionalRangeJson" JSONB,
    "metadataJson" JSONB,

    CONSTRAINT "CharacterTtsVoiceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterTtsVoiceProfile_characterId_key" ON "CharacterTtsVoiceProfile"("characterId");
CREATE INDEX "CharacterTtsVoiceProfile_characterId_idx" ON "CharacterTtsVoiceProfile"("characterId");
CREATE INDEX "CharacterTtsVoiceProfile_provider_idx" ON "CharacterTtsVoiceProfile"("provider");

ALTER TABLE "CharacterTtsVoiceProfile" ADD CONSTRAINT "CharacterTtsVoiceProfile_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
