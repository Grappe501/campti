-- Stage 3.1 — WorldStateReference, CharacterState world columns, Environment & Node Engine.
-- Non-breaking: nullable columns on CharacterState; new tables and indexes.
-- Apply: npx prisma migrate deploy
-- If your dev DB was updated with `prisma db push` and already contains these objects, baseline or resolve this migration per Prisma docs before deploy.

-- CreateEnum
CREATE TYPE "EnvironmentRiskCategory" AS ENUM ('FLOOD', 'DISEASE', 'CONFLICT', 'ISOLATION', 'SCARCITY', 'SURVEILLANCE', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "NodeConnectionType" AS ENUM ('RIVER', 'BAYOU', 'TRAIL', 'ROAD', 'FERRY', 'MILITARY_ROUTE', 'TRADE_PATH');

-- CreateEnum
CREATE TYPE "PlaceMemoryType" AS ENUM ('SACRED', 'TRAUMA', 'BURIAL', 'TRADE', 'WAR', 'COMMUNITY', 'DISPLACEMENT', 'CONTINUITY');

-- CreateTable
CREATE TABLE "WorldStateReference" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eraId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "WorldStateReference_pkey" PRIMARY KEY ("id")
);

-- AlterTable (forward-compatible nulls)
ALTER TABLE "CharacterState" ADD COLUMN IF NOT EXISTS "worldStateId" TEXT,
ADD COLUMN IF NOT EXISTS "environmentSnapshot" JSONB,
ADD COLUMN IF NOT EXISTS "powerContext" JSONB,
ADD COLUMN IF NOT EXISTS "economicContext" JSONB,
ADD COLUMN IF NOT EXISTS "socialContext" JSONB;

-- CreateTable
CREATE TABLE "PlaceEnvironmentProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placeId" TEXT NOT NULL,
    "terrainType" TEXT,
    "hydrologyType" TEXT,
    "fertilityProfile" TEXT,
    "floodRiskLevel" INTEGER NOT NULL DEFAULT 0,
    "droughtRiskLevel" INTEGER NOT NULL DEFAULT 0,
    "mobilityProfile" TEXT,
    "sensoryProfile" JSONB,
    "resourceProfile" JSONB,
    "sacredProfile" JSONB,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "PlaceEnvironmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placeId" TEXT NOT NULL,
    "worldStateId" TEXT,
    "label" TEXT NOT NULL,
    "settlementPattern" TEXT,
    "strategicValue" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" INTEGER NOT NULL DEFAULT 0,
    "controlProfile" JSONB,
    "accessProfile" JSONB,
    "transportProfile" JSONB,
    "economicProfile" JSONB,
    "pressureProfile" JSONB,
    "memoryLoad" JSONB,
    "activePopulationEstimate" INTEGER,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "PlaceState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentNode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "nodeType" TEXT,
    "isCoreNode" BOOLEAN NOT NULL DEFAULT false,
    "regionLabel" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "EnvironmentNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "connectionType" "NodeConnectionType" NOT NULL,
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,
    "travelRisk" INTEGER NOT NULL DEFAULT 0,
    "travelDifficulty" INTEGER NOT NULL DEFAULT 0,
    "seasonalModifier" JSONB,
    "worldStateId" TEXT,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "NodeConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRegime" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" "EnvironmentRiskCategory" NOT NULL,
    "baseSeverity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "RiskRegime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceMemoryProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placeId" TEXT NOT NULL,
    "memoryType" "PlaceMemoryType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "worldStateId" TEXT,
    "notes" TEXT,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "certainty" TEXT,

    CONSTRAINT "PlaceMemoryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldStateReference_eraId_key" ON "WorldStateReference"("eraId");

-- CreateIndex
CREATE INDEX "WorldStateReference_eraId_idx" ON "WorldStateReference"("eraId");

-- CreateIndex
CREATE INDEX "CharacterState_worldStateId_idx" ON "CharacterState"("worldStateId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceEnvironmentProfile_placeId_key" ON "PlaceEnvironmentProfile"("placeId");

-- CreateIndex
CREATE INDEX "PlaceEnvironmentProfile_placeId_idx" ON "PlaceEnvironmentProfile"("placeId");

-- CreateIndex
CREATE INDEX "PlaceState_placeId_idx" ON "PlaceState"("placeId");

-- CreateIndex
CREATE INDEX "PlaceState_worldStateId_idx" ON "PlaceState"("worldStateId");

-- CreateIndex
CREATE INDEX "PlaceState_label_idx" ON "PlaceState"("label");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentNode_key_key" ON "EnvironmentNode"("key");

-- CreateIndex
CREATE INDEX "EnvironmentNode_placeId_idx" ON "EnvironmentNode"("placeId");

-- CreateIndex
CREATE INDEX "EnvironmentNode_nodeType_idx" ON "EnvironmentNode"("nodeType");

-- CreateIndex
CREATE INDEX "NodeConnection_fromNodeId_idx" ON "NodeConnection"("fromNodeId");

-- CreateIndex
CREATE INDEX "NodeConnection_toNodeId_idx" ON "NodeConnection"("toNodeId");

-- CreateIndex
CREATE INDEX "NodeConnection_connectionType_idx" ON "NodeConnection"("connectionType");

-- CreateIndex
CREATE INDEX "NodeConnection_worldStateId_idx" ON "NodeConnection"("worldStateId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRegime_key_key" ON "RiskRegime"("key");

-- CreateIndex
CREATE INDEX "RiskRegime_category_idx" ON "RiskRegime"("category");

-- CreateIndex
CREATE INDEX "PlaceMemoryProfile_placeId_idx" ON "PlaceMemoryProfile"("placeId");

-- CreateIndex
CREATE INDEX "PlaceMemoryProfile_memoryType_idx" ON "PlaceMemoryProfile"("memoryType");

-- CreateIndex
CREATE INDEX "PlaceMemoryProfile_worldStateId_idx" ON "PlaceMemoryProfile"("worldStateId");

-- AddForeignKey
ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceEnvironmentProfile" ADD CONSTRAINT "PlaceEnvironmentProfile_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceState" ADD CONSTRAINT "PlaceState_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceState" ADD CONSTRAINT "PlaceState_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentNode" ADD CONSTRAINT "EnvironmentNode_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeConnection" ADD CONSTRAINT "NodeConnection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "EnvironmentNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeConnection" ADD CONSTRAINT "NodeConnection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "EnvironmentNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeConnection" ADD CONSTRAINT "NodeConnection_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceMemoryProfile" ADD CONSTRAINT "PlaceMemoryProfile_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceMemoryProfile" ADD CONSTRAINT "PlaceMemoryProfile_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
