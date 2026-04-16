import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1BulkIngestionOrchestrator, type Book1CorpusProvider } from "@/lib/services/book1-bulk-ingestion-orchestrator";
import type { Book1IngestionRepository } from "@/lib/services/book1-ingestion-persistence";

class FixtureCorpusProvider implements Book1CorpusProvider {
  async discoverRawChunks() {
    return [
      {
        chunkNumber: 1,
        uploadSequence: 1,
        fileName: "chunk1.txt",
        relativePath: "docs/book1/chunk1.txt",
        rawText:
          "Scene 1 at dawn by the river.\n\nIn 1714 the lineage branch records mother and daughter movement.\n\nThe motif of river echo suggests ritual memory.",
      },
    ];
  }

  async discoverSupportingBriefs() {
    return [
      {
        fileName: "book1-chunk1-core-story-brief.md",
        relativePath: "docs/build/book1-chunk1-core-story-brief.md",
        rawText: "Scene 1 brief with symbolic and interpretive layers.",
      },
    ];
  }
}

class InMemoryIngestionRepository implements Book1IngestionRepository {
  public sourceWrites = 0;
  public knowledgeWrites = 0;
  public entityWrites = 0;
  public relationshipWrites = 0;
  public timelineWrites = 0;
  public sceneWrites = 0;
  public retrievalWrites = 0;

  async upsertSource() {
    this.sourceWrites += 1;
    return `source-${this.sourceWrites}`;
  }

  async upsertKnowledgeNode() {
    this.knowledgeWrites += 1;
    return `node-${this.knowledgeWrites}`;
  }

  async upsertEntity() {
    this.entityWrites += 1;
    return `entity-${this.entityWrites}`;
  }

  async upsertEntityRelationship() {
    this.relationshipWrites += 1;
    return `rel-${this.relationshipWrites}`;
  }

  async upsertTimelineEvent() {
    this.timelineWrites += 1;
    return `timeline-${this.timelineWrites}`;
  }

  async upsertSceneComponent() {
    this.sceneWrites += 1;
    return `scene-${this.sceneWrites}`;
  }

  async upsertSceneComponentsBulk(_sourceId: string, inputs: Array<{ componentKey: string }>) {
    const result: Record<string, string> = {};
    for (const input of inputs) {
      this.sceneWrites += 1;
      result[input.componentKey] = `scene-${this.sceneWrites}`;
    }
    return result;
  }

  async reconcileSceneLayerPreferences() {
    return;
  }

  async upsertRetrievalProfile() {
    this.retrievalWrites += 1;
    return `retrieval-${this.retrievalWrites}`;
  }

  async upsertRetrievalProfilesBulk(entries: Array<{ objectId: string }>) {
    this.retrievalWrites += entries.length;
    return entries.length;
  }
}

describe("book1 bulk ingestion orchestrator", () => {
  it("returns stable dry-run report shape", async () => {
    const orchestrator = new Book1BulkIngestionOrchestrator({
      corpusProvider: new FixtureCorpusProvider(),
    });
    const report = await orchestrator.run({
      dryRun: true,
      range: { fromChunk: 1, toChunk: 1 },
    });

    assert.equal(report.dryRun, true);
    assert.equal(report.results.length, 1);
    assert.equal(report.results[0].chunkFileName, "chunk1.txt");
    assert.equal(Array.isArray(report.results[0].matchedBriefFileNames), true);
    assert.equal(typeof report.summary.totalChunksScanned, "number");
    assert.equal(typeof report.summary.chunksNeedingManualReview, "number");
  });

  it("persists a representative in-memory end-to-end ingestion pass", async () => {
    const repository = new InMemoryIngestionRepository();
    const orchestrator = new Book1BulkIngestionOrchestrator({
      corpusProvider: new FixtureCorpusProvider(),
      repository,
    });
    const report = await orchestrator.run({
      dryRun: false,
      range: { fromChunk: 1, toChunk: 1 },
    });

    assert.equal(report.results.length, 1);
    assert.equal(repository.sourceWrites >= 1, true);
    assert.equal(repository.knowledgeWrites > 0, true);
    assert.equal(repository.retrievalWrites > 0, true);
    assert.equal(report.results[0].segmentCount > 0, true);
    assert.equal(report.summary.totalChunksIngested, 1);
  });
});
