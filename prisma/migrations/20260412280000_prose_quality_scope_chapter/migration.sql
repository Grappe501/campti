-- Chapter-level prose QA + interpretability snapshots on ProseQualityReport.

CREATE TYPE "ProseQualityAnalysisScope" AS ENUM ('SCENE', 'CHAPTER_ASSEMBLY');

ALTER TABLE "ProseQualityReport" ADD COLUMN "analysisScope" "ProseQualityAnalysisScope" NOT NULL DEFAULT 'SCENE';
ALTER TABLE "ProseQualityReport" ADD COLUMN "chapterId" TEXT;
ALTER TABLE "ProseQualityReport" ADD COLUMN "analyzerContextSnapshot" JSONB;

ALTER TABLE "ProseQualityReport" ALTER COLUMN "sceneId" DROP NOT NULL;

CREATE INDEX "ProseQualityReport_chapterId_idx" ON "ProseQualityReport"("chapterId");
CREATE INDEX "ProseQualityReport_analysisScope_idx" ON "ProseQualityReport"("analysisScope");

ALTER TABLE "ProseQualityReport"
  ADD CONSTRAINT "ProseQualityReport_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
