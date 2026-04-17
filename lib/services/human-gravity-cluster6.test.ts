/**
 * Cluster 6 — human gravity runtime (node:test).
 * Run: npx tsx --test lib/services/human-gravity-cluster6.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { computeSceneGenerationInputHash } from "@/lib/scene-generation/canonical-scene-generation-hash";
import { compactHumanGravityRuntimeLines } from "@/lib/scene-generation/scene-generation-llm-adapter";
import { EpicEmotionalGravityDerivationService } from "@/lib/services/epic-emotional-gravity-derivation-service";
import {
  buildHumanGravityRuntimeCockpitPanelFromProfile,
  HumanGravityRuntimeDerivationService,
} from "@/lib/services/human-gravity-runtime-derivation-service";
import { HumanGravityValidationService } from "@/lib/services/human-gravity-validation-service";
function minimalContract(overrides: Partial<SceneGenerationContractV1["scene"]> = {}): SceneGenerationContractV1 {
  return {
    contractVersion: "1",
    epic: { id: "campti-epic", title: "E", summary: null, metadataJson: {} },
    book: { id: "book1", movementIndex: 0, title: "B", readerFacingTitle: null, summary: null },
    chapter: {
      id: "book1-chapter-01",
      title: "C",
      summary: "chapter function",
      sequenceInBook: 1,
      chapterNumber: 1,
    },
    scene: {
      id: "book1-chapter-01-scene-01",
      description: "d",
      summary: null,
      narrativeIntent: "Test intent",
      emotionalTone: null,
      orderInChapter: 1,
      writingMode: "STRUCTURED",
      historicalAnchor: null,
      locationNote: null,
      pov: null,
      structuredDataJson: {},
      ...overrides,
    },
    effectiveWorldState: { worldStateId: "ws1", eraId: "e1650", label: "1650s Red River" },
    place: { id: "pl1", name: "P", description: null },
    participatingPeople: [
      {
        id: "natchitoches-matriarch-keeper",
        name: "M",
        description: null,
        birthYear: null,
        deathYear: null,
      },
    ],
    genealogicalAssertions: [],
    worldStateReference: null,
    beatPlan: [],
    continuityNotes: [],
    privateNotes: null,
  };
}

function minimalSceneGenerationInput(overrides: Partial<SceneGenerationInput> = {}): SceneGenerationInput {
  return {
    contract: minimalContract(),
    generationMode: "draft",
    generationPurpose: "author_draft",
    historicalAnchorTerms: ["river", "oak"],
    proseQaContext: {},
    sourceIdsUsed: [],
    ...overrides,
  };
}

describe("human gravity cluster 6", () => {
  it("attachment and relational bias services affect scene prep weights", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: ["lineage"],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const profile = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: ["natchitoches-matriarch-keeper"],
    });
    assert.ok(profile.attachmentWeightMap["natchitoches-matriarch-keeper"] > 0);
    assert.ok(profile.relationalThreatMap["bond-keeper-younger"] !== undefined);
    assert.ok(profile.promptInstructionLines.some((l) => l.includes("CLUSTER6_HUMAN_GRAVITY")));
    assert.equal(profile.runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive, true);
  });

  it("consequence persistence surfaces markers across scene bundle", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: ["lineage"],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-04"],
    });
    const p = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-04",
      chapterSequence: 1,
      participatingPeopleIds: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
    });
    assert.ok(p.activeConsequenceMarkers.length > 0);
    assert.ok(p.repairDifficultySignals.length > 0);
  });

  it("generational burden affects carry-forward residue lines", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const p = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    assert.ok(p.activeBurdenLines.length > 0 || p.inheritedWarningLines.length > 0);
  });

  it("no-reset passes when prose carries residue under upstream pressure", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const profile = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    const okText =
      "She looked away first. The silence between them carried the old warning, stillness tight as wire, " +
      "the burden of what could not be said aloud in that kitchen. He felt the weight of it, unresolved, " +
      "and the distance that had never quite closed after the river year.";
    const good = new HumanGravityValidationService().validate({ profile, generatedText: okText });
    assert.equal(good.humanGravityTruth.sceneOutputValidUnderNoResetRules, true);
    assert.equal(good.humanGravityTruth.noResetViolations.length, 0);
  });

  it("shallow / reset validation flags melodrama reset language", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const profile = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    const bad = new HumanGravityValidationService().validate({
      profile,
      generatedText: "And everything was fine. No harm done.",
    });
    assert.ok(bad.driftReport.consequenceResetWarnings.length > 0);
    assert.equal(bad.humanGravityTruth.upstreamNoResetPressureActive, true);
    assert.equal(bad.humanGravityTruth.sceneOutputValidUnderNoResetRules, false);
    assert.ok(bad.humanGravityTruth.noResetViolations.length > 0);
  });

  it("cockpit summary exposes materialized prompt flag", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const profile = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    const panel = buildHumanGravityRuntimeCockpitPanelFromProfile(profile);
    assert.equal(panel.runtimePromptLinesMaterialized, true);
  });

  it("canonical hash changes when humanGravityRuntime is present", () => {
    const base = minimalSceneGenerationInput();
    const h1 = computeSceneGenerationInputHash(base, null);
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const hg = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    const h2 = computeSceneGenerationInputHash({ ...base, humanGravityRuntime: hg }, null);
    assert.notEqual(h1, h2);
  });

  it("deriveFromSceneGenerationInput returns null without governance merge", () => {
    const input = minimalSceneGenerationInput({ canonicalPreGeneration: undefined });
    assert.equal(new HumanGravityRuntimeDerivationService().deriveFromSceneGenerationInput(input), null);
  });

  it("compactHumanGravityRuntimeLines mirrors derived profile for model prompt", () => {
    const pack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "pressure",
      chapterPsychologyMode: "intimate",
      activeThreadIds: [],
      recallWindows: [],
      sceneIds: ["book1-chapter-01-scene-01"],
    });
    const profile = new HumanGravityRuntimeDerivationService().deriveFromPackContext({
      pack,
      chapterId: "book1-chapter-01",
      sceneId: "book1-chapter-01-scene-01",
      chapterSequence: 1,
      participatingPeopleIds: [],
    });
    const lines = compactHumanGravityRuntimeLines({ ...minimalSceneGenerationInput(), humanGravityRuntime: profile });
    assert.ok(lines?.includes("CLUSTER6_HUMAN_GRAVITY"));
  });
});
