CREATE TABLE "ProseQualityReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sceneId" TEXT NOT NULL,
    "sceneDraftVersionId" TEXT,
    "analyzerKind" TEXT NOT NULL,
    "proseSha256" TEXT NOT NULL,
    "reportJson" JSONB NOT NULL,
    "narrativeVoiceProfileId" TEXT,
    "characterVoicePersonId" TEXT,
    "authorGoalsSnapshot" JSONB,

    CONSTRAINT "ProseQualityReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProseQualityReport_sceneId_idx" ON "ProseQualityReport"("sceneId");
CREATE INDEX "ProseQualityReport_sceneDraftVersionId_idx" ON "ProseQualityReport"("sceneDraftVersionId");
CREATE INDEX "ProseQualityReport_analyzerKind_idx" ON "ProseQualityReport"("analyzerKind");
CREATE INDEX "ProseQualityReport_proseSha256_idx" ON "ProseQualityReport"("proseSha256");

ALTER TABLE "ProseQualityReport"
  ADD CONSTRAINT "ProseQualityReport_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProseQualityReport"
  ADD CONSTRAINT "ProseQualityReport_sceneDraftVersionId_fkey"
  FOREIGN KEY ("sceneDraftVersionId") REFERENCES "SceneDraftVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
