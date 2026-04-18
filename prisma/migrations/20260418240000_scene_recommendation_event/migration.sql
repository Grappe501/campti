-- Append-only recommendation learning loop events (observational; no policy enforcement).
CREATE TABLE "SceneRecommendationEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sceneId" TEXT NOT NULL,
    "ledgerRunKey" TEXT,
    "eventType" TEXT NOT NULL,
    "actionType" TEXT,
    "recommendationIds" JSONB,
    "recommendationCategories" JSONB,
    "linkedLaunchAuditId" TEXT,
    "linkedLedgerRunKey" TEXT,
    "parentEventId" TEXT,
    "displayBatchId" TEXT,
    "contextSummary" TEXT,
    "meta" JSONB,

    CONSTRAINT "SceneRecommendationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SceneRecommendationEvent_sceneId_createdAt_idx" ON "SceneRecommendationEvent"("sceneId", "createdAt");
CREATE INDEX "SceneRecommendationEvent_sceneId_eventType_idx" ON "SceneRecommendationEvent"("sceneId", "eventType");
CREATE INDEX "SceneRecommendationEvent_parentEventId_idx" ON "SceneRecommendationEvent"("parentEventId");

ALTER TABLE "SceneRecommendationEvent" ADD CONSTRAINT "SceneRecommendationEvent_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
