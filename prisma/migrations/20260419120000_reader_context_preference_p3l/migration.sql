-- P3-L reader context preferences: product/session defaults only.
CREATE TABLE "ReaderContextPreference" (
    "readerId" TEXT NOT NULL,
    "preferredPresentationLanguageCode" TEXT NOT NULL DEFAULT 'en',
    "preferredAudioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredNativeTongueToggleDefault" BOOLEAN NOT NULL DEFAULT false,
    "preferredVoicePlaybackSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderContextPreference_pkey" PRIMARY KEY ("readerId")
);
