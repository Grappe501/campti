-- Durable run output linkage: prose snapshot per guarded launch (ledgerRunKey).

CREATE TABLE "SceneRunGenerationOutput" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sceneId" TEXT NOT NULL,
    "ledgerRunKey" TEXT NOT NULL,
    "launchStartAuditId" TEXT,
    "launchEndAuditId" TEXT,
    "cluster7RunId" TEXT,
    "persistedProse" TEXT NOT NULL,
    "sceneGenerationTextSynced" BOOLEAN NOT NULL DEFAULT false,
    "outputCompleteness" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL,
    "paragraphCount" INTEGER NOT NULL,
    "openingFingerprint" TEXT NOT NULL,
    "endingFingerprint" TEXT NOT NULL,
    "launchClass" TEXT,
    "launchSource" TEXT,
    "intent" TEXT,

    CONSTRAINT "SceneRunGenerationOutput_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SceneRunGenerationOutput_ledgerRunKey_key" ON "SceneRunGenerationOutput"("ledgerRunKey");

CREATE INDEX "SceneRunGenerationOutput_sceneId_idx" ON "SceneRunGenerationOutput"("sceneId");

CREATE INDEX "SceneRunGenerationOutput_sceneId_createdAt_idx" ON "SceneRunGenerationOutput"("sceneId", "createdAt");

ALTER TABLE "SceneRunGenerationOutput" ADD CONSTRAINT "SceneRunGenerationOutput_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
