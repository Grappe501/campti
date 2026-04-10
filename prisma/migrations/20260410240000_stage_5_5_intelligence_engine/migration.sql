-- Stage 5.5 — Intelligence, knowledge horizon, maturity, biological modifiers (character × world slices).

CREATE TABLE "WorldKnowledgeProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "label" TEXT,
    "abstractionCeiling" INTEGER NOT NULL DEFAULT 50,
    "literacyRegime" TEXT,
    "dominantExplanatorySystems" JSONB,
    "technologyHorizon" JSONB,
    "informationFlowSpeed" INTEGER NOT NULL DEFAULT 50,
    "geographicAwarenessNorm" TEXT,
    "tabooKnowledgeDomains" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldKnowledgeProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldKnowledgeProfile_worldStateId_key" ON "WorldKnowledgeProfile"("worldStateId");

CREATE TABLE "WorldExpressionProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "label" TEXT,
    "publicExpressionCeiling" INTEGER NOT NULL DEFAULT 50,
    "internalLanguageComplexityNorm" INTEGER NOT NULL DEFAULT 50,
    "metaphorSourceDomains" JSONB,
    "acceptableExplanationModes" JSONB,
    "silencePatternsNorm" TEXT,
    "tabooPhrasingDomains" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldExpressionProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldExpressionProfile_worldStateId_key" ON "WorldExpressionProfile"("worldStateId");

CREATE TABLE "CharacterIntelligenceProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "patternRecognition" INTEGER NOT NULL DEFAULT 50,
    "workingMemory" INTEGER NOT NULL DEFAULT 50,
    "abstractionCapacity" INTEGER NOT NULL DEFAULT 50,
    "socialInference" INTEGER NOT NULL DEFAULT 50,
    "environmentalInference" INTEGER NOT NULL DEFAULT 50,
    "selfReflectionDepth" INTEGER NOT NULL DEFAULT 50,
    "impulseControl" INTEGER NOT NULL DEFAULT 50,
    "planningHorizon" INTEGER NOT NULL DEFAULT 50,
    "metacognition" INTEGER NOT NULL DEFAULT 50,
    "memoryStrength" INTEGER NOT NULL DEFAULT 50,
    "expressionComplexity" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterIntelligenceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterIntelligenceProfile_personId_worldStateId_key" ON "CharacterIntelligenceProfile"("personId", "worldStateId");

CREATE TABLE "CharacterDevelopmentProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "ageBand" TEXT,
    "maturityRate" INTEGER NOT NULL DEFAULT 50,
    "socialRoleByAge" TEXT,
    "regulationLevel" INTEGER NOT NULL DEFAULT 50,
    "responsibilityLoad" INTEGER NOT NULL DEFAULT 50,
    "roleCompression" INTEGER NOT NULL DEFAULT 50,
    "protectednessExposure" INTEGER NOT NULL DEFAULT 50,
    "developmentalCompression" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterDevelopmentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterDevelopmentProfile_personId_worldStateId_key" ON "CharacterDevelopmentProfile"("personId", "worldStateId");

CREATE TABLE "CharacterBiologicalState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "nutritionLoad" INTEGER NOT NULL DEFAULT 50,
    "fatigueLoad" INTEGER NOT NULL DEFAULT 50,
    "illnessLoad" INTEGER NOT NULL DEFAULT 50,
    "chronicStress" INTEGER NOT NULL DEFAULT 50,
    "bodyPain" INTEGER NOT NULL DEFAULT 50,
    "reproductiveLoad" INTEGER,
    "laborExhaustion" INTEGER NOT NULL DEFAULT 50,
    "environmentalExposure" INTEGER NOT NULL DEFAULT 50,
    "traumaLoad" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterBiologicalState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterBiologicalState_personId_worldStateId_key" ON "CharacterBiologicalState"("personId", "worldStateId");

CREATE INDEX "CharacterIntelligenceProfile_personId_idx" ON "CharacterIntelligenceProfile"("personId");
CREATE INDEX "CharacterIntelligenceProfile_worldStateId_idx" ON "CharacterIntelligenceProfile"("worldStateId");
CREATE INDEX "CharacterDevelopmentProfile_personId_idx" ON "CharacterDevelopmentProfile"("personId");
CREATE INDEX "CharacterDevelopmentProfile_worldStateId_idx" ON "CharacterDevelopmentProfile"("worldStateId");
CREATE INDEX "CharacterBiologicalState_personId_idx" ON "CharacterBiologicalState"("personId");
CREATE INDEX "CharacterBiologicalState_worldStateId_idx" ON "CharacterBiologicalState"("worldStateId");
CREATE INDEX "WorldKnowledgeProfile_worldStateId_idx" ON "WorldKnowledgeProfile"("worldStateId");
CREATE INDEX "WorldExpressionProfile_worldStateId_idx" ON "WorldExpressionProfile"("worldStateId");

ALTER TABLE "WorldKnowledgeProfile" ADD CONSTRAINT "WorldKnowledgeProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorldExpressionProfile" ADD CONSTRAINT "WorldExpressionProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharacterIntelligenceProfile" ADD CONSTRAINT "CharacterIntelligenceProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterIntelligenceProfile" ADD CONSTRAINT "CharacterIntelligenceProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharacterDevelopmentProfile" ADD CONSTRAINT "CharacterDevelopmentProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterDevelopmentProfile" ADD CONSTRAINT "CharacterDevelopmentProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharacterBiologicalState" ADD CONSTRAINT "CharacterBiologicalState_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterBiologicalState" ADD CONSTRAINT "CharacterBiologicalState_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
