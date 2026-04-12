-- Character cognition & simulation (non-reader; advisory until PINNED).

CREATE TYPE "CognitionSnapshotKind" AS ENUM (
  'CANONICAL_PLANNED',
  'SIMULATION_BASE',
  'EXPLORATORY'
);

CREATE TYPE "InnerVoiceSessionMode" AS ENUM (
  'INNER_VOICE',
  'DECISION_TRACE',
  'ALTERNATE_RUN',
  'GOD_MODE_QA'
);

CREATE TYPE "CognitionCanonicalStatus" AS ENUM (
  'EXPLORATORY',
  'PINNED',
  'REJECTED'
);

CREATE TYPE "SimulationScenarioStatus" AS ENUM (
  'DRAFT',
  'READY',
  'ARCHIVED'
);

CREATE TABLE "CharacterCognitionCore" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldviewSummary" TEXT,
    "valuesJson" JSONB,
    "woundsJson" JSONB,
    "socialMaskJson" JSONB,
    "tabooJson" JSONB,
    "decisionStyleJson" JSONB,
    "defaultDefensesJson" JSONB,
    "privateDesireThemesJson" JSONB,
    "identityTensionsJson" JSONB,
    "recordType" "RecordType" NOT NULL DEFAULT 'HYBRID',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'REVIEW',
    "certainty" TEXT,
    "notes" TEXT,

    CONSTRAINT "CharacterCognitionCore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterCognitionCore_personId_key" ON "CharacterCognitionCore"("personId");
CREATE INDEX "CharacterCognitionCore_personId_idx" ON "CharacterCognitionCore"("personId");

ALTER TABLE "CharacterCognitionCore"
  ADD CONSTRAINT "CharacterCognitionCore_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CharacterCognitionSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "snapshotKind" "CognitionSnapshotKind" NOT NULL DEFAULT 'CANONICAL_PLANNED',
    "sceneId" TEXT,
    "chapterId" TEXT,
    "worldStateId" TEXT,
    "label" TEXT,
    "currentFear" TEXT,
    "currentDesire" TEXT,
    "currentObligation" TEXT,
    "currentShame" TEXT,
    "currentHope" TEXT,
    "currentAnger" TEXT,
    "socialRiskJson" JSONB,
    "statusVulnerabilityJson" JSONB,
    "currentMaskJson" JSONB,
    "contradictionJson" JSONB,
    "relationshipsSnapshotJson" JSONB,
    "genealogicalContextRefsJson" JSONB,
    "supersedesId" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'HYBRID',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'REVIEW',
    "certainty" TEXT,

    CONSTRAINT "CharacterCognitionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharacterCognitionSnapshot_personId_idx" ON "CharacterCognitionSnapshot"("personId");
CREATE INDEX "CharacterCognitionSnapshot_sceneId_idx" ON "CharacterCognitionSnapshot"("sceneId");
CREATE INDEX "CharacterCognitionSnapshot_chapterId_idx" ON "CharacterCognitionSnapshot"("chapterId");
CREATE INDEX "CharacterCognitionSnapshot_worldStateId_idx" ON "CharacterCognitionSnapshot"("worldStateId");
CREATE INDEX "CharacterCognitionSnapshot_snapshotKind_idx" ON "CharacterCognitionSnapshot"("snapshotKind");

ALTER TABLE "CharacterCognitionSnapshot"
  ADD CONSTRAINT "CharacterCognitionSnapshot_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterCognitionSnapshot"
  ADD CONSTRAINT "CharacterCognitionSnapshot_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharacterCognitionSnapshot"
  ADD CONSTRAINT "CharacterCognitionSnapshot_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharacterCognitionSnapshot"
  ADD CONSTRAINT "CharacterCognitionSnapshot_worldStateId_fkey"
  FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharacterCognitionSnapshot"
  ADD CONSTRAINT "CharacterCognitionSnapshot_supersedesId_fkey"
  FOREIGN KEY ("supersedesId") REFERENCES "CharacterCognitionSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CharacterInnerVoiceSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" TEXT NOT NULL,
    "sceneId" TEXT,
    "mode" "InnerVoiceSessionMode" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "canonicalStatus" "CognitionCanonicalStatus" NOT NULL DEFAULT 'EXPLORATORY',
    "inputContextJson" JSONB NOT NULL,
    "outputSummaryJson" JSONB,
    "createdBy" TEXT,

    CONSTRAINT "CharacterInnerVoiceSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharacterInnerVoiceSession_personId_idx" ON "CharacterInnerVoiceSession"("personId");
CREATE INDEX "CharacterInnerVoiceSession_sceneId_idx" ON "CharacterInnerVoiceSession"("sceneId");
CREATE INDEX "CharacterInnerVoiceSession_mode_idx" ON "CharacterInnerVoiceSession"("mode");
CREATE INDEX "CharacterInnerVoiceSession_canonicalStatus_idx" ON "CharacterInnerVoiceSession"("canonicalStatus");

ALTER TABLE "CharacterInnerVoiceSession"
  ADD CONSTRAINT "CharacterInnerVoiceSession_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterInnerVoiceSession"
  ADD CONSTRAINT "CharacterInnerVoiceSession_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sceneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "baseSnapshotId" TEXT,
    "variableOverridesJson" JSONB NOT NULL,
    "outcomeSummaryJson" JSONB,
    "status" "SimulationScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimulationScenario_sceneId_idx" ON "SimulationScenario"("sceneId");
CREATE INDEX "SimulationScenario_status_idx" ON "SimulationScenario"("status");

ALTER TABLE "SimulationScenario"
  ADD CONSTRAINT "SimulationScenario_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SimulationScenario"
  ADD CONSTRAINT "SimulationScenario_baseSnapshotId_fkey"
  FOREIGN KEY ("baseSnapshotId") REFERENCES "CharacterCognitionSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,
    "personId" TEXT,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "prosePreview" TEXT,
    "canonicalStatus" "CognitionCanonicalStatus" NOT NULL DEFAULT 'EXPLORATORY',
    "diffFromBaseJson" JSONB,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimulationRun_scenarioId_idx" ON "SimulationRun"("scenarioId");
CREATE INDEX "SimulationRun_personId_idx" ON "SimulationRun"("personId");
CREATE INDEX "SimulationRun_canonicalStatus_idx" ON "SimulationRun"("canonicalStatus");

ALTER TABLE "SimulationRun"
  ADD CONSTRAINT "SimulationRun_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SimulationRun"
  ADD CONSTRAINT "SimulationRun_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
