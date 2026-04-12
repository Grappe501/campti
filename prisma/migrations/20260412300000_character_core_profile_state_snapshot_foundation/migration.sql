-- Foundation naming: CharacterCoreProfile + CharacterStateSnapshot; scalar snapshot fields; sequence index.

ALTER TABLE "CharacterCognitionCore" RENAME TO "CharacterCoreProfile";
ALTER TABLE "CharacterCognitionSnapshot" RENAME TO "CharacterStateSnapshot";

-- Core profile: structured worldview + attachment; align JSON field names with domain.
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "worldviewJson" JSONB;
ALTER TABLE "CharacterCoreProfile" ADD COLUMN "attachmentStyle" TEXT;

ALTER TABLE "CharacterCoreProfile" RENAME COLUMN "tabooJson" TO "tabooBoundariesJson";
ALTER TABLE "CharacterCoreProfile" RENAME COLUMN "defaultDefensesJson" TO "defenseMechanismsJson";
ALTER TABLE "CharacterCoreProfile" RENAME COLUMN "privateDesireThemesJson" TO "privateDesiresJson";

-- Snapshot: world-state FK column name; ordering; JSON → TEXT for interpretive scalars.
ALTER TABLE "CharacterStateSnapshot" RENAME COLUMN "worldStateId" TO "worldStateReferenceId";

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "sequenceIndex" INTEGER;

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentSocialRisk" TEXT;
UPDATE "CharacterStateSnapshot"
SET "currentSocialRisk" = CASE
  WHEN "socialRiskJson" IS NOT NULL THEN "socialRiskJson"::text
  ELSE NULL
END;
ALTER TABLE "CharacterStateSnapshot" DROP COLUMN "socialRiskJson";

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentStatusVulnerability" TEXT;
UPDATE "CharacterStateSnapshot"
SET "currentStatusVulnerability" = CASE
  WHEN "statusVulnerabilityJson" IS NOT NULL THEN "statusVulnerabilityJson"::text
  ELSE NULL
END;
ALTER TABLE "CharacterStateSnapshot" DROP COLUMN "statusVulnerabilityJson";

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentMask" TEXT;
UPDATE "CharacterStateSnapshot"
SET "currentMask" = CASE
  WHEN "currentMaskJson" IS NOT NULL THEN "currentMaskJson"::text
  ELSE NULL
END;
ALTER TABLE "CharacterStateSnapshot" DROP COLUMN "currentMaskJson";

ALTER TABLE "CharacterStateSnapshot" ADD COLUMN "currentContradiction" TEXT;
UPDATE "CharacterStateSnapshot"
SET "currentContradiction" = CASE
  WHEN "contradictionJson" IS NOT NULL THEN "contradictionJson"::text
  ELSE NULL
END;
ALTER TABLE "CharacterStateSnapshot" DROP COLUMN "contradictionJson";
