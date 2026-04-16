import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1SegmentEnergyService } from "@/lib/services/book1-segment-energy-service";

describe("book1-segment-energy-service", () => {
  it("assigns non-uniform segment energy profiles", () => {
    const map = new Book1SegmentEnergyService().build({
      outline: {
        chapter: 1,
        timeline: [
          {
            segment: 1,
            sceneFocus: "Opening stillness before pressure",
            setting: "River edge",
            characters: ["A"],
            psychology: "fear",
            narrativePurpose: "x",
            readerExperience: "x",
            foreshadowing: "x",
            historicalContext: "x",
            transitionToNext: "x",
          },
          {
            segment: 2,
            sceneFocus: "Ritual oath under threat",
            setting: "Hearth",
            characters: ["A"],
            psychology: "duty",
            narrativePurpose: "x",
            readerExperience: "x",
            foreshadowing: "x",
            historicalContext: "x",
            transitionToNext: "x",
          },
        ],
      },
    });
    assert.equal(map.artifact, "chapter_segment_energy");
    assert.equal(map.segments.length, 2);
    assert.equal(map.segments[0].dominantEnergy !== map.segments[1].dominantEnergy, true);
  });
});
