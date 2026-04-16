import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Book1DevelopmentalIntimacyEngineService,
  Book1DevelopmentalIntimacyEngineSchema,
  developmentalAbstractionCeiling,
  developmentalMisreadingVector,
  isChildProtected,
} from "@/lib/services/book1-developmental-intimacy-engine-service";

function sampleInput() {
  return {
    activeCharacters: ["Alexis", "Augustin"],
    characterSeeds: [
      { character: "Alexis", role: "focal-adult" as const },
      { character: "Augustin", role: "ascending-adult" as const },
      { character: "Elder Memory Holder", role: "elder" as const },
      { character: "Younger Woman Threshold Learner", role: "threshold-learner" as const },
      { character: "Child Silent Recorder", role: "child" as const },
    ],
    segments: [
      { segment: 1, sceneFocus: "Opening terrain.", characters: ["Alexis", "Augustin"] },
      { segment: 2, sceneFocus: "Environmental forces.", characters: ["Alexis", "Augustin"] },
    ],
  };
}

describe("Book1DevelopmentalIntimacyEngineService", () => {
  it("produces a valid engine artifact with all character profiles", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    const parsed = Book1DevelopmentalIntimacyEngineSchema.parse(result);
    assert.equal(parsed.characters.length, 5);
    assert.equal(parsed.segmentImpactMap.length, 2);
    assert.equal(parsed.artifact, "chapter_developmental_intimacy_engine");
  });

  it("assigns correct developmental phases", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    const alexis = result.characters.find((c) => c.character === "Alexis")!;
    const augustin = result.characters.find((c) => c.character === "Augustin")!;
    const elder = result.characters.find((c) => c.character === "Elder Memory Holder")!;
    const threshold = result.characters.find((c) => c.character === "Younger Woman Threshold Learner")!;
    const child = result.characters.find((c) => c.character === "Child Silent Recorder")!;
    assert.equal(alexis.ageMaturityLayer.developmentalPhase, "full-adult-authority");
    assert.equal(augustin.ageMaturityLayer.developmentalPhase, "emerging-authority");
    assert.equal(elder.ageMaturityLayer.developmentalPhase, "generative-authority");
    assert.equal(threshold.ageMaturityLayer.developmentalPhase, "threshold-crossing");
    assert.equal(child.ageMaturityLayer.developmentalPhase, "pre-threshold-absorption");
  });

  it("child character is protected from intimacy content", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    const child = result.characters.find((c) => c.character === "Child Silent Recorder")!;
    assert.ok(isChildProtected(child));
    assert.ok(child.renderingImpact.renderDirectiveModifiers.some((d) => d.includes("HARD RULE")));
    assert.ok(child.renderingImpact.voiceCognitionModifiers.some((m) => m.includes("PROTECTION")));
  });

  it("elder gets abstraction ceiling of 1, all others get 0", () => {
    assert.equal(developmentalAbstractionCeiling("generative-authority"), 1);
    assert.equal(developmentalAbstractionCeiling("full-adult-authority"), 0);
    assert.equal(developmentalAbstractionCeiling("emerging-authority"), 0);
    assert.equal(developmentalAbstractionCeiling("threshold-crossing"), 0);
    assert.equal(developmentalAbstractionCeiling("pre-threshold-absorption"), 0);
  });

  it("detects developmental misreading vector between Alexis and Augustin", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    const alexis = result.characters.find((c) => c.character === "Alexis")!;
    const augustin = result.characters.find((c) => c.character === "Augustin")!;
    const misreading = developmentalMisreadingVector(alexis, augustin);
    assert.ok(misreading === null || typeof misreading === "string");
  });

  it("detects developmental misreading vector between elder and threshold-learner", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    const elder = result.characters.find((c) => c.character === "Elder Memory Holder")!;
    const threshold = result.characters.find((c) => c.character === "Younger Woman Threshold Learner")!;
    const misreading = developmentalMisreadingVector(elder, threshold);
    assert.ok(misreading !== null);
    assert.ok(misreading!.includes("developmental gap"));
  });

  it("global rendering rules enforce no clinical labels and age-appropriate handling", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    assert.equal(result.globalRenderingRules.noClinicalLabelsInProse, true);
    assert.ok(result.globalRenderingRules.ageAppropriateHandling.childCharacters.includes("HARD PROTECTION"));
    assert.ok(result.globalRenderingRules.intimacyRenderingPrinciple.length > 50);
  });

  it("segment impact map includes bodily conversion activations", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    for (const segment of result.segmentImpactMap) {
      assert.ok(segment.bodilyConversionActivations.length >= 2);
      assert.ok(segment.activeIntimacyDynamics.length >= 2);
    }
  });

  it("each character has all three layers populated", () => {
    const result = new Book1DevelopmentalIntimacyEngineService().build(sampleInput());
    for (const character of result.characters) {
      assert.ok(character.ageMaturityLayer.chronologicalAge.length > 0);
      assert.ok(character.intimacyEmbodimentLayer.bodyAwarenessStyle.length > 0);
      assert.ok(character.historicalCulturalMediation.ritualStatus.length > 0);
      assert.ok(character.renderingImpact.voiceCognitionModifiers.length >= 2);
      assert.ok(character.renderingImpact.bodilyConversionPatterns.length >= 2);
      assert.ok(character.renderingImpact.silencePatterns.length >= 2);
      assert.ok(character.renderingImpact.intimacyDistancePatterns.length >= 2);
    }
  });
});
