import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1CharacterDistinctionPlanService } from "@/lib/services/book1-character-distinction-plan-service";

describe("book1-character-distinction-plan-service", () => {
  it("builds per-character rendering distinction guidance", () => {
    const report = new Book1CharacterDistinctionPlanService().build({
      cognitionSignatures: {
        artifact: "chapter_cognition_signatures",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        characters: [
          {
            character: "Alexis",
            attentionBias: "threat-first scan",
            thoughtStyle: "compressed inferential thought",
            emotionalProcessingStyle: "suppresses fear into stillness",
            namingAvoidanceStyle: "avoids naming private hurt",
            sensoryPriority: ["sound", "distance", "breath"],
            decisionStyle: "risk-minimizing",
          },
        ],
      },
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
                wants: "Preserve continuity.",
                knows: "Witness map is unstable.",
                misreads: "Silence as concession.",
                hiding: "fear of erasure",
              },
            ],
            worldPressure: "Storm pressure",
            visibleAction: "He relocates the bowl before speaking.",
            hiddenChange: "Speaking order has shifted.",
          },
        ],
      },
    });

    assert.equal(report.artifact, "chapter_character_distinction_plan");
    assert.equal(report.characters.length, 1);
    assert.equal(report.characters[0]?.sentenceTexture.length > 0, true);
  });
});
