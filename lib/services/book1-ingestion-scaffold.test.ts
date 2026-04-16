import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BOOK1_SUPPORTED_CONTENT_MODES,
  BOOK1_SUPPORTED_DENSITY_LABELS,
  DeterministicBook1ChunkClassifier,
  PrismaBook1SourceRegistrationService,
  type Book1SourcePersistenceWriter,
  type PersistBook1SourceInput,
} from "@/lib/services/book1-ingestion-scaffold";
import {
  BOOK1_GOLDEN_GENEALOGY_HISTORY_SAMPLE,
  BOOK1_GOLDEN_MIXED_WORLDBUILDING_SAMPLE,
  BOOK1_GOLDEN_POV_ANALYSIS_SAMPLE,
  BOOK1_GOLDEN_SCENE1_PROSE_SAMPLE,
} from "@/lib/services/book1-classifier-golden-samples";

class InMemoryBook1SourceWriter implements Book1SourcePersistenceWriter {
  public rows = new Map<string, PersistBook1SourceInput>();

  async upsertSource(input: PersistBook1SourceInput): Promise<void> {
    this.rows.set(input.source_key, input);
  }
}

describe("book1-ingestion-scaffold source registration", () => {
  it("persists Book 1 source payload with provenance metadata", async () => {
    const writer = new InMemoryBook1SourceWriter();
    const service = new PrismaBook1SourceRegistrationService(writer);

    const result = await service.register({
      title: "Book 1 Scene 1 River sample",
      raw_text: BOOK1_GOLDEN_SCENE1_PROSE_SAMPLE,
      upload_sequence: 1,
      chunk_number: 1,
      file_name: "book1/chunk1.txt",
      book_number: 1,
      source_kind: "uploaded_chunk",
      dominant_content_mode: "scene_text",
      secondary_content_modes: ["pov_text", "setting_text", "interpretive_text", "history"],
    });

    const persistedRow = writer.rows.get(result.source_key);
    assert.equal(result.persisted, true);
    assert.equal(Boolean(persistedRow), true);
    assert.equal(persistedRow?.source_kind, "UPLOADED_CHUNK");
    assert.equal(persistedRow?.dominant_content_mode, "SCENE_TEXT");
    assert.deepEqual(persistedRow?.secondary_modes_json, [
      "pov_text",
      "setting_text",
      "interpretive_text",
    ]);
    assert.equal(persistedRow?.chunk_number, 1);
    assert.equal(persistedRow?.upload_sequence, 1);
    assert.equal(result.provenance.file_name, "book1/chunk1.txt");
  });
});

describe("book1-ingestion-scaffold classifier", () => {
  it("returns structured shape with bounded secondary modes", async () => {
    const classifier = new DeterministicBook1ChunkClassifier();
    const result = await classifier.classify({ sourceText: BOOK1_GOLDEN_SCENE1_PROSE_SAMPLE });

    assert.equal(BOOK1_SUPPORTED_CONTENT_MODES.includes(result.primary_mode), true);
    assert.equal(result.secondary_modes.length <= 3, true);
    assert.equal(BOOK1_SUPPORTED_DENSITY_LABELS.includes(result.density_label), true);
    assert.equal(Object.keys(result.mode_scores).length, BOOK1_SUPPORTED_CONTENT_MODES.length);
    assert.equal(result.rationale.length > 0, true);
  });

  it("classifies representative Book 1 golden samples", async () => {
    const classifier = new DeterministicBook1ChunkClassifier();

    const scene = await classifier.classify({ sourceText: BOOK1_GOLDEN_SCENE1_PROSE_SAMPLE });
    const pov = await classifier.classify({ sourceText: BOOK1_GOLDEN_POV_ANALYSIS_SAMPLE });
    const lineage = await classifier.classify({ sourceText: BOOK1_GOLDEN_GENEALOGY_HISTORY_SAMPLE });
    const world = await classifier.classify({ sourceText: BOOK1_GOLDEN_MIXED_WORLDBUILDING_SAMPLE });

    assert.equal(scene.primary_mode, "scene_text");
    assert.equal(scene.secondary_modes.includes("setting_text"), true);
    assert.equal(pov.primary_mode, "pov_text");
    assert.equal(pov.secondary_modes.includes("interpretive_text"), true);
    assert.equal(lineage.primary_mode, "lineage");
    assert.equal(lineage.secondary_modes.includes("history"), true);
    assert.equal(world.primary_mode, "worldbuilding");
  });
});
