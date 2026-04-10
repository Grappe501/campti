-- Stage 2 — Ontology & registry spine (controlled vocabulary + profiles).
-- Apply: npx prisma migrate deploy

CREATE TYPE "OntologyFamily" AS ENUM (
  'ENTITY',
  'NARRATIVE',
  'SIMULATION',
  'ENVIRONMENT',
  'RELATIONSHIP',
  'SUPPORT'
);

CREATE TYPE "RegistryFamily" AS ENUM (
  'SYMBOLIC',
  'RELATIONSHIP',
  'ENVIRONMENT',
  'PRESSURE',
  'PERMISSION',
  'READINESS',
  'BRANCH',
  'GENERAL'
);

CREATE TABLE "OntologyType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "family" "OntologyFamily" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recordType" "RecordType" NOT NULL,
    "visibility" "VisibilityStatus" NOT NULL,
    "appliesTo" JSONB,
    "sourceTraceNote" TEXT,
    "notes" TEXT,

    CONSTRAINT "OntologyType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OntologyType_key_key" ON "OntologyType"("key");
CREATE INDEX "OntologyType_family_idx" ON "OntologyType"("family");
CREATE INDEX "OntologyType_isActive_idx" ON "OntologyType"("isActive");
CREATE INDEX "OntologyType_recordType_idx" ON "OntologyType"("recordType");
CREATE INDEX "OntologyType_visibility_idx" ON "OntologyType"("visibility");

CREATE TABLE "RegistryValue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "registryType" TEXT NOT NULL DEFAULT 'default',
    "family" "RegistryFamily" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "appliesTo" JSONB,
    "sourceTraceNote" TEXT,
    "notes" TEXT,

    CONSTRAINT "RegistryValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegistryValue_key_key" ON "RegistryValue"("key");
CREATE INDEX "RegistryValue_family_idx" ON "RegistryValue"("family");
CREATE INDEX "RegistryValue_registryType_idx" ON "RegistryValue"("registryType");
CREATE INDEX "RegistryValue_isActive_idx" ON "RegistryValue"("isActive");
CREATE INDEX "RegistryValue_sortOrder_idx" ON "RegistryValue"("sortOrder");

CREATE TABLE "NarrativePermissionProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowsDirectNarrativeUse" BOOLEAN NOT NULL DEFAULT false,
    "allowsSceneSupport" BOOLEAN NOT NULL DEFAULT false,
    "allowsAtmosphereSupport" BOOLEAN NOT NULL DEFAULT false,
    "allowsCanonicalReveal" BOOLEAN NOT NULL DEFAULT false,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "notes" TEXT,

    CONSTRAINT "NarrativePermissionProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NarrativePermissionProfile_key_key" ON "NarrativePermissionProfile"("key");
CREATE INDEX "NarrativePermissionProfile_isActive_idx" ON "NarrativePermissionProfile"("isActive");

CREATE TABLE "ConfidenceProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "numericValue" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "notes" TEXT,

    CONSTRAINT "ConfidenceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfidenceProfile_key_key" ON "ConfidenceProfile"("key");
CREATE INDEX "ConfidenceProfile_numericValue_idx" ON "ConfidenceProfile"("numericValue");
CREATE INDEX "ConfidenceProfile_isActive_idx" ON "ConfidenceProfile"("isActive");

CREATE TABLE "SceneReadinessProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDraftable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recordType" "RecordType" NOT NULL DEFAULT 'hybrid',
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'review',
    "notes" TEXT,

    CONSTRAINT "SceneReadinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SceneReadinessProfile_key_key" ON "SceneReadinessProfile"("key");
CREATE INDEX "SceneReadinessProfile_isActive_idx" ON "SceneReadinessProfile"("isActive");
