import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1VoiceContractService, scoreVoiceContractCompliance } from "@/lib/services/book1-voice-contract-service";

describe("book1-voice-contract-service", () => {
  it("builds a machine-usable contract with compliance rubric", () => {
    const contract = new Book1VoiceContractService().buildContract();
    assert.equal(contract.artifact, "chapter_voice_contract");
    assert.equal(contract.positiveConstraints.sentenceRhythmProfile.preferredBands.length > 0, true);
    assert.equal(contract.negativeConstraints.outlineLeakageLanguage.length > 0, true);
    assert.equal(contract.complianceRubric.syntheticProseRisk.passThreshold > 0, true);
  });

  it("scores compliance dimensions", () => {
    const contract = new Book1VoiceContractService().buildContract();
    const scores = scoreVoiceContractCompliance({
      contract,
      draftText:
        "River wind moves ash across the cook fire. The elder watches hands before words. Kinship duty lands in silence before anyone names it.",
    });
    assert.equal(scores.rhythmCompliance >= 0, true);
    assert.equal(scores.syntheticProseRisk >= 0, true);
  });
});
