import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1CharacterCognitionSignatureService } from "@/lib/services/book1-character-cognition-signature-service";

describe("book1-character-cognition-signature-service", () => {
  it("builds cognition signatures for active characters", () => {
    const report = new Book1CharacterCognitionSignatureService().build({
      activeCharacters: ["Alexis", "Augustin"],
      hiddenHistories: [
        { character: "Alexis", suppressedMotive: "preserve lineage continuity", privateWound: "fear of erasure" },
        { character: "Augustin", suppressedMotive: "maintain duty order", privateWound: "wound from misread loyalty" },
      ],
    });

    assert.equal(report.artifact, "chapter_cognition_signatures");
    assert.equal(report.characters.length, 2);
    assert.equal(report.characters.every((row) => row.sensoryPriority.length >= 3), true);
  });
});
