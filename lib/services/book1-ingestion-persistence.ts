import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";
import {
  Book1CanonStatus,
  Book1ConfidenceType,
  Book1ContentMode,
  Book1EntityRelationshipType,
  Book1EntityType,
  Book1NodeType,
  Book1RetrievalObjectType,
  Book1SceneAnchorStatus,
  Book1SceneComponentType,
  Book1SourceKind,
  Book1TimelineAxis,
  Book1TimelineEventType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeSceneLayerResolution } from "@/lib/services/book1-scene-layer-resolution-service";
import type {
  Book1EntityInput,
  Book1EntityRelationshipInput,
  Book1KnowledgeNodeInput,
  Book1RetrievalProfileInput,
  Book1SceneComponentInput,
  Book1TimelineEventInput,
} from "@/lib/services/book1-bulk-ingestion-types";

type UpsertSourceInput = {
  sourceKey: string;
  title: string;
  rawText: string;
  chunkNumber: number | null;
  uploadSequence: number | null;
  fileName: string;
  sourceKind: "UPLOADED_CHUNK" | "SYNTHESIS_NOTE";
  dominantContentMode: string;
  secondaryModesJson: string[];
  densityLabel: string;
  notes: string | null;
};

function relationHash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

function toSourceKind(value: UpsertSourceInput["sourceKind"]): Book1SourceKind {
  return value;
}

function toContentMode(value: string): Book1ContentMode {
  const map: Record<string, Book1ContentMode> = {
    HISTORY: Book1ContentMode.HISTORY,
    LINEAGE: Book1ContentMode.LINEAGE,
    WORLDBUILDING: Book1ContentMode.WORLDBUILDING,
    SCENE_TEXT: Book1ContentMode.SCENE_TEXT,
    POV_TEXT: Book1ContentMode.POV_TEXT,
    SETTING_TEXT: Book1ContentMode.SETTING_TEXT,
    SYMBOLIC_TEXT: Book1ContentMode.SYMBOLIC_TEXT,
    TIMELINE_TEXT: Book1ContentMode.TIMELINE_TEXT,
    INTERPRETIVE_TEXT: Book1ContentMode.INTERPRETIVE_TEXT,
  };
  const resolved = map[value.toUpperCase()];
  if (!resolved) throw new Error(`Unknown Book1ContentMode value: ${value}`);
  return resolved;
}

function toNodeType(value: string): Book1NodeType {
  const key = value.toUpperCase() as keyof typeof Book1NodeType;
  const resolved = Book1NodeType[key];
  if (!resolved) throw new Error(`Unknown Book1NodeType value: ${value}`);
  return resolved;
}

function toCanonStatus(value: string): Book1CanonStatus {
  const key = value.toUpperCase() as keyof typeof Book1CanonStatus;
  const resolved = Book1CanonStatus[key];
  if (!resolved) throw new Error(`Unknown Book1CanonStatus value: ${value}`);
  return resolved;
}

function toConfidenceType(value: string): Book1ConfidenceType {
  const key = value.toUpperCase() as keyof typeof Book1ConfidenceType;
  const resolved = Book1ConfidenceType[key];
  if (!resolved) throw new Error(`Unknown Book1ConfidenceType value: ${value}`);
  return resolved;
}

function toEntityType(value: string): Book1EntityType {
  const key = value.toUpperCase() as keyof typeof Book1EntityType;
  const resolved = Book1EntityType[key];
  if (!resolved) throw new Error(`Unknown Book1EntityType value: ${value}`);
  return resolved;
}

function toEntityRelationshipType(value: string): Book1EntityRelationshipType {
  const key = value.toUpperCase() as keyof typeof Book1EntityRelationshipType;
  const resolved = Book1EntityRelationshipType[key];
  if (!resolved) throw new Error(`Unknown Book1EntityRelationshipType value: ${value}`);
  return resolved;
}

function toTimelineEventType(value: string): Book1TimelineEventType {
  const key = value.toUpperCase() as keyof typeof Book1TimelineEventType;
  const resolved = Book1TimelineEventType[key];
  if (!resolved) throw new Error(`Unknown Book1TimelineEventType value: ${value}`);
  return resolved;
}

function toTimelineAxis(value: string): Book1TimelineAxis {
  const key = value.toUpperCase() as keyof typeof Book1TimelineAxis;
  const resolved = Book1TimelineAxis[key];
  if (!resolved) throw new Error(`Unknown Book1TimelineAxis value: ${value}`);
  return resolved;
}

function toSceneComponentType(value: string): Book1SceneComponentType {
  const key = value.toUpperCase() as keyof typeof Book1SceneComponentType;
  const resolved = Book1SceneComponentType[key];
  if (!resolved) throw new Error(`Unknown Book1SceneComponentType value: ${value}`);
  return resolved;
}

function toRetrievalObjectType(value: string): Book1RetrievalObjectType {
  const key = value.toUpperCase() as keyof typeof Book1RetrievalObjectType;
  const resolved = Book1RetrievalObjectType[key];
  if (!resolved) throw new Error(`Unknown Book1RetrievalObjectType value: ${value}`);
  return resolved;
}

export interface Book1IngestionRepository {
  upsertSource(input: UpsertSourceInput): Promise<string>;
  upsertKnowledgeNode(sourceId: string, input: Book1KnowledgeNodeInput): Promise<string | null>;
  upsertEntity(input: Book1EntityInput): Promise<string>;
  upsertEntityRelationship(
    relationship: Book1EntityRelationshipInput,
    sourceNodeId: string | null,
    entityIdByNormalizedName: Record<string, string>,
  ): Promise<string | null>;
  upsertTimelineEvent(sourceNodeId: string | null, event: Book1TimelineEventInput): Promise<string>;
  upsertSceneComponent(sourceId: string, input: Book1SceneComponentInput): Promise<string>;
  upsertSceneComponentsBulk(
    sourceId: string,
    inputs: Book1SceneComponentInput[],
  ): Promise<Record<string, string>>;
  reconcileSceneLayerPreferences(sourceId: string): Promise<void>;
  upsertRetrievalProfile(objectId: string, input: Book1RetrievalProfileInput): Promise<string>;
  upsertRetrievalProfilesBulk(
    entries: Array<{ objectId: string; input: Book1RetrievalProfileInput }>,
  ): Promise<number>;
}

type SanitizedKnowledgeNodeInput = {
  nodeKey: string;
  title: string;
  canonicalStatement: string;
  summaryShort: string | null;
  summaryLong: string | null;
};

function normalizeControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
}

function neutralizeMalformedEscapes(value: string): string {
  let next = value;
  // Keep intended meaning while preventing malformed parser escape branches.
  next = next.replace(/\\x(?![0-9A-Fa-f]{2})/g, "\\\\x");
  next = next.replace(/\\u(?![0-9A-Fa-f]{4})/g, "\\\\u");
  next = next.replace(/\\U(?![0-9A-Fa-f]{8})/g, "\\\\U");
  next = next.replace(/\\$/g, "\\\\");
  return next;
}

function replaceInvalidSurrogates(value: string): string {
  return value.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    "\uFFFD",
  );
}

function sanitizeNodeString(input: string): string {
  return replaceInvalidSurrogates(neutralizeMalformedEscapes(normalizeControlCharacters(input))).normalize("NFC");
}

function sanitizeKnowledgeNodeInput(input: Book1KnowledgeNodeInput): SanitizedKnowledgeNodeInput {
  return {
    nodeKey: sanitizeNodeString(input.nodeKey),
    title: sanitizeNodeString(input.title),
    canonicalStatement: sanitizeNodeString(input.canonicalStatement),
    summaryShort: input.summaryShort ? sanitizeNodeString(input.summaryShort) : null,
    summaryLong: input.summaryLong ? sanitizeNodeString(input.summaryLong) : null,
  };
}

function preview(value: string | null, max = 220): string | null {
  if (value === null) return null;
  const oneLine = value.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}...`;
}

async function writeKnowledgeNodeErrorReport(input: {
  sourceId: string;
  payload: Book1KnowledgeNodeInput;
  sanitized: SanitizedKnowledgeNodeInput;
  error: unknown;
}): Promise<string> {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "book1-knowledge-node-persistence-errors.jsonl");
  const message = input.error instanceof Error ? input.error.message : String(input.error);

  const record = {
    timestamp: new Date().toISOString(),
    sourceId: input.sourceId,
    rawChunkPath: input.payload.provenance.rawChunkPath,
    rawChunkFileName: input.payload.provenance.rawChunkFileName,
    segmentKey: input.payload.provenance.segmentKey ?? null,
    nodeKey: input.payload.nodeKey,
    candidateTitle: input.payload.title,
    fields: {
      nodeKey: {
        originalPreview: preview(input.payload.nodeKey),
        sanitizedPreview: preview(input.sanitized.nodeKey),
      },
      title: {
        originalPreview: preview(input.payload.title),
        sanitizedPreview: preview(input.sanitized.title),
      },
      canonicalStatement: {
        originalPreview: preview(input.payload.canonicalStatement),
        sanitizedPreview: preview(input.sanitized.canonicalStatement),
      },
      summaryShort: {
        originalPreview: preview(input.payload.summaryShort ?? null),
        sanitizedPreview: preview(input.sanitized.summaryShort),
      },
      summaryLong: {
        originalPreview: preview(input.payload.summaryLong ?? null),
        sanitizedPreview: preview(input.sanitized.summaryLong),
      },
    },
    errorMessage: message,
  };

  await appendFile(reportPath, `${JSON.stringify(record)}\n`, "utf8");
  return reportPath;
}

type RetryDiagnosticsContext = {
  sourceId?: string | null;
  nodeKey?: string | null;
  componentKey?: string | null;
  sceneAnchorNumber?: number | null;
  rawChunkPath?: string | null;
  segmentKey?: string | null;
  chunkRange?: string | null;
};

const BOOK1_CANONICAL_SCENE_MIN = 1;
const BOOK1_CANONICAL_SCENE_MAX = 17;

function chunkArray<T>(input: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

function isTransientDbError(error: unknown): boolean {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  if (code === "P1017" || code === "P1001") return true;
  return /connection\s*(closed|reset|timed?\s*out)|forcibly closed|ECONNRESET|ETIMEDOUT|timeout|P1017/i.test(message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendRetryDiagnostic(input: {
  operation: string;
  attempt: number;
  maxAttempts: number;
  outcome: "retrying" | "success" | "exhausted";
  context: RetryDiagnosticsContext;
  error?: unknown;
}): Promise<void> {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "book1-transient-db-retries.jsonl");
  const message = input.error ? (input.error instanceof Error ? input.error.message : String(input.error)) : null;
  await appendFile(
    reportPath,
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      operation: input.operation,
      attempt: input.attempt,
      maxAttempts: input.maxAttempts,
      outcome: input.outcome,
      context: input.context,
      errorMessage: message,
    })}\n`,
    "utf8",
  );
}

async function retryTransientDbOperation<T>(input: {
  operation: string;
  context: RetryDiagnosticsContext;
  run: () => Promise<T>;
  maxAttempts?: number;
}): Promise<T> {
  const maxAttempts = input.maxAttempts ?? 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await input.run();
      if (attempt > 1) {
        await appendRetryDiagnostic({
          operation: input.operation,
          attempt,
          maxAttempts,
          outcome: "success",
          context: input.context,
        });
      }
      return result;
    } catch (error) {
      const transient = isTransientDbError(error);
      if (!transient || attempt >= maxAttempts) {
        if (transient) {
          await appendRetryDiagnostic({
            operation: input.operation,
            attempt,
            maxAttempts,
            outcome: "exhausted",
            context: input.context,
            error,
          });
        }
        throw error;
      }
      await appendRetryDiagnostic({
        operation: input.operation,
        attempt,
        maxAttempts,
        outcome: "retrying",
        context: input.context,
        error,
      });
      const delayMs = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 120);
      console.error(
        `[book1-retry] ${input.operation} attempt ${attempt}/${maxAttempts} failed transiently; retrying in ${delayMs}ms`,
      );
      await wait(delayMs);
    }
  }
  throw new Error(`unreachable retry state for operation ${input.operation}`);
}

async function logOutOfScopeSceneAnchor(input: {
  sourceId: string;
  sceneAnchorNumber: number;
  componentKey: string;
  provenance: unknown;
}): Promise<void> {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "book1-out-of-scope-scene-anchor-warnings.jsonl");
  await appendFile(
    reportPath,
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      sourceId: input.sourceId,
      sceneAnchorNumber: input.sceneAnchorNumber,
      componentKey: input.componentKey,
      provenance: input.provenance,
      message: `Scene anchor out of canonical range ${BOOK1_CANONICAL_SCENE_MIN}-${BOOK1_CANONICAL_SCENE_MAX}; component skipped.`,
    })}\n`,
    "utf8",
  );
  console.error(
    `[book1-scene-guard] skipped out-of-scope scene anchor ${input.sceneAnchorNumber} for component ${input.componentKey}; report=${reportPath}`,
  );
}

export class PrismaBook1IngestionRepository implements Book1IngestionRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async upsertSource(input: UpsertSourceInput): Promise<string> {
    const row = await retryTransientDbOperation({
      operation: "upsertSource",
      context: {
        sourceId: input.sourceKey,
      },
      run: () =>
        this.db.book1Source.upsert({
          where: { sourceKey: input.sourceKey },
          create: {
            sourceKey: input.sourceKey,
            title: input.title,
            rawText: input.rawText,
            uploadSequence: input.uploadSequence,
            chunkNumber: input.chunkNumber,
            fileName: input.fileName,
            bookNumber: 1,
            sourceKind: toSourceKind(input.sourceKind),
            dominantContentMode: toContentMode(input.dominantContentMode),
            secondaryModesJson: input.secondaryModesJson,
            densityLabel: input.densityLabel,
            processingStatus: "ingested_bulk_script03",
            notes: input.notes,
          },
          update: {
            title: input.title,
            rawText: input.rawText,
            uploadSequence: input.uploadSequence,
            chunkNumber: input.chunkNumber,
            fileName: input.fileName,
            sourceKind: toSourceKind(input.sourceKind),
            dominantContentMode: toContentMode(input.dominantContentMode),
            secondaryModesJson: input.secondaryModesJson,
            densityLabel: input.densityLabel,
            processingStatus: "ingested_bulk_script03",
            notes: input.notes,
          },
          select: { id: true },
        }),
    });
    return row.id;
  }

  async upsertKnowledgeNode(sourceId: string, input: Book1KnowledgeNodeInput): Promise<string | null> {
    const sanitized = sanitizeKnowledgeNodeInput(input);
    try {
      const row = await retryTransientDbOperation({
        operation: "upsertKnowledgeNode",
        context: {
          sourceId,
          nodeKey: input.nodeKey,
          rawChunkPath: input.provenance.rawChunkPath,
          segmentKey: input.provenance.segmentKey ?? null,
        },
        run: () =>
          this.db.book1KnowledgeNode.upsert({
            where: { nodeKey: sanitized.nodeKey },
            create: {
              sourceId,
              nodeKey: sanitized.nodeKey,
              nodeType: toNodeType(input.nodeType),
              title: sanitized.title,
              canonicalStatement: sanitized.canonicalStatement,
              summaryShort: sanitized.summaryShort,
              summaryLong: sanitized.summaryLong,
              canonStatus: toCanonStatus(input.canonStatus),
              confidenceType: toConfidenceType(input.confidenceType),
              confidenceScore: input.confidenceScore,
              bookNumber: 1,
              narrativeTagsJson: input.narrativeTags,
              functionalTagsJson: input.provenance,
            },
            update: {
              canonicalStatement: sanitized.canonicalStatement,
              summaryShort: sanitized.summaryShort,
              summaryLong: sanitized.summaryLong,
              canonStatus: toCanonStatus(input.canonStatus),
              confidenceType: toConfidenceType(input.confidenceType),
              confidenceScore: input.confidenceScore,
              narrativeTagsJson: input.narrativeTags,
              functionalTagsJson: input.provenance,
            },
            select: { id: true },
          }),
      });
      return row.id;
    } catch (error) {
      const reportPath = await writeKnowledgeNodeErrorReport({
        sourceId,
        payload: input,
        sanitized,
        error,
      });
      console.error(
        `[book1-knowledge-node] write failed; continuing with manual review. nodeKey=${input.nodeKey} source=${sourceId} segment=${input.provenance.segmentKey ?? "n/a"} report=${reportPath}`,
      );
      return null;
    }
  }

  async upsertEntity(input: Book1EntityInput): Promise<string> {
    const row = await this.db.book1Entity.upsert({
      where: { normalizedName: input.normalizedName },
      create: {
        entityKey: input.entityKey,
        entityType: toEntityType(input.entityType),
        displayName: input.displayName,
        normalizedName: input.normalizedName,
        description: input.description,
        notes: JSON.stringify(input.provenance),
      },
      update: {
        displayName: input.displayName,
        description: input.description,
        notes: JSON.stringify(input.provenance),
      },
      select: { id: true },
    });
    return row.id;
  }

  async upsertEntityRelationship(
    relationship: Book1EntityRelationshipInput,
    sourceNodeId: string | null,
    entityIdByNormalizedName: Record<string, string>,
  ): Promise<string | null> {
    const fromEntityId = entityIdByNormalizedName[relationship.fromNormalizedName];
    const toEntityId = entityIdByNormalizedName[relationship.toNormalizedName];
    if (!fromEntityId || !toEntityId) return null;

    const stableId = `book1-rel-${relationHash(
      `${fromEntityId}|${toEntityId}|${relationship.relationshipType}|${sourceNodeId ?? "none"}`,
    )}`;
    const row = await this.db.book1EntityRelationship.upsert({
      where: { id: stableId },
      create: {
        id: stableId,
        fromEntityId,
        toEntityId,
        relationshipType: toEntityRelationshipType(relationship.relationshipType),
        description: relationship.description,
        sourceNodeId,
        provenanceJson: relationship.provenance,
      },
      update: {
        description: relationship.description,
        sourceNodeId,
        provenanceJson: relationship.provenance,
      },
      select: { id: true },
    });
    return row.id;
  }

  async upsertTimelineEvent(sourceNodeId: string | null, event: Book1TimelineEventInput): Promise<string> {
    const row = await this.db.book1TimelineEvent.upsert({
      where: { eventKey: event.eventKey },
      create: {
        eventKey: event.eventKey,
        title: event.title,
        eventType: toTimelineEventType(event.eventType),
        dateStart: event.dateStart,
        yearLabel: event.yearLabel,
        description: event.description,
        historicalOrStory: toTimelineAxis(event.historicalOrStory),
        certaintyLevel: toConfidenceType(event.confidenceType),
        sourceNodeId,
      },
      update: {
        title: event.title,
        description: event.description,
        yearLabel: event.yearLabel,
        dateStart: event.dateStart,
        certaintyLevel: toConfidenceType(event.confidenceType),
        sourceNodeId,
      },
      select: { id: true },
    });
    return row.id;
  }

  async upsertSceneComponent(sourceId: string, input: Book1SceneComponentInput): Promise<string> {
    const result = await this.upsertSceneComponentsBulk(sourceId, [input]);
    const id = result[input.componentKey];
    if (!id) throw new Error(`Failed to persist scene component ${input.componentKey}`);
    return id;
  }

  async upsertSceneComponentsBulk(
    sourceId: string,
    inputs: Book1SceneComponentInput[],
  ): Promise<Record<string, string>> {
    const allowedInputs: Book1SceneComponentInput[] = [];
    for (const input of inputs) {
      if (
        input.sceneAnchorNumber < BOOK1_CANONICAL_SCENE_MIN ||
        input.sceneAnchorNumber > BOOK1_CANONICAL_SCENE_MAX
      ) {
        await logOutOfScopeSceneAnchor({
          sourceId,
          sceneAnchorNumber: input.sceneAnchorNumber,
          componentKey: input.componentKey,
          provenance: input.provenance,
        });
        continue;
      }
      allowedInputs.push(input);
    }
    if (allowedInputs.length === 0) return {};

    const sceneNumbers = [...new Set(allowedInputs.map((input) => input.sceneAnchorNumber))];
    const existingAnchors = await retryTransientDbOperation({
      operation: "prefetchSceneAnchors",
      context: { sourceId },
      run: () =>
        this.db.book1SceneAnchor.findMany({
          where: { sceneNumber: { in: sceneNumbers } },
          select: { id: true, sceneNumber: true },
        }),
    });
    const existingByNumber = new Map(existingAnchors.map((row) => [row.sceneNumber, row.id]));
    const missingNumbers = sceneNumbers.filter((sceneNumber) => !existingByNumber.has(sceneNumber));
    if (missingNumbers.length > 0) {
      await retryTransientDbOperation({
        operation: "createMissingSceneAnchors",
        context: { sourceId },
        run: () =>
          this.db.book1SceneAnchor.createMany({
            data: missingNumbers.map((sceneNumber) => ({
              sceneNumber,
              sceneKey: `book1-scene-${sceneNumber}`,
              title: `Book 1 Scene ${sceneNumber}`,
              currentStatus: Book1SceneAnchorStatus.STUB,
            })),
            skipDuplicates: true,
          }),
      });
      const allAnchors = await retryTransientDbOperation({
        operation: "reloadSceneAnchors",
        context: { sourceId },
        run: () =>
          this.db.book1SceneAnchor.findMany({
            where: { sceneNumber: { in: sceneNumbers } },
            select: { id: true, sceneNumber: true },
          }),
      });
      for (const anchor of allAnchors) {
        existingByNumber.set(anchor.sceneNumber, anchor.id);
      }
    }

    const componentKeys = allowedInputs.map((input) => input.componentKey);
    const existingComponents = await retryTransientDbOperation({
      operation: "prefetchSceneComponentsByKey",
      context: { sourceId },
      run: () =>
        this.db.book1SceneComponent.findMany({
          where: { componentKey: { in: componentKeys } },
          select: { id: true, componentKey: true },
        }),
    });
    const existingComponentIdsByKey = new Map(
      existingComponents.filter((row) => row.componentKey).map((row) => [row.componentKey as string, row.id]),
    );

    type Book1SceneComponentCreateMany = NonNullable<Parameters<PrismaClient["book1SceneComponent"]["createMany"]>[0]>;
    const creates: Book1SceneComponentCreateMany["data"] = [];
    const updates: Array<{ id: string; input: Book1SceneComponentInput }> = [];
    for (const input of allowedInputs) {
      const sceneAnchorId = existingByNumber.get(input.sceneAnchorNumber);
      if (!sceneAnchorId) {
        await logOutOfScopeSceneAnchor({
          sourceId,
          sceneAnchorNumber: input.sceneAnchorNumber,
          componentKey: input.componentKey,
          provenance: input.provenance,
        });
        continue;
      }
      const existingId = existingComponentIdsByKey.get(input.componentKey);
      if (existingId) {
        updates.push({ id: existingId, input });
      } else {
        creates.push({
          sceneAnchorId,
          sourceId,
          componentKey: input.componentKey,
          componentType: toSceneComponentType(input.componentType),
          componentSubtype: input.componentSubtype,
          textContent: input.textContent,
          summary: input.summary,
          functionInScene: input.functionInScene,
          canonStatus: toCanonStatus(input.canonStatus),
          confidenceType: toConfidenceType(input.confidenceType),
          narrativeTagsJson: [`scene_${input.sceneAnchorNumber}`, ...input.reviewWarnings],
          functionalTagsJson: input.provenance,
        });
      }
    }

    if (creates.length > 0) {
      await retryTransientDbOperation({
        operation: "createSceneComponentsMany",
        context: { sourceId },
        run: () => this.db.book1SceneComponent.createMany({ data: creates, skipDuplicates: true }),
      });
    }

    for (const updateChunk of chunkArray(updates, 80)) {
      await retryTransientDbOperation({
        operation: "updateSceneComponentsChunk",
        context: { sourceId },
        run: () =>
          this.db.$transaction(
            updateChunk.map(({ id, input }) =>
              this.db.book1SceneComponent.update({
                where: { id },
                data: {
                  sceneAnchorId: existingByNumber.get(input.sceneAnchorNumber),
                  sourceId,
                  componentType: toSceneComponentType(input.componentType),
                  componentSubtype: input.componentSubtype,
                  textContent: input.textContent,
                  summary: input.summary,
                  functionInScene: input.functionInScene,
                  canonStatus: toCanonStatus(input.canonStatus),
                  confidenceType: toConfidenceType(input.confidenceType),
                  narrativeTagsJson: [`scene_${input.sceneAnchorNumber}`, ...input.reviewWarnings],
                  functionalTagsJson: input.provenance,
                },
              }),
            ),
          ),
      });
    }

    const persisted = await retryTransientDbOperation({
      operation: "fetchPersistedSceneComponents",
      context: { sourceId },
      run: () =>
        this.db.book1SceneComponent.findMany({
          where: { componentKey: { in: componentKeys } },
          select: { id: true, componentKey: true },
        }),
    });
    const idByKey: Record<string, string> = {};
    for (const row of persisted) {
      if (row.componentKey) idByKey[row.componentKey] = row.id;
    }
    return idByKey;
  }

  async reconcileSceneLayerPreferences(sourceId: string): Promise<void> {
    const scopedLayers = await retryTransientDbOperation({
      operation: "loadSceneLayersForReconciliation",
      context: { sourceId },
      run: () =>
        this.db.book1SceneComponent.findMany({
          where: { sourceId },
          select: { sceneAnchorId: true, componentType: true },
          distinct: ["sceneAnchorId", "componentType"],
        }),
    });

    const groupedKeys = new Set(scopedLayers.map((layer) => `${layer.sceneAnchorId}|${String(layer.componentType)}`));
    const sceneAnchorIds = [...new Set(scopedLayers.map((row) => row.sceneAnchorId))];
    const componentTypes = [...new Set(scopedLayers.map((row) => row.componentType))];

    const allCandidates = await retryTransientDbOperation({
      operation: "prefetchSceneLayerCandidates",
      context: { sourceId },
      run: () =>
        this.db.book1SceneComponent.findMany({
          where: {
            sceneAnchorId: { in: sceneAnchorIds },
            componentType: { in: componentTypes },
          },
          include: {
            source: { select: { sourceKey: true } },
            sceneAnchor: { select: { sceneNumber: true } },
          },
        }),
    });

    const updatesToCanon: string[] = [];
    const updatesToCandidate: string[] = [];
    const updatesToDeprecated: string[] = [];
    for (const [groupKey, groupRows] of Object.entries(
      allCandidates.reduce<Record<string, typeof allCandidates>>((acc, row) => {
        const key = `${row.sceneAnchorId}|${String(row.componentType)}`;
        if (!groupedKeys.has(key)) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {}),
    )) {
      try {
        const decision = computeSceneLayerResolution(
          groupRows.map((row) => ({
            id: row.id,
            componentKey: row.componentKey,
            componentType: row.componentType,
            confidenceType: row.confidenceType,
            canonStatus: row.canonStatus,
            orderPriority: row.orderPriority,
            textContent: row.textContent,
            createdAt: row.createdAt,
            sourceKey: row.source.sourceKey,
            sceneNumber: row.sceneAnchor.sceneNumber,
          })),
        );
        if (!decision) continue;

        const preferred = groupRows.find((row) => row.id === decision.preferredComponentId);
        if (preferred && preferred.canonStatus !== Book1CanonStatus.CANON) {
          updatesToCanon.push(preferred.id);
        }
        const supersededSet = new Set(decision.supersededComponentIds);
        for (const demotedId of decision.demotedComponentIds) {
          const row = groupRows.find((candidate) => candidate.id === demotedId);
          if (!row) continue;
          const target = supersededSet.has(demotedId) ? Book1CanonStatus.DEPRECATED : Book1CanonStatus.CANDIDATE;
          if (row.canonStatus === target) continue;
          if (target === Book1CanonStatus.DEPRECATED) updatesToDeprecated.push(demotedId);
          else updatesToCandidate.push(demotedId);
        }
      } catch (error) {
        const reportsDir = path.join(process.cwd(), "reports");
        await mkdir(reportsDir, { recursive: true });
        const reportPath = path.join(reportsDir, "book1-scene-layer-reconciliation-errors.jsonl");
        const message = error instanceof Error ? error.message : String(error);
        await appendFile(
          reportPath,
          `${JSON.stringify({
            timestamp: new Date().toISOString(),
            groupKey,
            sourceId,
            errorMessage: message,
          })}\n`,
          "utf8",
        );
      }
    }

    const applyStatusUpdates = async (ids: string[], status: Book1CanonStatus): Promise<void> => {
      for (const idChunk of chunkArray(ids, 200)) {
        if (idChunk.length === 0) continue;
        await retryTransientDbOperation({
          operation: "applySceneLayerStatusUpdate",
          context: { sourceId },
          run: () =>
            this.db.book1SceneComponent.updateMany({
              where: { id: { in: idChunk } },
              data: { canonStatus: status },
            }),
        });
      }
    };
    await applyStatusUpdates([...new Set(updatesToCanon)], Book1CanonStatus.CANON);
    await applyStatusUpdates([...new Set(updatesToCandidate)], Book1CanonStatus.CANDIDATE);
    await applyStatusUpdates([...new Set(updatesToDeprecated)], Book1CanonStatus.DEPRECATED);
  }

  async upsertRetrievalProfile(objectId: string, input: Book1RetrievalProfileInput): Promise<string> {
    await this.upsertRetrievalProfilesBulk([{ objectId, input }]);
    const row = await this.db.book1RetrievalProfile.findUnique({
      where: {
        objectType_objectId: {
          objectType: toRetrievalObjectType(input.objectType),
          objectId,
        },
      },
      select: { id: true },
    });
    if (!row) throw new Error(`Failed to persist retrieval profile ${input.objectType}:${objectId}`);
    return row.id;
  }

  async upsertRetrievalProfilesBulk(
    entries: Array<{ objectId: string; input: Book1RetrievalProfileInput }>,
  ): Promise<number> {
    if (entries.length === 0) return 0;
    const desired = entries.map((entry) => ({
      objectType: toRetrievalObjectType(entry.input.objectType),
      objectId: entry.objectId,
      embeddingText: entry.input.embeddingText,
      retrievalTagsJson: entry.input.retrievalTags,
      useCasesJson: entry.input.useCases,
      spoilerLevel: entry.input.spoilerLevel,
      priorityWeight: entry.input.priorityWeight,
    }));
    const objectIds = [...new Set(desired.map((item) => item.objectId))];
    const objectTypes = [...new Set(desired.map((item) => item.objectType))];
    const existing = await retryTransientDbOperation({
      operation: "prefetchRetrievalProfiles",
      context: { sourceId: null },
      run: () =>
        this.db.book1RetrievalProfile.findMany({
          where: {
            objectId: { in: objectIds },
            objectType: { in: objectTypes },
          },
        }),
    });
    const existingByKey = new Map<string, (typeof existing)[number]>(
      existing.map((row) => [`${String(row.objectType)}|${row.objectId}`, row]),
    );

    const creates: typeof desired = [];
    const updates: Array<{ id: string; data: Omit<typeof desired[number], "objectId" | "objectType"> }> = [];
    for (const item of desired) {
      const key = `${String(item.objectType)}|${item.objectId}`;
      const existingRow = existingByKey.get(key);
      if (!existingRow) {
        creates.push(item);
        continue;
      }
      const unchanged =
        existingRow.embeddingText === item.embeddingText &&
        JSON.stringify(existingRow.retrievalTagsJson ?? null) === JSON.stringify(item.retrievalTagsJson) &&
        JSON.stringify(existingRow.useCasesJson ?? null) === JSON.stringify(item.useCasesJson) &&
        (existingRow.spoilerLevel ?? null) === (item.spoilerLevel ?? null) &&
        Number(existingRow.priorityWeight ?? 0) === Number(item.priorityWeight ?? 0);
      if (unchanged) continue;
      updates.push({
        id: existingRow.id,
        data: {
          embeddingText: item.embeddingText,
          retrievalTagsJson: item.retrievalTagsJson,
          useCasesJson: item.useCasesJson,
          spoilerLevel: item.spoilerLevel,
          priorityWeight: item.priorityWeight,
        },
      });
    }

    if (creates.length > 0) {
      await retryTransientDbOperation({
        operation: "createRetrievalProfilesMany",
        context: { sourceId: null },
        run: () =>
          this.db.book1RetrievalProfile.createMany({
            data: creates,
            skipDuplicates: true,
          }),
      });
    }
    for (const updateChunk of chunkArray(updates, 80)) {
      await retryTransientDbOperation({
        operation: "updateRetrievalProfilesChunk",
        context: { sourceId: null },
        run: () =>
          this.db.$transaction(
            updateChunk.map((entry) =>
              this.db.book1RetrievalProfile.update({
                where: { id: entry.id },
                data: entry.data,
              }),
            ),
          ),
      });
    }
    return desired.length;
  }
}
