-- Stage 6.5 extension — World + character health envelopes (world-state-shaped, not DSM-first).

CREATE TABLE "WorldHealthNormProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Health norms',
    "bodyInterpretationModel" JSONB,
    "mindInterpretationModel" JSONB,
    "emotionInterpretationModel" JSONB,
    "healingSystems" JSONB,
    "stigmaPatterns" JSONB,
    "communityCareCapacity" INTEGER NOT NULL DEFAULT 50,
    "institutionalCareCapacity" INTEGER NOT NULL DEFAULT 50,
    "survivalBurden" INTEGER NOT NULL DEFAULT 50,
    "restPossibility" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldHealthNormProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldHealthNormProfile_worldStateId_key" ON "WorldHealthNormProfile"("worldStateId");
CREATE INDEX "WorldHealthNormProfile_worldStateId_idx" ON "WorldHealthNormProfile"("worldStateId");

ALTER TABLE "WorldHealthNormProfile" ADD CONSTRAINT "WorldHealthNormProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterPhysicalHealthProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "injuryLoad" INTEGER NOT NULL DEFAULT 50,
    "chronicPainLoad" INTEGER NOT NULL DEFAULT 50,
    "illnessBurden" INTEGER NOT NULL DEFAULT 50,
    "nutritionStatus" INTEGER NOT NULL DEFAULT 50,
    "sleepQuality" INTEGER NOT NULL DEFAULT 50,
    "enduranceCapacity" INTEGER NOT NULL DEFAULT 50,
    "mobilityLimitationLoad" INTEGER NOT NULL DEFAULT 50,
    "reproductiveBurden" INTEGER NOT NULL DEFAULT 50,
    "agingBurden" INTEGER NOT NULL DEFAULT 50,
    "recoveryCapacity" INTEGER NOT NULL DEFAULT 50,
    "sensoryLimitations" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterPhysicalHealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterPhysicalHealthProfile_personId_worldStateId_key" ON "CharacterPhysicalHealthProfile"("personId", "worldStateId");
CREATE INDEX "CharacterPhysicalHealthProfile_personId_idx" ON "CharacterPhysicalHealthProfile"("personId");
CREATE INDEX "CharacterPhysicalHealthProfile_worldStateId_idx" ON "CharacterPhysicalHealthProfile"("worldStateId");

ALTER TABLE "CharacterPhysicalHealthProfile" ADD CONSTRAINT "CharacterPhysicalHealthProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterPhysicalHealthProfile" ADD CONSTRAINT "CharacterPhysicalHealthProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterMentalHealthProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "attentionStability" INTEGER NOT NULL DEFAULT 50,
    "clarityLevel" INTEGER NOT NULL DEFAULT 50,
    "intrusiveThoughtLoad" INTEGER NOT NULL DEFAULT 50,
    "dissociationTendency" INTEGER NOT NULL DEFAULT 50,
    "vigilanceLevel" INTEGER NOT NULL DEFAULT 50,
    "despairLoad" INTEGER NOT NULL DEFAULT 50,
    "controlCompulsion" INTEGER NOT NULL DEFAULT 50,
    "moodInstability" INTEGER NOT NULL DEFAULT 50,
    "stressTolerance" INTEGER NOT NULL DEFAULT 50,
    "realityCoherence" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterMentalHealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterMentalHealthProfile_personId_worldStateId_key" ON "CharacterMentalHealthProfile"("personId", "worldStateId");
CREATE INDEX "CharacterMentalHealthProfile_personId_idx" ON "CharacterMentalHealthProfile"("personId");
CREATE INDEX "CharacterMentalHealthProfile_worldStateId_idx" ON "CharacterMentalHealthProfile"("worldStateId");

ALTER TABLE "CharacterMentalHealthProfile" ADD CONSTRAINT "CharacterMentalHealthProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterMentalHealthProfile" ADD CONSTRAINT "CharacterMentalHealthProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterEmotionalHealthProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "emotionalRange" INTEGER NOT NULL DEFAULT 50,
    "suppressionLoad" INTEGER NOT NULL DEFAULT 50,
    "griefSaturation" INTEGER NOT NULL DEFAULT 50,
    "shameSaturation" INTEGER NOT NULL DEFAULT 50,
    "tendernessAccess" INTEGER NOT NULL DEFAULT 50,
    "angerRegulation" INTEGER NOT NULL DEFAULT 50,
    "fearCarryover" INTEGER NOT NULL DEFAULT 50,
    "relationalOpenness" INTEGER NOT NULL DEFAULT 50,
    "recoveryAfterDistress" INTEGER NOT NULL DEFAULT 50,
    "emotionalNumbnessLoad" INTEGER NOT NULL DEFAULT 50,
    "emotionalFloodingLoad" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterEmotionalHealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterEmotionalHealthProfile_personId_worldStateId_key" ON "CharacterEmotionalHealthProfile"("personId", "worldStateId");
CREATE INDEX "CharacterEmotionalHealthProfile_personId_idx" ON "CharacterEmotionalHealthProfile"("personId");
CREATE INDEX "CharacterEmotionalHealthProfile_worldStateId_idx" ON "CharacterEmotionalHealthProfile"("worldStateId");

ALTER TABLE "CharacterEmotionalHealthProfile" ADD CONSTRAINT "CharacterEmotionalHealthProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterEmotionalHealthProfile" ADD CONSTRAINT "CharacterEmotionalHealthProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CharacterHealthEnvelope" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "functionalCapacity" INTEGER NOT NULL DEFAULT 50,
    "careAccess" INTEGER NOT NULL DEFAULT 50,
    "visibleHealthPresentation" JSONB,
    "hiddenHealthBurden" JSONB,
    "socialInterpretation" JSONB,
    "simulationLayer" JSONB,
    "worldFacingHealthNarrative" JSONB,
    "summary" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterHealthEnvelope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterHealthEnvelope_personId_worldStateId_key" ON "CharacterHealthEnvelope"("personId", "worldStateId");
CREATE INDEX "CharacterHealthEnvelope_personId_idx" ON "CharacterHealthEnvelope"("personId");
CREATE INDEX "CharacterHealthEnvelope_worldStateId_idx" ON "CharacterHealthEnvelope"("worldStateId");

ALTER TABLE "CharacterHealthEnvelope" ADD CONSTRAINT "CharacterHealthEnvelope_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterHealthEnvelope" ADD CONSTRAINT "CharacterHealthEnvelope_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
