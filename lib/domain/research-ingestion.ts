/**
 * RICRE — Research Ingestion domain (machine contracts).
 * Internet and external material inform canon; they never silently become story canon without author reconciliation.
 */

import { z } from "zod";

export const RICRE_RESEARCH_INGESTION_CONTRACT_VERSION = "1" as const;

export const RESEARCH_TARGET_TYPES = [
  "scene",
  "character",
  "setting",
  "era",
  "route",
  "object",
  "belief_custom_ritual",
  "speech_dialect",
  "historical_event",
  "relationship_structure",
  "environment",
  "trade_logistics",
  "other",
] as const;
export type ResearchTargetType = (typeof RESEARCH_TARGET_TYPES)[number];

export const RESEARCH_SOURCE_TYPES = ["url", "upload", "manual_paste", "topic_query", "legacy_source"] as const;
export type ResearchSourceType = (typeof RESEARCH_SOURCE_TYPES)[number];

export const SOURCE_TRUST_TIERS = ["primary", "secondary", "tertiary", "popular_or_unverified", "unknown"] as const;
export type SourceTrustTier = (typeof SOURCE_TRUST_TIERS)[number];

export const INGEST_METHODS = [
  "author_url_fetch",
  "author_url_fetch_failed",
  "author_manual_paste",
  "author_topic_stub",
  "legacy_source_bridge",
] as const;
export type IngestMethod = (typeof INGEST_METHODS)[number];

export type ResearchTarget = {
  contractVersion: typeof RICRE_RESEARCH_INGESTION_CONTRACT_VERSION;
  targetId: string;
  targetType: ResearchTargetType;
  targetName: string;
  linkedSceneIds: string[];
  linkedChapterIds: string[];
  linkedBookIds: string[];
  linkedCharacterIds: string[];
  linkedSettingIds: string[];
  linkedEraIds: string[];
  linkedThreadIds: string[];
  researchIntent: string | null;
  validationFlags: string[];
};

export type ResearchSourceRecord = {
  contractVersion: typeof RICRE_RESEARCH_INGESTION_CONTRACT_VERSION;
  sourceId: string;
  sourceType: ResearchSourceType;
  sourceTitle: string;
  sourceUrl: string | null;
  publisher: string | null;
  author: string | null;
  publicationDate: string | null;
  accessDate: string;
  provenanceHash: string;
  ingestMethod: IngestMethod;
  sourceTrustTier: SourceTrustTier;
  rawContentRef: string | null;
  validationFlags: string[];
  researchTargetId: string;
  legacySourceId: string | null;
};

export const EXTRACTED_CLAIM_TYPES = [
  "fact_claim",
  "descriptive_detail",
  "sensory_detail",
  "cultural_practice",
  "timeline_constraint",
  "geography_constraint",
  "route_constraint",
  "language_signal",
  "object_usage",
  "social_norm",
  "conflicting_claim",
  "interpretive_claim",
  "story_useful_detail",
] as const;
export type ExtractedClaimType = (typeof EXTRACTED_CLAIM_TYPES)[number];

export type ResearchEvidenceRecord = {
  contractVersion: typeof RICRE_RESEARCH_INGESTION_CONTRACT_VERSION;
  evidenceId: string;
  sourceId: string;
  targetId: string;
  extractedTextRef: string | null;
  summary: string;
  confidence: number;
  relevanceScore: number;
  validationFlags: string[];
};

export type ExtractedKnowledgeClaim = {
  contractVersion: typeof RICRE_RESEARCH_INGESTION_CONTRACT_VERSION;
  claimId: string;
  targetId: string;
  sourceId: string;
  evidenceId: string | null;
  claimType: ExtractedClaimType;
  claimText: string;
  structuredValue: Record<string, unknown> | null;
  confidence: number;
  timeScope: string | null;
  placeScope: string | null;
  peopleScope: string[] | null;
  materialCultureScope: string | null;
  languageScope: string | null;
  sensoryScope: string | null;
  contradictionPotential: "low" | "medium" | "high" | null;
  claimStatus: "pending" | "extracted" | "compared" | "decided" | "rejected" | "superseded";
  extractionMethod: string;
  validationFlags: string[];
};

export const ResearchTargetWireSchema = z.object({
  targetType: z.enum(RESEARCH_TARGET_TYPES),
  targetName: z.string().min(1),
  linkedSceneIds: z.array(z.string()).default([]),
  linkedChapterIds: z.array(z.string()).default([]),
  linkedBookIds: z.array(z.string()).default([]),
  linkedCharacterIds: z.array(z.string()).default([]),
  linkedSettingIds: z.array(z.string()).default([]),
  linkedEraIds: z.array(z.string()).default([]),
  linkedThreadIds: z.array(z.string()).default([]),
  researchIntent: z.string().nullable().optional(),
});
