-- Story assembly: normalized search keys + dataset summary for LLM prompts.
ALTER TABLE "CensusResearchDataset" ADD COLUMN IF NOT EXISTS "storyAssemblySummary" TEXT;

ALTER TABLE "CensusResearchPage" ADD COLUMN IF NOT EXISTS "normalizedTitleGuess" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "CensusResearchPage_normalizedTitleGuess_idx" ON "CensusResearchPage"("normalizedTitleGuess");

ALTER TABLE "CensusResearchEntry" ADD COLUMN IF NOT EXISTS "normalizedLabel" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "CensusResearchEntry_normalizedLabel_idx" ON "CensusResearchEntry"("normalizedLabel");
