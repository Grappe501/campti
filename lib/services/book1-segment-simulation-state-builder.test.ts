import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1SegmentSimulationStateBuilderService } from "@/lib/services/book1-segment-simulation-state-builder";

describe("book1-segment-simulation-state-builder", () => {
  it("builds simulation packets per segment", () => {
    const report = new Book1SegmentSimulationStateBuilderService().build({
      outline: {
        timeline: [
          { segment: 1, setting: "River bank", characters: ["Alexis", "Augustin"], sceneFocus: "A vow is tested under scarcity." },
          { segment: 2, setting: "Household threshold", characters: ["Alexis"], sceneFocus: "Witnesses negotiate rank through silence." },
        ],
      },
      hiddenHistories: {
        characters: [{ character: "Alexis", suppressedMotive: "protect continuity", privateWound: "fear of erasure" }],
      },
      livedHistory: {
        artifact: "chapter_lived_history",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        packets: [
          {
            segment: 1,
            environment: "River weather cuts movement windows.",
            socialOrder: "Kin rank governs who speaks first.",
            materialLife: "Wet grain and ash cling to tools.",
            movementPatterns: "People move between bank and hearth in narrow routes.",
            laborRitualGovernanceCues: "Oath speech is deferred until witnesses settle.",
            obviousToCharacters: "No one can risk open contradiction.",
            notConsciouslyExplained: "Authority shifts through object handling.",
          },
          {
            segment: 2,
            environment: "Air is dense and hot near the threshold.",
            socialOrder: "Household rank stays formal in public.",
            materialLife: "Clay bowls pass hand to hand without comment.",
            movementPatterns: "Foot traffic narrows toward one doorway.",
            laborRitualGovernanceCues: "Meal order marks temporary status.",
            obviousToCharacters: "Everyone reads delay as strategy.",
            notConsciouslyExplained: "Breath timing sets the tempo.",
          },
        ],
      },
      chapterEvidencePack: { evidence: [{ statement: "Scarcity alters oath enforcement." }, { statement: "Kin duty determines witness order." }] },
      chapterLaw: {
        chronologyInvariants: [{ rule: "No civil war references." }],
        futureArcConstraints: [{ mustPreserve: "The vow remains unresolved." }],
      },
    });

    assert.equal(report.artifact, "chapter_segment_simulation_state");
    assert.equal(report.segments.length, 2);
    assert.equal(report.segments[0]?.people.length, 2);
  });
});
