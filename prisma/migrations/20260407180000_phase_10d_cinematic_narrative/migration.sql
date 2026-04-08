-- CreateTable
CREATE TABLE "CinematicNarrativePass" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaSceneId" TEXT,
    "sceneId" TEXT,
    "sourcePassId" TEXT,
    "passType" TEXT NOT NULL,
    "styleMode" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "sequenceOrder" INTEGER,
    "status" TEXT NOT NULL,
    "confidence" INTEGER,
    "notes" TEXT,

    CONSTRAINT "CinematicNarrativePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneBeat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaSceneId" TEXT NOT NULL,
    "beatType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "emotionalCharge" TEXT,
    "symbolicCharge" TEXT,
    "pacingHint" TEXT,
    "notes" TEXT,

    CONSTRAINT "SceneBeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioSyncSegment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sceneAudioAssetId" TEXT,
    "cinematicNarrativePassId" TEXT,
    "segmentOrder" INTEGER NOT NULL,
    "startTimeMs" INTEGER,
    "endTimeMs" INTEGER,
    "textExcerpt" TEXT,
    "cueType" TEXT,
    "notes" TEXT,

    CONSTRAINT "AudioSyncSegment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CinematicNarrativePass" ADD CONSTRAINT "CinematicNarrativePass_metaSceneId_fkey" FOREIGN KEY ("metaSceneId") REFERENCES "MetaScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CinematicNarrativePass" ADD CONSTRAINT "CinematicNarrativePass_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneBeat" ADD CONSTRAINT "SceneBeat_metaSceneId_fkey" FOREIGN KEY ("metaSceneId") REFERENCES "MetaScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioSyncSegment" ADD CONSTRAINT "AudioSyncSegment_sceneAudioAssetId_fkey" FOREIGN KEY ("sceneAudioAssetId") REFERENCES "SceneAudioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioSyncSegment" ADD CONSTRAINT "AudioSyncSegment_cinematicNarrativePassId_fkey" FOREIGN KEY ("cinematicNarrativePassId") REFERENCES "CinematicNarrativePass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CinematicNarrativePass_metaSceneId_idx" ON "CinematicNarrativePass"("metaSceneId");

-- CreateIndex
CREATE INDEX "CinematicNarrativePass_sceneId_idx" ON "CinematicNarrativePass"("sceneId");

-- CreateIndex
CREATE INDEX "CinematicNarrativePass_passType_idx" ON "CinematicNarrativePass"("passType");

-- CreateIndex
CREATE INDEX "CinematicNarrativePass_status_idx" ON "CinematicNarrativePass"("status");

-- CreateIndex
CREATE INDEX "SceneBeat_metaSceneId_idx" ON "SceneBeat"("metaSceneId");

-- CreateIndex
CREATE INDEX "SceneBeat_beatType_idx" ON "SceneBeat"("beatType");

-- CreateIndex
CREATE INDEX "SceneBeat_orderIndex_idx" ON "SceneBeat"("orderIndex");

-- CreateIndex
CREATE INDEX "AudioSyncSegment_sceneAudioAssetId_idx" ON "AudioSyncSegment"("sceneAudioAssetId");

-- CreateIndex
CREATE INDEX "AudioSyncSegment_cinematicNarrativePassId_idx" ON "AudioSyncSegment"("cinematicNarrativePassId");

-- CreateIndex
CREATE INDEX "AudioSyncSegment_segmentOrder_idx" ON "AudioSyncSegment"("segmentOrder");
