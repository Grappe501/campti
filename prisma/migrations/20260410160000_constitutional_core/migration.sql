-- Constitutional Core (Stage 1): governing law rows for deterministic simulation.
-- Run: npx prisma migrate deploy   (or migrate dev in development)

CREATE TYPE "RuleType" AS ENUM (
  'TRUTH',
  'AMBIGUITY',
  'REVEAL',
  'VOICE',
  'VIOLENCE',
  'THEOLOGY',
  'DETERMINISM',
  'DRAFT_ELIGIBILITY'
);

CREATE TYPE "RuleScope" AS ENUM (
  'GLOBAL',
  'ENTITY',
  'SCENE',
  'CHARACTER',
  'VOICE',
  'SYSTEM'
);

CREATE TYPE "RuleSeverity" AS ENUM ('INFO', 'WARNING', 'BLOCKING');

CREATE TABLE "ConstitutionalRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "severity" "RuleSeverity" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recordType" "RecordType" NOT NULL,
    "visibility" "VisibilityStatus" NOT NULL,
    "certainty" TEXT,
    "narrativePermission" TEXT,
    "config" JSONB,
    "notes" TEXT,

    CONSTRAINT "ConstitutionalRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConstitutionalRule_key_key" ON "ConstitutionalRule"("key");

CREATE INDEX "ConstitutionalRule_ruleType_idx" ON "ConstitutionalRule"("ruleType");
CREATE INDEX "ConstitutionalRule_scope_idx" ON "ConstitutionalRule"("scope");
CREATE INDEX "ConstitutionalRule_severity_idx" ON "ConstitutionalRule"("severity");
CREATE INDEX "ConstitutionalRule_isActive_idx" ON "ConstitutionalRule"("isActive");
CREATE INDEX "ConstitutionalRule_recordType_idx" ON "ConstitutionalRule"("recordType");
CREATE INDEX "ConstitutionalRule_visibility_idx" ON "ConstitutionalRule"("visibility");
