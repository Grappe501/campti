-- Phase 9B: Scene Intelligence — fragment refinement, clusters, construction suggestions
-- Apply when ready: npx prisma migrate deploy (or db push in dev)

ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "primaryFragmentType" "FragmentType";
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "secondaryFragmentTypes" JSONB;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "surfaceMeaning" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "hiddenMeaning" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "symbolicUse" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "emotionalUse" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "narrativeUse" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "decompositionPressure" TEXT;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "sceneReadinessScore" INTEGER;
ALTER TABLE "Fragment" ADD COLUMN IF NOT EXISTS "clusterHint" TEXT;

CREATE INDEX IF NOT EXISTS "Fragment_decompositionPressure_idx" ON "Fragment"("decompositionPressure");

CREATE TABLE IF NOT EXISTS "FragmentCluster" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "clusterType" TEXT NOT NULL,
    "summary" TEXT,
    "emotionalTone" TEXT,
    "dominantFunction" TEXT,
    "confidence" INTEGER,
    "notes" TEXT,
    "chapterId" TEXT,
    "sceneId" TEXT,
    "metaSceneId" TEXT,
    "personId" TEXT,
    "placeId" TEXT,
    "symbolId" TEXT,

    CONSTRAINT "FragmentCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FragmentClusterLink" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fragmentId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "role" TEXT,
    "notes" TEXT,

    CONSTRAINT "FragmentClusterLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SceneConstructionSuggestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaSceneId" TEXT,
    "sceneId" TEXT,
    "title" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" INTEGER,
    "status" TEXT NOT NULL,
    "supportingFragmentIds" JSONB,
    "notes" TEXT,

    CONSTRAINT "SceneConstructionSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FragmentCluster_clusterType_idx" ON "FragmentCluster"("clusterType");
CREATE INDEX IF NOT EXISTS "FragmentCluster_chapterId_idx" ON "FragmentCluster"("chapterId");
CREATE INDEX IF NOT EXISTS "FragmentCluster_sceneId_idx" ON "FragmentCluster"("sceneId");
CREATE INDEX IF NOT EXISTS "FragmentCluster_metaSceneId_idx" ON "FragmentCluster"("metaSceneId");
CREATE INDEX IF NOT EXISTS "FragmentCluster_personId_idx" ON "FragmentCluster"("personId");
CREATE INDEX IF NOT EXISTS "FragmentCluster_placeId_idx" ON "FragmentCluster"("placeId");
CREATE INDEX IF NOT EXISTS "FragmentCluster_symbolId_idx" ON "FragmentCluster"("symbolId");

CREATE INDEX IF NOT EXISTS "FragmentClusterLink_fragmentId_idx" ON "FragmentClusterLink"("fragmentId");
CREATE INDEX IF NOT EXISTS "FragmentClusterLink_clusterId_idx" ON "FragmentClusterLink"("clusterId");

CREATE INDEX IF NOT EXISTS "SceneConstructionSuggestion_metaSceneId_idx" ON "SceneConstructionSuggestion"("metaSceneId");
CREATE INDEX IF NOT EXISTS "SceneConstructionSuggestion_sceneId_idx" ON "SceneConstructionSuggestion"("sceneId");
CREATE INDEX IF NOT EXISTS "SceneConstructionSuggestion_status_idx" ON "SceneConstructionSuggestion"("status");
CREATE INDEX IF NOT EXISTS "SceneConstructionSuggestion_suggestionType_idx" ON "SceneConstructionSuggestion"("suggestionType");

ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_metaSceneId_fkey" FOREIGN KEY ("metaSceneId") REFERENCES "MetaScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FragmentCluster" ADD CONSTRAINT "FragmentCluster_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FragmentClusterLink" ADD CONSTRAINT "FragmentClusterLink_fragmentId_fkey" FOREIGN KEY ("fragmentId") REFERENCES "Fragment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FragmentClusterLink" ADD CONSTRAINT "FragmentClusterLink_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "FragmentCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SceneConstructionSuggestion" ADD CONSTRAINT "SceneConstructionSuggestion_metaSceneId_fkey" FOREIGN KEY ("metaSceneId") REFERENCES "MetaScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SceneConstructionSuggestion" ADD CONSTRAINT "SceneConstructionSuggestion_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
