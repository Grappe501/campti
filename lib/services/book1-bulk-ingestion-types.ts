import type {
  Book1CanonStatus,
  Book1ConfidenceType,
  Book1ContentMode,
  Book1NodeType,
  Book1SceneComponentType,
} from "@/lib/domain/book1-ingestion";
import type { Book1ChunkClassificationResult, Book1ProvisionalSegment } from "@/lib/services/book1-ingestion-scaffold";

export type Book1RawChunkFile = {
  chunkNumber: number;
  uploadSequence: number;
  fileName: string;
  relativePath: string;
  absolutePath?: string;
  rawText: string;
};

export type Book1SupportingBriefFile = {
  fileName: string;
  relativePath: string;
  absolutePath?: string;
  rawText: string;
};

export type Book1BriefMatch = {
  brief: Book1SupportingBriefFile;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  signals: string[];
};

export type Book1ChunkBriefMatch = {
  chunk: Book1RawChunkFile;
  matchedBriefs: Book1BriefMatch[];
  matchConfidence: number;
};

export type Book1EnrichmentHints = {
  sceneAnchorCandidates: number[];
  sceneLayerRoleHints: Book1SceneComponentType[];
  canonStatusSuggestion: Book1CanonStatus;
  confidenceHint: Book1ConfidenceType;
  summaryHints: string[];
  titleHints: string[];
  warnings: string[];
};

export type Book1SourceProvenance = {
  rawChunkPath: string;
  rawChunkFileName: string;
  matchedBriefPaths: string[];
  matchedBriefFileNames: string[];
  segmentKey?: string;
  reviewRequired?: boolean;
};

export type Book1KnowledgeNodeInput = {
  nodeKey: string;
  nodeType: Book1NodeType;
  title: string;
  canonicalStatement: string;
  summaryShort: string | null;
  summaryLong: string | null;
  canonStatus: Book1CanonStatus;
  confidenceType: Book1ConfidenceType;
  confidenceScore: number | null;
  confidenceBand: "high" | "medium" | "low";
  provenance: Book1SourceProvenance;
  narrativeTags: string[];
};

export type Book1EntityInput = {
  entityKey: string;
  entityType:
    | "person"
    | "lineage"
    | "tribe"
    | "settlement"
    | "river"
    | "route"
    | "region"
    | "object"
    | "institution"
    | "ceremony"
    | "system"
    | "theme";
  displayName: string;
  normalizedName: string;
  description: string | null;
  confidenceBand: "high" | "medium" | "low";
  provenance: Book1SourceProvenance;
};

export type Book1EntityRelationshipInput = {
  fromNormalizedName: string;
  toNormalizedName: string;
  relationshipType:
    | "parent_of"
    | "child_of"
    | "part_of"
    | "allied_with"
    | "trades_with"
    | "moves_through"
    | "lives_in"
    | "symbolizes"
    | "governs"
    | "contradicts"
    | "contrasts_with"
    | "inherits_from"
    | "teaches"
    | "stabilizes"
    | "pressures"
    | "mediates_between";
  description: string | null;
  confidenceBand: "high" | "medium" | "low";
  provenance: Book1SourceProvenance;
};

export type Book1TimelineEventInput = {
  eventKey: string;
  title: string;
  description: string;
  yearLabel: string | null;
  dateStart: Date | null;
  eventType:
    | "historical_event"
    | "book_anchor"
    | "lineage_event"
    | "migration_event"
    | "death_event"
    | "birth_event"
    | "contact_event"
    | "rupture_event"
    | "system_shift";
  historicalOrStory: "historical" | "story";
  confidenceType: Book1ConfidenceType;
  confidenceBand: "high" | "medium" | "low";
  provenance: Book1SourceProvenance;
};

export type Book1SceneComponentInput = {
  componentKey: string;
  sceneAnchorNumber: number;
  componentType: Book1SceneComponentType;
  componentSubtype: string | null;
  textContent: string;
  summary: string | null;
  functionInScene: string | null;
  canonStatus: Book1CanonStatus;
  confidenceType: Book1ConfidenceType;
  confidenceBand: "high" | "medium" | "low";
  confidenceScore: number;
  provenance: Book1SourceProvenance;
  reviewWarnings: string[];
};

export type Book1RetrievalProfileInput = {
  objectType: "knowledge_node" | "scene_component" | "entity" | "timeline_event";
  objectStableKey: string;
  embeddingText: string;
  retrievalTags: string[];
  useCases: string[];
  spoilerLevel: string;
  priorityWeight: number;
};

export type Book1MapperOutput = {
  knowledgeNodes: Book1KnowledgeNodeInput[];
  entities: Book1EntityInput[];
  relationships: Book1EntityRelationshipInput[];
  timelineEvents: Book1TimelineEventInput[];
  sceneComponents: Book1SceneComponentInput[];
  retrievalProfiles: Book1RetrievalProfileInput[];
  detectedSceneAnchors: number[];
  ambiguousLayerAssignments: string[];
  warnings: string[];
  manualReviewQueue: string[];
  rejectedLineageCandidates: string[];
  downgradedSceneLayerAssignments: string[];
  boundaryEnforcementActions: string[];
};

export type Book1ChunkIngestionResult = {
  chunkFileName: string;
  chunkRelativePath: string;
  matchedBriefFileNames: string[];
  classifierResult: Book1ChunkClassificationResult;
  segmentCount: number;
  knowledgeNodesCommitted: number;
  entitiesCommitted: number;
  relationshipsCommitted: number;
  sceneComponentsCommitted: number;
  timelineEventsCommitted: number;
  retrievalProfilesCommitted: number;
  detectedSceneAnchors: number[];
  ambiguousLayerAssignments: string[];
  rejectedLineageCandidates: string[];
  downgradedSceneLayerAssignments: string[];
  boundaryEnforcementActions: string[];
  warnings: string[];
  manualReviewQueue: string[];
};

export type Book1BulkIngestionSummary = {
  totalChunksScanned: number;
  totalChunksIngested: number;
  chunksWithNoBriefs: number;
  chunksWithSceneMaterial: number;
  chunksWithLineageMaterial: number;
  chunksNeedingManualReview: number;
  totalRejectedLineageCandidates: number;
  totalDowngradedSceneLayerAssignments: number;
  totalBoundaryEnforcementActions: number;
};

export type Book1BulkIngestionReport = {
  generatedAt: string;
  dryRun: boolean;
  range: { fromChunk: number | null; toChunk: number | null };
  results: Book1ChunkIngestionResult[];
  summary: Book1BulkIngestionSummary;
};

export type Book1MapperInput = {
  rawChunk: Book1RawChunkFile;
  matchedBriefs: Book1BriefMatch[];
  classification: Book1ChunkClassificationResult;
  segments: Book1ProvisionalSegment[];
  hints: Book1EnrichmentHints;
};

export type Book1IngestionRange = {
  fromChunk: number | null;
  toChunk: number | null;
};

export function normalizeChunkLabel(input: string): number | null {
  const match = input.trim().toLowerCase().match(/^(?:chunk)?\s*(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
}

export function mapModeToSourceDominant(mode: Book1ContentMode): string {
  return mode.toUpperCase();
}
