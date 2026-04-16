-- Book 1 ingestion foundation schema.

CREATE TYPE "Book1SourceKind" AS ENUM (
  'UPLOADED_CHUNK',
  'RESEARCH_NOTE',
  'SYNTHESIS_NOTE',
  'SCENE_DRAFT',
  'CHARACTER_NOTE'
);

CREATE TYPE "Book1ContentMode" AS ENUM (
  'HISTORY',
  'LINEAGE',
  'WORLDBUILDING',
  'SCENE_TEXT',
  'POV_TEXT',
  'SETTING_TEXT',
  'SYMBOLIC_TEXT',
  'TIMELINE_TEXT',
  'INTERPRETIVE_TEXT'
);

CREATE TYPE "Book1NodeType" AS ENUM (
  'HISTORICAL_CLAIM',
  'WORLD_RULE',
  'TRIBE_TRAIT',
  'LINEAGE_FACT',
  'CHARACTER_DEFINITION',
  'CONFLICT_PATTERN',
  'SYMBOLIC_MOTIF',
  'TIMELINE_ANCHOR',
  'SCENE_SEED',
  'GEOGRAPHIC_LOGIC',
  'SOCIAL_SYSTEM',
  'CEREMONIAL_SYSTEM',
  'MATERIAL_CULTURE_FACT',
  'SCENE_INTERPRETATION',
  'SETTING_INTELLIGENCE'
);

CREATE TYPE "Book1CanonStatus" AS ENUM ('CANON', 'CANDIDATE', 'OPTIONAL', 'DEPRECATED');

CREATE TYPE "Book1ConfidenceType" AS ENUM (
  'HISTORICAL',
  'INFERRED_HISTORICAL',
  'NARRATIVE_DESIGN',
  'INTERPRETIVE',
  'UNRESOLVED'
);

CREATE TYPE "Book1EntityType" AS ENUM (
  'PERSON',
  'LINEAGE',
  'TRIBE',
  'SETTLEMENT',
  'RIVER',
  'ROUTE',
  'REGION',
  'OBJECT',
  'INSTITUTION',
  'CEREMONY',
  'SYSTEM',
  'THEME'
);

CREATE TYPE "Book1EntityRelationshipType" AS ENUM (
  'PARENT_OF',
  'CHILD_OF',
  'PART_OF',
  'ALLIED_WITH',
  'TRADES_WITH',
  'MOVES_THROUGH',
  'LIVES_IN',
  'SYMBOLIZES',
  'GOVERNS',
  'CONTRADICTS',
  'CONTRASTS_WITH',
  'INHERITS_FROM',
  'TEACHES',
  'STABILIZES',
  'PRESSURES',
  'MEDIATES_BETWEEN'
);

CREATE TYPE "Book1TimelineEventType" AS ENUM (
  'HISTORICAL_EVENT',
  'BOOK_ANCHOR',
  'LINEAGE_EVENT',
  'MIGRATION_EVENT',
  'DEATH_EVENT',
  'BIRTH_EVENT',
  'CONTACT_EVENT',
  'RUPTURE_EVENT',
  'SYSTEM_SHIFT'
);

CREATE TYPE "Book1TimelineAxis" AS ENUM ('HISTORICAL', 'STORY');

CREATE TYPE "Book1SceneAnchorStatus" AS ENUM ('STUB', 'PARTIAL', 'LAYERED', 'COMPLETE');

CREATE TYPE "Book1SceneComponentType" AS ENUM (
  'PRIMARY_POV',
  'SECONDARY_POV',
  'ENVIRONMENTAL_LAYER',
  'SETTING_LAYER',
  'OBSERVER_LAYER',
  'INTERPRETIVE_LAYER',
  'SYMBOLIC_LAYER'
);

CREATE TYPE "Book1LinkedObjectType" AS ENUM (
  'KNOWLEDGE_NODE',
  'ENTITY',
  'TIMELINE_EVENT',
  'SYMBOLIC_MOTIF'
);

CREATE TYPE "Book1RetrievalObjectType" AS ENUM (
  'KNOWLEDGE_NODE',
  'SCENE_COMPONENT',
  'ENTITY',
  'TIMELINE_EVENT',
  'WORLD_STATE_SNAPSHOT'
);

CREATE TABLE "sources" (
  "id" TEXT NOT NULL,
  "source_key" TEXT,
  "title" TEXT NOT NULL,
  "raw_text" TEXT NOT NULL,
  "upload_sequence" INTEGER,
  "chunk_number" INTEGER,
  "file_name" TEXT,
  "book_number" INTEGER NOT NULL DEFAULT 1,
  "time_scope_start" INTEGER,
  "time_scope_end" INTEGER,
  "source_kind" "Book1SourceKind" NOT NULL,
  "dominant_content_mode" "Book1ContentMode" NOT NULL,
  "secondary_modes_json" JSONB,
  "density_label" TEXT,
  "processing_status" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sources_source_key_key" ON "sources"("source_key");
CREATE INDEX "sources_book_number_idx" ON "sources"("book_number");
CREATE INDEX "sources_source_kind_idx" ON "sources"("source_kind");
CREATE INDEX "sources_dominant_content_mode_idx" ON "sources"("dominant_content_mode");
CREATE INDEX "sources_processing_status_idx" ON "sources"("processing_status");

CREATE TABLE "knowledge_nodes" (
  "id" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "node_key" TEXT,
  "node_type" "Book1NodeType" NOT NULL,
  "title" TEXT NOT NULL,
  "canonical_statement" TEXT NOT NULL,
  "summary_short" TEXT,
  "summary_long" TEXT,
  "canon_status" "Book1CanonStatus" NOT NULL DEFAULT 'CANDIDATE',
  "confidence_type" "Book1ConfidenceType" NOT NULL DEFAULT 'UNRESOLVED',
  "confidence_score" DECIMAL(5, 4),
  "book_number" INTEGER NOT NULL DEFAULT 1,
  "era_label" TEXT,
  "historical_scope" TEXT,
  "narrative_scope" TEXT,
  "active_status" TEXT,
  "time_tags_json" JSONB,
  "geography_tags_json" JSONB,
  "cultural_tags_json" JSONB,
  "narrative_tags_json" JSONB,
  "functional_tags_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_nodes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "knowledge_nodes_node_key_key" ON "knowledge_nodes"("node_key");
CREATE INDEX "knowledge_nodes_source_id_idx" ON "knowledge_nodes"("source_id");
CREATE INDEX "knowledge_nodes_node_type_idx" ON "knowledge_nodes"("node_type");
CREATE INDEX "knowledge_nodes_canon_status_idx" ON "knowledge_nodes"("canon_status");
CREATE INDEX "knowledge_nodes_book_number_idx" ON "knowledge_nodes"("book_number");

CREATE TABLE "entities" (
  "id" TEXT NOT NULL,
  "entity_key" TEXT,
  "entity_type" "Book1EntityType" NOT NULL,
  "display_name" TEXT NOT NULL,
  "normalized_name" TEXT NOT NULL,
  "alternate_names_json" JSONB,
  "description" TEXT,
  "historical_status" TEXT,
  "start_year" INTEGER,
  "end_year" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entities_entity_key_key" ON "entities"("entity_key");
CREATE UNIQUE INDEX "entities_normalized_name_key" ON "entities"("normalized_name");
CREATE INDEX "entities_entity_type_idx" ON "entities"("entity_type");
CREATE INDEX "entities_display_name_idx" ON "entities"("display_name");

CREATE TABLE "entity_relationships" (
  "id" TEXT NOT NULL,
  "from_entity_id" TEXT NOT NULL,
  "to_entity_id" TEXT NOT NULL,
  "relationship_type" "Book1EntityRelationshipType" NOT NULL,
  "description" TEXT,
  "source_node_id" TEXT,
  "start_year" INTEGER,
  "end_year" INTEGER,
  "confidence_score" DECIMAL(5, 4),
  "provenance_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "entity_relationships_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "entity_relationships_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "entity_relationships_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "entity_relationships_from_entity_id_idx" ON "entity_relationships"("from_entity_id");
CREATE INDEX "entity_relationships_to_entity_id_idx" ON "entity_relationships"("to_entity_id");
CREATE INDEX "entity_relationships_relationship_type_idx" ON "entity_relationships"("relationship_type");
CREATE INDEX "entity_relationships_source_node_id_idx" ON "entity_relationships"("source_node_id");

CREATE TABLE "timeline_events" (
  "id" TEXT NOT NULL,
  "event_key" TEXT,
  "title" TEXT NOT NULL,
  "event_type" "Book1TimelineEventType" NOT NULL,
  "date_start" TIMESTAMP(3),
  "date_end" TIMESTAMP(3),
  "year_label" TEXT,
  "description" TEXT,
  "historical_or_story" "Book1TimelineAxis" NOT NULL DEFAULT 'HISTORICAL',
  "certainty_level" TEXT,
  "source_node_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timeline_events_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "timeline_events_event_key_key" ON "timeline_events"("event_key");
CREATE INDEX "timeline_events_event_type_idx" ON "timeline_events"("event_type");
CREATE INDEX "timeline_events_date_start_idx" ON "timeline_events"("date_start");
CREATE INDEX "timeline_events_historical_or_story_idx" ON "timeline_events"("historical_or_story");
CREATE INDEX "timeline_events_source_node_id_idx" ON "timeline_events"("source_node_id");

CREATE TABLE "scene_anchors" (
  "id" TEXT NOT NULL,
  "scene_number" INTEGER NOT NULL,
  "scene_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "era_label" TEXT,
  "function_in_book" TEXT,
  "summary" TEXT,
  "current_status" "Book1SceneAnchorStatus" NOT NULL DEFAULT 'STUB',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scene_anchors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scene_anchors_scene_number_key" ON "scene_anchors"("scene_number");
CREATE UNIQUE INDEX "scene_anchors_scene_key_key" ON "scene_anchors"("scene_key");
CREATE INDEX "scene_anchors_current_status_idx" ON "scene_anchors"("current_status");

CREATE TABLE "scene_components" (
  "id" TEXT NOT NULL,
  "scene_anchor_id" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "component_key" TEXT,
  "component_type" "Book1SceneComponentType" NOT NULL,
  "component_subtype" TEXT,
  "pov_character" TEXT,
  "text_content" TEXT NOT NULL,
  "summary" TEXT,
  "function_in_scene" TEXT,
  "order_priority" INTEGER,
  "canon_status" "Book1CanonStatus" NOT NULL DEFAULT 'CANDIDATE',
  "confidence_type" "Book1ConfidenceType" NOT NULL DEFAULT 'UNRESOLVED',
  "time_tags_json" JSONB,
  "geography_tags_json" JSONB,
  "cultural_tags_json" JSONB,
  "narrative_tags_json" JSONB,
  "functional_tags_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scene_components_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scene_components_scene_anchor_id_fkey" FOREIGN KEY ("scene_anchor_id") REFERENCES "scene_anchors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "scene_components_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "scene_components_component_key_key" ON "scene_components"("component_key");
CREATE INDEX "scene_components_scene_anchor_id_idx" ON "scene_components"("scene_anchor_id");
CREATE INDEX "scene_components_source_id_idx" ON "scene_components"("source_id");
CREATE INDEX "scene_components_component_type_idx" ON "scene_components"("component_type");
CREATE INDEX "scene_components_canon_status_idx" ON "scene_components"("canon_status");

CREATE TABLE "scene_component_links" (
  "id" TEXT NOT NULL,
  "scene_component_id" TEXT NOT NULL,
  "linked_object_type" "Book1LinkedObjectType" NOT NULL,
  "linked_object_id" TEXT NOT NULL,
  "relationship_note" TEXT,
  CONSTRAINT "scene_component_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scene_component_links_scene_component_id_fkey" FOREIGN KEY ("scene_component_id") REFERENCES "scene_components"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "scene_component_links_scene_component_id_idx" ON "scene_component_links"("scene_component_id");
CREATE INDEX "scene_component_links_linked_object_idx" ON "scene_component_links"("linked_object_type", "linked_object_id");

CREATE TABLE "world_state_snapshots" (
  "id" TEXT NOT NULL,
  "snapshot_key" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "region" TEXT NOT NULL,
  "population_model_summary" TEXT,
  "trade_state_summary" TEXT,
  "kinship_state_summary" TEXT,
  "external_pressure_summary" TEXT,
  "narrative_summary" TEXT,
  "source_node_id" TEXT,
  CONSTRAINT "world_state_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "world_state_snapshots_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "world_state_snapshots_snapshot_key_key" ON "world_state_snapshots"("snapshot_key");
CREATE INDEX "world_state_snapshots_year_idx" ON "world_state_snapshots"("year");
CREATE INDEX "world_state_snapshots_region_idx" ON "world_state_snapshots"("region");
CREATE INDEX "world_state_snapshots_source_node_id_idx" ON "world_state_snapshots"("source_node_id");

CREATE TABLE "retrieval_profiles" (
  "id" TEXT NOT NULL,
  "object_type" "Book1RetrievalObjectType" NOT NULL,
  "object_id" TEXT NOT NULL,
  "embedding_text" TEXT NOT NULL,
  "retrieval_tags_json" JSONB,
  "use_cases_json" JSONB,
  "spoiler_level" TEXT,
  "priority_weight" DECIMAL(7, 4),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "retrieval_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retrieval_profiles_object_unique" ON "retrieval_profiles"("object_type", "object_id");
CREATE INDEX "retrieval_profiles_object_type_idx" ON "retrieval_profiles"("object_type");
CREATE INDEX "retrieval_profiles_priority_weight_idx" ON "retrieval_profiles"("priority_weight");
