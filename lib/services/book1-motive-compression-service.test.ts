import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1MotiveCompressionService } from "@/lib/services/book1-motive-compression-service";

describe("book1-motive-compression-service", () => {
  it("builds motive states and segment directives", () => {
    const report = new Book1MotiveCompressionService().build({
      segmentSimulationState: {
        artifact: "chapter_segment_simulation_state",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        segments: [
          {
            segment: 1,
            whoIsPresent: ["Alexis"],
            people: [
              {
                character: "Alexis",
                wants: "Keep household authority intact.",
                knows: "Witnesses are divided.",
                misreads: "Silence as consent.",
                hiding: "Fear of losing lineage claim.",
              },
            ],
            worldPressure: "Storm pressure narrows options.",
            visibleAction: "Alexis keeps one hand on the ledger bowl.",
            hiddenChange: "Rank has shifted quietly.",
          },
          {
            segment: 2,
            whoIsPresent: ["Alexis"],
            people: [
              {
                character: "Alexis",
                wants: "Keep household authority intact.",
                knows: "Witnesses are divided.",
                misreads: "Silence as consent.",
                hiding: "Fear of losing lineage claim.",
              },
            ],
            worldPressure: "Storm pressure narrows options.",
            visibleAction: "Alexis keeps one hand on the ledger bowl.",
            hiddenChange: "Rank has shifted quietly.",
          },
        ],
      },
    });

    assert.equal(report.artifact, "chapter_motive_compression");
    assert.equal(report.characterStates.length >= 1, true);
    assert.equal(report.segmentDirectives.length >= 2, true);
  });
});
