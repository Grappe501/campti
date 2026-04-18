-- RICRE — Research Ingestion & Canon Reconciliation Engine (author-controlled)

CREATE TABLE "AuthorResearchTarget" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "researchIntent" TEXT,
    "linkedSceneIds" JSONB NOT NULL DEFAULT '[]',
    "linkedChapterIds" JSONB NOT NULL DEFAULT '[]',
    "linkedBookIds" JSONB NOT NULL DEFAULT '[]',
    "linkedPersonIds" JSONB NOT NULL DEFAULT '[]',
    "linkedPlaceIds" JSONB NOT NULL DEFAULT '[]',
    "linkedEraIds" JSONB NOT NULL DEFAULT '[]',
    "linkedThreadIds" JSONB NOT NULL DEFAULT '[]',
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorResearchTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorResearchTarget_targetType_idx" ON "AuthorResearchTarget"("targetType");
CREATE INDEX "AuthorResearchTarget_targetName_idx" ON "AuthorResearchTarget"("targetName");

CREATE TABLE "AuthorResearchSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "researchTargetId" TEXT NOT NULL,
    "legacySourceId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publisher" TEXT,
    "authorAttribution" TEXT,
    "publicationDate" TEXT,
    "accessDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provenanceHash" TEXT NOT NULL,
    "ingestMethod" TEXT NOT NULL,
    "sourceTrustTier" TEXT NOT NULL,
    "rawContentRef" TEXT,
    "rawExcerpt" TEXT,
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorResearchSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorResearchSource_researchTargetId_idx" ON "AuthorResearchSource"("researchTargetId");
CREATE INDEX "AuthorResearchSource_legacySourceId_idx" ON "AuthorResearchSource"("legacySourceId");
CREATE INDEX "AuthorResearchSource_provenanceHash_idx" ON "AuthorResearchSource"("provenanceHash");

CREATE TABLE "AuthorResearchEvidence" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "researchTargetId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "extractedTextRef" TEXT,
    "summary" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorResearchEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorResearchEvidence_researchTargetId_idx" ON "AuthorResearchEvidence"("researchTargetId");
CREATE INDEX "AuthorResearchEvidence_sourceId_idx" ON "AuthorResearchEvidence"("sourceId");

CREATE TABLE "AuthorResearchClaim" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "researchTargetId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "claimType" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "structuredValue" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "timeScope" TEXT,
    "placeScope" TEXT,
    "peopleScope" JSONB,
    "materialCultureScope" TEXT,
    "languageScope" TEXT,
    "sensoryScope" TEXT,
    "contradictionPotential" TEXT,
    "claimStatus" TEXT NOT NULL DEFAULT 'pending',
    "extractionMethod" TEXT NOT NULL DEFAULT 'heuristic_stub',
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorResearchClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorResearchClaim_researchTargetId_idx" ON "AuthorResearchClaim"("researchTargetId");
CREATE INDEX "AuthorResearchClaim_sourceId_idx" ON "AuthorResearchClaim"("sourceId");
CREATE INDEX "AuthorResearchClaim_claimType_idx" ON "AuthorResearchClaim"("claimType");
CREATE INDEX "AuthorResearchClaim_claimStatus_idx" ON "AuthorResearchClaim"("claimStatus");

CREATE TABLE "AuthorCanonComparison" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimId" TEXT NOT NULL,
    "comparedAgainstType" TEXT NOT NULL,
    "comparedAgainstId" TEXT NOT NULL,
    "comparisonResult" TEXT NOT NULL,
    "contradictionType" TEXT,
    "impactScope" TEXT,
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorCanonComparison_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorCanonComparison_claimId_idx" ON "AuthorCanonComparison"("claimId");
CREATE INDEX "AuthorCanonComparison_comparedAgainstType_comparedAgainstId_idx" ON "AuthorCanonComparison"("comparedAgainstType", "comparedAgainstId");

CREATE TABLE "AuthorCanonDecision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimId" TEXT NOT NULL,
    "authorDecision" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "resultingCanonAction" TEXT NOT NULL,
    "resultingCanonRecordId" TEXT,
    "intentionalDivergenceFlag" BOOLEAN NOT NULL DEFAULT false,
    "overrideNotes" TEXT,
    "decidedBy" TEXT,
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorCanonDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorCanonDecision_claimId_idx" ON "AuthorCanonDecision"("claimId");

CREATE TABLE "AuthorCanonKnowledgeRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canonicalStatus" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "knowledgeType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "structuredValue" JSONB,
    "sourceLinks" JSONB NOT NULL DEFAULT '[]',
    "decisionHistory" JSONB NOT NULL DEFAULT '[]',
    "historicalRealityStatus" TEXT NOT NULL,
    "storyRealityStatus" TEXT NOT NULL,
    "originatingClaimId" TEXT,
    "impactSummary" TEXT,
    "validationFlags" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "AuthorCanonKnowledgeRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorCanonKnowledgeRecord_canonicalStatus_targetType_targetId_idx" ON "AuthorCanonKnowledgeRecord"("canonicalStatus", "targetType", "targetId");
CREATE INDEX "AuthorCanonKnowledgeRecord_originatingClaimId_idx" ON "AuthorCanonKnowledgeRecord"("originatingClaimId");

ALTER TABLE "AuthorResearchSource" ADD CONSTRAINT "AuthorResearchSource_researchTargetId_fkey" FOREIGN KEY ("researchTargetId") REFERENCES "AuthorResearchTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorResearchSource" ADD CONSTRAINT "AuthorResearchSource_legacySourceId_fkey" FOREIGN KEY ("legacySourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuthorResearchEvidence" ADD CONSTRAINT "AuthorResearchEvidence_researchTargetId_fkey" FOREIGN KEY ("researchTargetId") REFERENCES "AuthorResearchTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorResearchEvidence" ADD CONSTRAINT "AuthorResearchEvidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AuthorResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthorResearchClaim" ADD CONSTRAINT "AuthorResearchClaim_researchTargetId_fkey" FOREIGN KEY ("researchTargetId") REFERENCES "AuthorResearchTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorResearchClaim" ADD CONSTRAINT "AuthorResearchClaim_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AuthorResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorResearchClaim" ADD CONSTRAINT "AuthorResearchClaim_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "AuthorResearchEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuthorCanonComparison" ADD CONSTRAINT "AuthorCanonComparison_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "AuthorResearchClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthorCanonDecision" ADD CONSTRAINT "AuthorCanonDecision_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "AuthorResearchClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
