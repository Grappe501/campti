import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { DeterministicBook1BriefMatcher } from "@/lib/services/book1-brief-matching-service";
import { FilesystemBook1CorpusProvider } from "@/lib/services/book1-bulk-ingestion-discovery";
import type {
  Book1BulkIngestionReport,
  Book1ChunkIngestionResult,
  Book1IngestionRange,
  Book1RawChunkFile,
  Book1SupportingBriefFile,
} from "@/lib/services/book1-bulk-ingestion-types";
import { mapModeToSourceDominant } from "@/lib/services/book1-bulk-ingestion-types";
import {
  DeterministicBook1ChunkClassifier,
  type Book1ChunkClassifier,
  type Book1ChunkClassificationResult,
} from "@/lib/services/book1-ingestion-scaffold";
import { PrismaBook1IngestionRepository, type Book1IngestionRepository } from "@/lib/services/book1-ingestion-persistence";
import { DeterministicBook1SegmentationPipeline } from "@/lib/services/book1-segmentation-service";
import {
  DeterministicBook1SegmentSchemaMapper,
  deriveEnrichmentHints,
} from "@/lib/services/book1-segment-schema-mapper";

export interface Book1CorpusProvider {
  discoverRawChunks(range: Book1IngestionRange): Promise<Book1RawChunkFile[]>;
  discoverSupportingBriefs(): Promise<Book1SupportingBriefFile[]>;
}

export type RunBook1BulkIngestionInput = {
  range: Book1IngestionRange;
  dryRun: boolean;
};

function hashKey(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

type PersistCounts = {
  knowledgeNodes: number;
  entities: number;
  relationships: number;
  sceneComponents: number;
  timelineEvents: number;
  retrievalProfiles: number;
};

type ChunkPhaseName =
  | "chunk_start"
  | "source_upsert_complete"
  | "mapping_complete"
  | "knowledge_nodes_persist_start"
  | "knowledge_nodes_persist_complete"
  | "entities_persist_start"
  | "entities_persist_complete"
  | "relationships_persist_start"
  | "relationships_persist_complete"
  | "timeline_events_persist_start"
  | "timeline_events_persist_complete"
  | "scene_components_persist_start"
  | "scene_components_persist_complete"
  | "retrieval_profiles_persist_start"
  | "retrieval_profiles_persist_complete"
  | "scene_layer_reconciliation_start"
  | "scene_layer_reconciliation_complete"
  | "chunk_complete";

type ChunkRuntimeRecord = {
  chunkNumber: number;
  chunkFileName: string;
  phase: ChunkPhaseName;
  startTimestamp: string;
  endTimestamp: string;
  durationMs: number;
};

class ChunkRuntimeLogger {
  constructor(
    private readonly chunkNumber: number,
    private readonly chunkFileName: string,
    private readonly reportPath: string,
  ) {}

  async mark(phase: ChunkPhaseName, startedAtMs: number, endedAtMs?: number): Promise<void> {
    const endMs = endedAtMs ?? startedAtMs;
    const record: ChunkRuntimeRecord = {
      chunkNumber: this.chunkNumber,
      chunkFileName: this.chunkFileName,
      phase,
      startTimestamp: new Date(startedAtMs).toISOString(),
      endTimestamp: new Date(endMs).toISOString(),
      durationMs: Math.max(0, endMs - startedAtMs),
    };
    await appendFile(this.reportPath, `${JSON.stringify(record)}\n`, "utf8");
    console.log(
      `[book1-runtime] chunk=${record.chunkNumber} phase=${record.phase} durationMs=${record.durationMs}`,
    );
  }
}

export class Book1BulkIngestionOrchestrator {
  private readonly matcher = new DeterministicBook1BriefMatcher();
  private readonly segmentation = new DeterministicBook1SegmentationPipeline();
  private readonly mapper = new DeterministicBook1SegmentSchemaMapper();

  constructor(
    private readonly dependencies: {
      corpusProvider?: Book1CorpusProvider;
      classifier?: Book1ChunkClassifier;
      repository?: Book1IngestionRepository;
    } = {},
  ) {}

  async run(input: RunBook1BulkIngestionInput): Promise<Book1BulkIngestionReport> {
    const corpusProvider = this.dependencies.corpusProvider ?? new FilesystemBook1CorpusProvider();
    const classifier = this.dependencies.classifier ?? new DeterministicBook1ChunkClassifier();
    const repository = this.dependencies.repository ?? new PrismaBook1IngestionRepository();

    const rawChunks = await corpusProvider.discoverRawChunks(input.range);
    const briefs = await corpusProvider.discoverSupportingBriefs();
    const results: Book1ChunkIngestionResult[] = [];
    const runtimeLogPath = path.join(process.cwd(), "reports", "book1-chunk-runtime-log.jsonl");
    await mkdir(path.dirname(runtimeLogPath), { recursive: true });

    for (const chunk of rawChunks) {
      const chunkLogger = input.dryRun ? null : new ChunkRuntimeLogger(chunk.chunkNumber, chunk.fileName, runtimeLogPath);
      const chunkStartMs = Date.now();
      if (chunkLogger) await chunkLogger.mark("chunk_start", chunkStartMs);
      const chunkMatch = this.matcher.matchChunkToBriefs(chunk, briefs);
      const classification = await classifier.classify({ sourceText: chunk.rawText });
      const sourceUpsertStartMs = Date.now();
      const sourceId = input.dryRun
        ? `dry-source-${chunk.chunkNumber}`
        : await repository.upsertSource({
            sourceKey: `book1-raw-chunk-${chunk.chunkNumber}`,
            title: `Book 1 raw chunk ${chunk.chunkNumber}`,
            rawText: chunk.rawText,
            chunkNumber: chunk.chunkNumber,
            uploadSequence: chunk.uploadSequence,
            fileName: chunk.fileName,
            sourceKind: "UPLOADED_CHUNK",
            dominantContentMode: mapModeToSourceDominant(classification.primary_mode),
            secondaryModesJson: classification.secondary_modes.map((mode) => mode.toUpperCase()),
            densityLabel: classification.density_label,
            notes: JSON.stringify({
              provenance: "raw_chunk_authoritative_source",
              matchedBriefs: chunkMatch.matchedBriefs.map((brief) => brief.brief.relativePath),
            }),
          });

      if (!input.dryRun) {
        for (const brief of chunkMatch.matchedBriefs) {
          await repository.upsertSource({
            sourceKey: `book1-brief-${hashKey(brief.brief.relativePath)}`,
            title: `Book 1 supporting brief ${brief.brief.fileName}`,
            rawText: brief.brief.rawText,
            chunkNumber: chunk.chunkNumber,
            uploadSequence: null,
            fileName: brief.brief.fileName,
            sourceKind: "SYNTHESIS_NOTE",
            dominantContentMode: "INTERPRETIVE_TEXT",
            secondaryModesJson: ["SCENE_TEXT"],
            densityLabel: "mixed_dense",
            notes: JSON.stringify({
              confidence: brief.confidence,
              confidenceLabel: brief.confidenceLabel,
              signals: brief.signals,
            }),
          });
        }
      }
      if (chunkLogger) await chunkLogger.mark("source_upsert_complete", sourceUpsertStartMs, Date.now());

      const mappingStartMs = Date.now();
      const segments = await this.segmentation.segment({ sourceId, sourceText: chunk.rawText });
      const hints = deriveEnrichmentHints({ chunkNumber: chunk.chunkNumber, matchedBriefs: chunkMatch.matchedBriefs });
      const mapped = this.mapper.map({
        rawChunk: chunk,
        matchedBriefs: chunkMatch.matchedBriefs,
        classification,
        segments,
        hints,
      });
      if (chunkLogger) await chunkLogger.mark("mapping_complete", mappingStartMs, Date.now());
      const persisted = input.dryRun
        ? this.estimatePersistCounts(mapped)
        : await this.persistMappedResult(repository, sourceId, mapped, chunkLogger);

      results.push({
        chunkFileName: chunk.fileName,
        chunkRelativePath: chunk.relativePath,
        matchedBriefFileNames: chunkMatch.matchedBriefs.map((match) => match.brief.fileName),
        classifierResult: classification,
        segmentCount: segments.length,
        knowledgeNodesCommitted: persisted.knowledgeNodes,
        entitiesCommitted: persisted.entities,
        relationshipsCommitted: persisted.relationships,
        sceneComponentsCommitted: persisted.sceneComponents,
        timelineEventsCommitted: persisted.timelineEvents,
        retrievalProfilesCommitted: persisted.retrievalProfiles,
        detectedSceneAnchors: mapped.detectedSceneAnchors,
        ambiguousLayerAssignments: mapped.ambiguousLayerAssignments,
        rejectedLineageCandidates: mapped.rejectedLineageCandidates,
        downgradedSceneLayerAssignments: mapped.downgradedSceneLayerAssignments,
        boundaryEnforcementActions: mapped.boundaryEnforcementActions,
        warnings: mapped.warnings,
        manualReviewQueue: mapped.manualReviewQueue,
      });
      if (chunkLogger) await chunkLogger.mark("chunk_complete", chunkStartMs, Date.now());
    }

    return {
      generatedAt: new Date().toISOString(),
      dryRun: input.dryRun,
      range: input.range,
      results,
      summary: {
        totalChunksScanned: rawChunks.length,
        totalChunksIngested: results.length,
        chunksWithNoBriefs: results.filter((row) => row.matchedBriefFileNames.length === 0).length,
        chunksWithSceneMaterial: results.filter((row) => this.hasSceneMaterial(row.classifierResult)).length,
        chunksWithLineageMaterial: results.filter((row) => this.hasLineageMaterial(row.classifierResult)).length,
        chunksNeedingManualReview: results.filter(
          (row) => row.manualReviewQueue.length > 0 || row.ambiguousLayerAssignments.length > 0,
        ).length,
        totalRejectedLineageCandidates: results.reduce(
          (sum, row) => sum + row.rejectedLineageCandidates.length,
          0,
        ),
        totalDowngradedSceneLayerAssignments: results.reduce(
          (sum, row) => sum + row.downgradedSceneLayerAssignments.length,
          0,
        ),
        totalBoundaryEnforcementActions: results.reduce((sum, row) => sum + row.boundaryEnforcementActions.length, 0),
      },
    };
  }

  private hasSceneMaterial(result: Book1ChunkClassificationResult): boolean {
    return result.primary_mode === "scene_text" || result.secondary_modes.includes("scene_text");
  }

  private hasLineageMaterial(result: Book1ChunkClassificationResult): boolean {
    return result.primary_mode === "lineage" || result.secondary_modes.includes("lineage");
  }

  private estimatePersistCounts(mapped: ReturnType<DeterministicBook1SegmentSchemaMapper["map"]>): PersistCounts {
    const committableNodeKeys = new Set(mapped.knowledgeNodes.filter((node) => node.confidenceBand !== "low").map((node) => node.nodeKey));
    const committableEntityKeys = new Set(mapped.entities.filter((entity) => entity.confidenceBand !== "low").map((entity) => entity.entityKey));
    const committableEventKeys = new Set(mapped.timelineEvents.filter((event) => event.confidenceBand !== "low").map((event) => event.eventKey));
    const committableSceneKeys = new Set(
      mapped.sceneComponents.filter((component) => component.confidenceBand !== "low").map((component) => component.componentKey),
    );
    const retrievalProfiles = mapped.retrievalProfiles.filter((profile) => {
      if (profile.objectType === "knowledge_node") return committableNodeKeys.has(profile.objectStableKey);
      if (profile.objectType === "entity") return committableEntityKeys.has(profile.objectStableKey);
      if (profile.objectType === "timeline_event") return committableEventKeys.has(profile.objectStableKey);
      if (profile.objectType === "scene_component") return committableSceneKeys.has(profile.objectStableKey);
      return false;
    }).length;

    return {
      knowledgeNodes: committableNodeKeys.size,
      entities: committableEntityKeys.size,
      relationships: mapped.relationships.filter((relationship) => relationship.confidenceBand !== "low").length,
      sceneComponents: committableSceneKeys.size,
      timelineEvents: committableEventKeys.size,
      retrievalProfiles,
    };
  }

  private async persistMappedResult(
    repository: Book1IngestionRepository,
    sourceId: string,
    mapped: ReturnType<DeterministicBook1SegmentSchemaMapper["map"]>,
    chunkLogger: ChunkRuntimeLogger | null,
  ): Promise<PersistCounts> {
    const knowledgeStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("knowledge_nodes_persist_start", knowledgeStart);
    const knowledgeNodeIdByKey: Record<string, string> = {};
    const persistedKnowledgeNodeKeys = new Set<string>();
    const committableKnowledgeNodes = mapped.knowledgeNodes.filter((node) => node.confidenceBand !== "low");
    for (const node of committableKnowledgeNodes) {
      const nodeId = await repository.upsertKnowledgeNode(sourceId, node);
      if (!nodeId) continue;
      knowledgeNodeIdByKey[node.nodeKey] = nodeId;
      persistedKnowledgeNodeKeys.add(node.nodeKey);
    }
    if (chunkLogger) await chunkLogger.mark("knowledge_nodes_persist_complete", knowledgeStart, Date.now());

    const entitiesStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("entities_persist_start", entitiesStart);
    const entityIdByNormalizedName: Record<string, string> = {};
    const entityIdByKey: Record<string, string> = {};
    const committableEntities = mapped.entities.filter((entity) => entity.confidenceBand !== "low");
    for (const entity of committableEntities) {
      const entityId = await repository.upsertEntity(entity);
      entityIdByNormalizedName[entity.normalizedName] = entityId;
      entityIdByKey[entity.entityKey] = entityId;
    }
    if (chunkLogger) await chunkLogger.mark("entities_persist_complete", entitiesStart, Date.now());

    const relationshipsStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("relationships_persist_start", relationshipsStart);
    let relationshipCount = 0;
    const firstPersistedNode = committableKnowledgeNodes.find((node) => Boolean(knowledgeNodeIdByKey[node.nodeKey]));
    const fallbackNodeId = firstPersistedNode ? knowledgeNodeIdByKey[firstPersistedNode.nodeKey] : null;
    for (const relationship of mapped.relationships.filter((item) => item.confidenceBand !== "low")) {
      const relationshipId = await repository.upsertEntityRelationship(relationship, fallbackNodeId, entityIdByNormalizedName);
      if (relationshipId) relationshipCount += 1;
    }
    if (chunkLogger) await chunkLogger.mark("relationships_persist_complete", relationshipsStart, Date.now());

    const timelineStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("timeline_events_persist_start", timelineStart);
    const timelineIdByKey: Record<string, string> = {};
    const committableTimeline = mapped.timelineEvents.filter((event) => event.confidenceBand !== "low");
    for (const event of committableTimeline) {
      const eventId = await repository.upsertTimelineEvent(fallbackNodeId, event);
      timelineIdByKey[event.eventKey] = eventId;
    }
    if (chunkLogger) await chunkLogger.mark("timeline_events_persist_complete", timelineStart, Date.now());

    const sceneStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("scene_components_persist_start", sceneStart);
    const sceneComponentIdByKey: Record<string, string> = {};
    const committableSceneComponents = mapped.sceneComponents.filter((component) => component.confidenceBand !== "low");
    const persistedSceneComponents = await repository.upsertSceneComponentsBulk(sourceId, committableSceneComponents);
    for (const [componentKey, sceneComponentId] of Object.entries(persistedSceneComponents)) {
      sceneComponentIdByKey[componentKey] = sceneComponentId;
    }
    if (chunkLogger) await chunkLogger.mark("scene_components_persist_complete", sceneStart, Date.now());

    const reconcileStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("scene_layer_reconciliation_start", reconcileStart);
    await repository.reconcileSceneLayerPreferences(sourceId);
    if (chunkLogger) await chunkLogger.mark("scene_layer_reconciliation_complete", reconcileStart, Date.now());

    const retrievalStart = Date.now();
    if (chunkLogger) await chunkLogger.mark("retrieval_profiles_persist_start", retrievalStart);
    const retrievalEntries: Array<{ objectId: string; input: (typeof mapped.retrievalProfiles)[number] }> = [];
    for (const profile of mapped.retrievalProfiles) {
      const objectId =
        knowledgeNodeIdByKey[profile.objectStableKey] ??
        entityIdByKey[profile.objectStableKey] ??
        timelineIdByKey[profile.objectStableKey] ??
        sceneComponentIdByKey[profile.objectStableKey];
      if (!objectId) continue;
      retrievalEntries.push({ objectId, input: profile });
    }
    const retrievalProfiles = await repository.upsertRetrievalProfilesBulk(retrievalEntries);
    if (chunkLogger) await chunkLogger.mark("retrieval_profiles_persist_complete", retrievalStart, Date.now());

    return {
      knowledgeNodes: persistedKnowledgeNodeKeys.size,
      entities: committableEntities.length,
      relationships: relationshipCount,
      sceneComponents: committableSceneComponents.length,
      timelineEvents: committableTimeline.length,
      retrievalProfiles,
    };
  }
}
