import type { Prisma } from "@prisma/client";

export type Book1SourceKind =
  | "uploaded_chunk"
  | "research_note"
  | "synthesis_note"
  | "scene_draft"
  | "character_note";

export type Book1ContentMode =
  | "history"
  | "lineage"
  | "worldbuilding"
  | "scene_text"
  | "pov_text"
  | "setting_text"
  | "symbolic_text"
  | "timeline_text"
  | "interpretive_text";

export type Book1DensityLabel =
  | "history_dense"
  | "scene_dense"
  | "pov_dense"
  | "setting_dense"
  | "lineage_dense"
  | "interpretive_dense"
  | "mixed_dense";

export type Book1CanonStatus = "canon" | "candidate" | "optional" | "deprecated";

export type Book1ConfidenceType =
  | "historical"
  | "inferred_historical"
  | "narrative_design"
  | "interpretive"
  | "unresolved";

export type Book1NodeType =
  | "historical_claim"
  | "world_rule"
  | "tribe_trait"
  | "lineage_fact"
  | "character_definition"
  | "conflict_pattern"
  | "symbolic_motif"
  | "timeline_anchor"
  | "scene_seed"
  | "geographic_logic"
  | "social_system"
  | "ceremonial_system"
  | "material_culture_fact"
  | "scene_interpretation"
  | "setting_intelligence";

export type Book1EntityType =
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

export type Book1SceneComponentType =
  | "primary_pov"
  | "secondary_pov"
  | "environmental_layer"
  | "setting_layer"
  | "observer_layer"
  | "interpretive_layer"
  | "symbolic_layer";

export type Book1SourceRecord = {
  id: string;
  sourceKey: string | null;
  title: string;
  rawText: string;
  uploadSequence: number | null;
  chunkNumber: number | null;
  fileName: string | null;
  bookNumber: number;
  timeScopeStart: number | null;
  timeScopeEnd: number | null;
  sourceKind: string;
  dominantContentMode: string;
  secondaryModesJson: Prisma.JsonValue | null;
  densityLabel: string | null;
  processingStatus: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Book1KnowledgeNodeRecord = {
  id: string;
  sourceId: string;
  nodeKey: string | null;
  nodeType: string;
  title: string;
  canonicalStatement: string;
  summaryShort: string | null;
  summaryLong: string | null;
  canonStatus: string;
  confidenceType: string;
  confidenceScore: Prisma.Decimal | null;
  bookNumber: number;
  eraLabel: string | null;
  historicalScope: string | null;
  narrativeScope: string | null;
  activeStatus: string | null;
  timeTagsJson: Prisma.JsonValue | null;
  geographyTagsJson: Prisma.JsonValue | null;
  culturalTagsJson: Prisma.JsonValue | null;
  narrativeTagsJson: Prisma.JsonValue | null;
  functionalTagsJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Book1SceneAnchorRecord = {
  id: string;
  sceneNumber: number;
  sceneKey: string;
  title: string;
  eraLabel: string | null;
  functionInBook: string | null;
  summary: string | null;
  currentStatus: string;
  createdAt: Date;
  updatedAt: Date;
};
