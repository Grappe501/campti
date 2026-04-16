import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1EmbodimentTransformerService } from "@/lib/services/book1-embodiment-transformer";

describe("book1-embodiment-transformer", () => {
  it("translates context inputs into embodied segment packets", () => {
    const result = new Book1EmbodimentTransformerService().transform({
      chapterEvidencePack: {
        evidence: [{ evidenceId: "E1", statement: "Stored grain shifts by household rank." }],
      },
      livedHistory: {
        artifact: "chapter_lived_history",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        packets: [
          {
            segment: 1,
            environment: "River fog sits low.",
            socialOrder: "Rank appears in speaking order.",
            materialLife: "Reed baskets and ash-stained cloth.",
            movementPatterns: "Paths loop between bank and hearth.",
            laborRitualGovernanceCues: "Work and oath overlap.",
            obviousToCharacters: "Debt can shift by dusk.",
            notConsciouslyExplained: "Silence marks danger.",
          },
        ],
      },
      proseBriefs: {
        artifact: "chapter_prose_briefs",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        segments: [{ segment: 1, mustShow: "A", livedPov: "B", activePressure: "C", readerInference: "D", handoff: "E" }],
      },
      chapterLaw: {
        chronologyInvariants: [{ rule: "No dates past 1680" }],
        futureArcConstraints: [{ mustPreserve: "Keep pressure unresolved" }],
      },
    });
    assert.equal(result.artifact, "chapter_embodiment_packets");
    assert.equal(result.segments.length, 1);
    assert.equal(result.segments[0].concreteActions.length > 0, true);
    assert.equal(result.segments[0].sensoryCues.length > 0, true);
  });
});
