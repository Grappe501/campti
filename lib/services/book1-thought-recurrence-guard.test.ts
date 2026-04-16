import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1ThoughtRecurrenceGuardService } from "@/lib/services/book1-thought-recurrence-guard";

describe("book1-thought-recurrence-guard", () => {
  it("tracks recurring thought/motif/fear/symbol signals", () => {
    const report = new Book1ThoughtRecurrenceGuardService().build({
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
                wants: "Protect the house without public rupture.",
                knows: "Knows the oath can fail if witnesses split.",
                misreads: "Assumes silence means consent.",
                hiding: "Fear of erasure under kin judgment.",
              },
            ],
            worldPressure: "Storm pressure compresses movement.",
            visibleAction: "The river means danger and symbols become policy.",
            hiddenChange: "Authority shifts but the vow remains unresolved.",
          },
          {
            segment: 2,
            whoIsPresent: ["Alexis"],
            people: [
              {
                character: "Alexis",
                wants: "Protect the house without public rupture.",
                knows: "Knows the oath can fail if witnesses split.",
                misreads: "Assumes silence means consent.",
                hiding: "Fear of erasure under kin judgment.",
              },
            ],
            worldPressure: "Storm pressure compresses movement.",
            visibleAction: "The river means danger and symbols become policy.",
            hiddenChange: "Authority shifts but the vow remains unresolved.",
          },
        ],
      },
    });

    assert.equal(report.artifact, "chapter_thought_recurrence_guard");
    assert.equal(report.segmentGuards.length, 2);
    assert.equal(report.segmentGuards[0]?.allowRecurrenceIf.length, 4);
  });
});
