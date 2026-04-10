-- Stage 6 — Relationship, desire, masking, disclosure, network summary (world-sliced).

CREATE TYPE "RelationshipType" AS ENUM (
  'KINSHIP',
  'ALLIANCE',
  'FRIENDSHIP',
  'MARRIAGE_BOND',
  'COURTSHIP',
  'CHOSEN_FAMILY',
  'PROTECTIVE',
  'DOMINANCE',
  'TRANSLATION_BRIDGE',
  'RIVALRY',
  'SPIRITUAL_AUTHORITY',
  'ECONOMIC_DEPENDENCY'
);

CREATE TYPE "AttachmentStyle" AS ENUM (
  'SECURE',
  'ANXIOUS',
  'AVOIDANT',
  'DISORGANIZED',
  'DUTY_BOUND',
  'SPLIT_EXPRESSION'
);

CREATE TYPE "PublicStatus" AS ENUM (
  'OPEN',
  'IMPLIED',
  'HIDDEN',
  'DENIED',
  'FORCED',
  'CODED'
);

CREATE TABLE "RelationshipProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "publicStatus" "PublicStatus" NOT NULL,
    "privateStatus" TEXT,
    "hiddenTruth" JSONB,
    "powerDirection" JSONB,
    "dependencyDirection" JSONB,
    "trustLevel" INTEGER NOT NULL DEFAULT 50,
    "fearLevel" INTEGER NOT NULL DEFAULT 50,
    "shameLeverage" INTEGER NOT NULL DEFAULT 50,
    "obligationWeight" INTEGER NOT NULL DEFAULT 50,
    "betrayalThreshold" INTEGER NOT NULL DEFAULT 50,
    "rescueThreshold" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "RelationshipProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RelationshipProfile_personAId_personBId_worldStateId_key" ON "RelationshipProfile"("personAId", "personBId", "worldStateId");

CREATE TABLE "RelationshipDynamicState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relationshipProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emotionalTemperature" INTEGER NOT NULL DEFAULT 50,
    "volatility" INTEGER NOT NULL DEFAULT 50,
    "intimacyLevel" INTEGER NOT NULL DEFAULT 50,
    "conflictLoad" INTEGER NOT NULL DEFAULT 50,
    "mutualRecognition" INTEGER NOT NULL DEFAULT 50,
    "disclosureSafety" INTEGER NOT NULL DEFAULT 50,
    "currentTensions" JSONB,
    "currentNeeds" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "RelationshipDynamicState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterMaskingProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "maskingIntensity" INTEGER NOT NULL DEFAULT 50,
    "codeSwitchingLoad" INTEGER NOT NULL DEFAULT 50,
    "secrecyNeed" INTEGER NOT NULL DEFAULT 50,
    "disclosureRisk" INTEGER NOT NULL DEFAULT 50,
    "authenticPrivateSelf" JSONB,
    "publicMask" JSONB,
    "trustedCircleExpression" JSONB,
    "forbiddenExpression" JSONB,
    "adaptiveStrategies" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterMaskingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterMaskingProfile_personId_worldStateId_key" ON "CharacterMaskingProfile"("personId", "worldStateId");

CREATE TABLE "CharacterDesireProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "attractionPattern" JSONB,
    "attachmentStyle" "AttachmentStyle" NOT NULL DEFAULT 'DUTY_BOUND',
    "desireVisibility" INTEGER NOT NULL DEFAULT 50,
    "desireSuppression" INTEGER NOT NULL DEFAULT 50,
    "jealousySensitivity" INTEGER NOT NULL DEFAULT 50,
    "loyaltyPriority" JSONB,
    "intimacyNeed" INTEGER NOT NULL DEFAULT 50,
    "autonomyNeed" INTEGER NOT NULL DEFAULT 50,
    "tabooExposureRisk" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "CharacterDesireProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterDesireProfile_personId_worldStateId_key" ON "CharacterDesireProfile"("personId", "worldStateId");

CREATE TABLE "WorldRelationshipNormProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "marriageRules" JSONB,
    "sexualNorms" JSONB,
    "desireExpressionRules" JSONB,
    "tabooSystem" JSONB,
    "emotionalExpressionRules" JSONB,
    "genderDynamics" JSONB,
    "relationalVisibility" INTEGER NOT NULL DEFAULT 50,
    "punishmentForViolation" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldRelationshipNormProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorldRelationshipNormProfile_worldStateId_key" ON "WorldRelationshipNormProfile"("worldStateId");

CREATE TABLE "RelationshipDisclosureProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relationshipProfileId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "truthShareCapacity" INTEGER NOT NULL DEFAULT 50,
    "emotionalDisclosureCapacity" INTEGER NOT NULL DEFAULT 50,
    "secrecyBurden" INTEGER NOT NULL DEFAULT 50,
    "misrecognitionRisk" INTEGER NOT NULL DEFAULT 50,
    "exposureConsequence" INTEGER NOT NULL DEFAULT 50,
    "safeTopics" JSONB,
    "unsafeTopics" JSONB,
    "codedChannels" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "RelationshipDisclosureProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RelationshipDisclosureProfile_relationshipProfileId_worldStateId_key" ON "RelationshipDisclosureProfile"("relationshipProfileId", "worldStateId");

CREATE TABLE "RelationshipNetworkSummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "keyBonds" JSONB,
    "primaryTensions" JSONB,
    "dependencyMap" JSONB,
    "trustMap" JSONB,
    "hiddenConflicts" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "RelationshipNetworkSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RelationshipNetworkSummary_personId_worldStateId_key" ON "RelationshipNetworkSummary"("personId", "worldStateId");

CREATE INDEX "RelationshipProfile_personAId_idx" ON "RelationshipProfile"("personAId");
CREATE INDEX "RelationshipProfile_personBId_idx" ON "RelationshipProfile"("personBId");
CREATE INDEX "RelationshipProfile_worldStateId_idx" ON "RelationshipProfile"("worldStateId");
CREATE INDEX "RelationshipProfile_relationshipType_idx" ON "RelationshipProfile"("relationshipType");
CREATE INDEX "RelationshipDynamicState_relationshipProfileId_idx" ON "RelationshipDynamicState"("relationshipProfileId");
CREATE INDEX "CharacterMaskingProfile_personId_idx" ON "CharacterMaskingProfile"("personId");
CREATE INDEX "CharacterMaskingProfile_worldStateId_idx" ON "CharacterMaskingProfile"("worldStateId");
CREATE INDEX "CharacterDesireProfile_personId_idx" ON "CharacterDesireProfile"("personId");
CREATE INDEX "CharacterDesireProfile_worldStateId_idx" ON "CharacterDesireProfile"("worldStateId");
CREATE INDEX "WorldRelationshipNormProfile_worldStateId_idx" ON "WorldRelationshipNormProfile"("worldStateId");
CREATE INDEX "RelationshipDisclosureProfile_relationshipProfileId_idx" ON "RelationshipDisclosureProfile"("relationshipProfileId");
CREATE INDEX "RelationshipDisclosureProfile_worldStateId_idx" ON "RelationshipDisclosureProfile"("worldStateId");
CREATE INDEX "RelationshipNetworkSummary_personId_idx" ON "RelationshipNetworkSummary"("personId");
CREATE INDEX "RelationshipNetworkSummary_worldStateId_idx" ON "RelationshipNetworkSummary"("worldStateId");

ALTER TABLE "RelationshipProfile" ADD CONSTRAINT "RelationshipProfile_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipProfile" ADD CONSTRAINT "RelationshipProfile_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipProfile" ADD CONSTRAINT "RelationshipProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelationshipDynamicState" ADD CONSTRAINT "RelationshipDynamicState_relationshipProfileId_fkey" FOREIGN KEY ("relationshipProfileId") REFERENCES "RelationshipProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterMaskingProfile" ADD CONSTRAINT "CharacterMaskingProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterMaskingProfile" ADD CONSTRAINT "CharacterMaskingProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CharacterDesireProfile" ADD CONSTRAINT "CharacterDesireProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CharacterDesireProfile" ADD CONSTRAINT "CharacterDesireProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorldRelationshipNormProfile" ADD CONSTRAINT "WorldRelationshipNormProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelationshipDisclosureProfile" ADD CONSTRAINT "RelationshipDisclosureProfile_relationshipProfileId_fkey" FOREIGN KEY ("relationshipProfileId") REFERENCES "RelationshipProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipDisclosureProfile" ADD CONSTRAINT "RelationshipDisclosureProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RelationshipNetworkSummary" ADD CONSTRAINT "RelationshipNetworkSummary_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipNetworkSummary" ADD CONSTRAINT "RelationshipNetworkSummary_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
