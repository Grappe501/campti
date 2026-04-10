-- Stage 6.5 — Trauma, consequence memory, rumor/reputation, education norms, learning envelope.

CREATE TYPE "TrainingMode" AS ENUM (
  'ORAL_TRADITION',
  'APPRENTICESHIP',
  'RITUAL_INSTRUCTION',
  'HOUSEHOLD_TRAINING',
  'FORMAL_SCHOOLING',
  'RELIGIOUS_CATECHESIS',
  'MILITARY_TRAINING',
  'SELF_TAUGHT',
  'MIXED'
);

CREATE TABLE "CharacterTraumaProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "traumaLoad" INTEGER NOT NULL DEFAULT 50,
    "silenceLoad" INTEGER NOT NULL DEFAULT 50,
    "hypervigilanceLoad" INTEGER NOT NULL DEFAULT 50,
    "shameResidue" INTEGER NOT NULL DEFAULT 50,
    "griefResidue" INTEGER NOT NULL DEFAULT 50,
    "bodyMemory" JSONB,
    "triggerPatterns" JSONB,
    "copingPatterns" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterTraumaProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterTraumaProfile_personId_worldStateId_key" ON "CharacterTraumaProfile"("personId", "worldStateId");
CREATE INDEX "CharacterTraumaProfile_personId_idx" ON "CharacterTraumaProfile"("personId");
CREATE INDEX "CharacterTraumaProfile_worldStateId_idx" ON "CharacterTraumaProfile"("worldStateId");

ALTER TABLE "CharacterTraumaProfile" ADD CONSTRAINT "CharacterTraumaProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterTraumaProfile" ADD CONSTRAINT "CharacterTraumaProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterConsequenceMemoryProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "punishmentMemory" INTEGER NOT NULL DEFAULT 50,
    "protectionMemory" INTEGER NOT NULL DEFAULT 50,
    "betrayalMemory" INTEGER NOT NULL DEFAULT 50,
    "rewardConditioning" INTEGER NOT NULL DEFAULT 50,
    "exposureLearning" INTEGER NOT NULL DEFAULT 50,
    "learnedRules" JSONB,
    "avoidancePatterns" JSONB,
    "reinforcementPatterns" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterConsequenceMemoryProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterConsequenceMemoryProfile_personId_worldStateId_key" ON "CharacterConsequenceMemoryProfile"("personId", "worldStateId");
CREATE INDEX "CharacterConsequenceMemoryProfile_personId_idx" ON "CharacterConsequenceMemoryProfile"("personId");
CREATE INDEX "CharacterConsequenceMemoryProfile_worldStateId_idx" ON "CharacterConsequenceMemoryProfile"("worldStateId");

ALTER TABLE "CharacterConsequenceMemoryProfile" ADD CONSTRAINT "CharacterConsequenceMemoryProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterConsequenceMemoryProfile" ADD CONSTRAINT "CharacterConsequenceMemoryProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterRumorReputationProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "publicTrust" INTEGER NOT NULL DEFAULT 50,
    "suspicionLoad" INTEGER NOT NULL DEFAULT 50,
    "scandalRisk" INTEGER NOT NULL DEFAULT 50,
    "narrativeControl" INTEGER NOT NULL DEFAULT 50,
    "rumorExposure" INTEGER NOT NULL DEFAULT 50,
    "reputationThemes" JSONB,
    "vulnerableNarratives" JSONB,
    "protectiveNarratives" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterRumorReputationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterRumorReputationProfile_personId_worldStateId_key" ON "CharacterRumorReputationProfile"("personId", "worldStateId");
CREATE INDEX "CharacterRumorReputationProfile_personId_idx" ON "CharacterRumorReputationProfile"("personId");
CREATE INDEX "CharacterRumorReputationProfile_worldStateId_idx" ON "CharacterRumorReputationProfile"("worldStateId");

ALTER TABLE "CharacterRumorReputationProfile" ADD CONSTRAINT "CharacterRumorReputationProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterRumorReputationProfile" ADD CONSTRAINT "CharacterRumorReputationProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WorldEducationNormProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "childTrainingModel" JSONB,
    "youthInitiationModel" JSONB,
    "elderTransmissionMode" JSONB,
    "literacyAccessPattern" JSONB,
    "specialistTrainingPaths" JSONB,
    "genderedTrainingDifferences" JSONB,
    "eliteKnowledgeAccess" INTEGER NOT NULL DEFAULT 50,
    "commonKnowledgeAccess" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldEducationNormProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldEducationNormProfile_worldStateId_key" ON "WorldEducationNormProfile"("worldStateId");
CREATE INDEX "WorldEducationNormProfile_worldStateId_idx" ON "WorldEducationNormProfile"("worldStateId");

ALTER TABLE "WorldEducationNormProfile" ADD CONSTRAINT "WorldEducationNormProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterEducationProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "primaryTrainingMode" "TrainingMode" NOT NULL DEFAULT 'MIXED',
    "literacyLevel" INTEGER NOT NULL DEFAULT 50,
    "numeracyLevel" INTEGER NOT NULL DEFAULT 50,
    "oralTraditionDepth" INTEGER NOT NULL DEFAULT 50,
    "ecologicalKnowledgeDepth" INTEGER NOT NULL DEFAULT 50,
    "institutionalSchoolingAccess" INTEGER NOT NULL DEFAULT 50,
    "apprenticeshipDomains" JSONB,
    "religiousInstructionDepth" INTEGER NOT NULL DEFAULT 50,
    "strategicTrainingDepth" INTEGER NOT NULL DEFAULT 50,
    "historicalAwarenessRange" INTEGER NOT NULL DEFAULT 50,
    "languageExposure" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterEducationProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterEducationProfile_personId_worldStateId_key" ON "CharacterEducationProfile"("personId", "worldStateId");
CREATE INDEX "CharacterEducationProfile_personId_idx" ON "CharacterEducationProfile"("personId");
CREATE INDEX "CharacterEducationProfile_worldStateId_idx" ON "CharacterEducationProfile"("worldStateId");

ALTER TABLE "CharacterEducationProfile" ADD CONSTRAINT "CharacterEducationProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterEducationProfile" ADD CONSTRAINT "CharacterEducationProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterLearningEnvelope" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "trainedCapacity" INTEGER NOT NULL DEFAULT 50,
    "expressiveCapacity" INTEGER NOT NULL DEFAULT 50,
    "pressureDistortion" INTEGER NOT NULL DEFAULT 50,
    "learnedAvoidance" INTEGER NOT NULL DEFAULT 50,
    "socialRiskAdjustedDisclosure" INTEGER NOT NULL DEFAULT 50,
    "summary" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterLearningEnvelope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterLearningEnvelope_personId_worldStateId_key" ON "CharacterLearningEnvelope"("personId", "worldStateId");
CREATE INDEX "CharacterLearningEnvelope_personId_idx" ON "CharacterLearningEnvelope"("personId");
CREATE INDEX "CharacterLearningEnvelope_worldStateId_idx" ON "CharacterLearningEnvelope"("worldStateId");

ALTER TABLE "CharacterLearningEnvelope" ADD CONSTRAINT "CharacterLearningEnvelope_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterLearningEnvelope" ADD CONSTRAINT "CharacterLearningEnvelope_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
