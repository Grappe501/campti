/**
 * Cluster 5 — prose & narrative realism (node:test).
 * Run: npx tsx --test lib/services/prose-realism-cluster5.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { computeSceneGenerationInputHash } from "@/lib/scene-generation/canonical-scene-generation-hash";
import { compactProseRealismLines } from "@/lib/scene-generation/scene-generation-llm-adapter";
import { AntiMechanicalProseValidationService } from "@/lib/services/anti-mechanical-prose-validation-service";
import {
  buildProseRealismCockpitPanelFromGovernance,
  ProseRealismDerivationService,
} from "@/lib/services/prose-realism-derivation-service";
import { ProseRealismValidationService } from "@/lib/services/prose-realism-validation-service";

function minimalContract(): SceneGenerationContractV1 {
  return {
    contractVersion: "1",
    epic: { id: "epic1", title: "E", summary: null, metadataJson: {} },
    book: { id: "book1", movementIndex: 0, title: "B", readerFacingTitle: null, summary: null },
    chapter: {
      id: "ch1",
      title: "C",
      summary: "chapter function: establish river household pressure",
      sequenceInBook: 1,
      chapterNumber: 1,
    },
    scene: {
      id: "scene1",
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
    },
    effectiveWorldState: { worldStateId: "ws1", eraId: "e1650", label: "1650s Red River" },
    place: { id: "pl1", name: "P", description: null },
    participatingPeople: [],
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

describe("prose realism cluster 5", () => {
  it("derives a realism layer with prompt lines and profile seed", () => {
    const input = minimalSceneGenerationInput();
    const layer = new ProseRealismDerivationService().derive(input);
    assert.equal(layer.clusterTag, "cluster5_prose_realism");
    assert.ok(layer.promptInstructionLines.some((l) => l.includes("PROSE_REALISM_CLUSTER5")));
    assert.ok(layer.profileSeed.realismScore > 0);
  });

  it("includes PROSE_REALISM_CLUSTER5 in compact prompt lines when layer present", () => {
    const input = minimalSceneGenerationInput({
      proseRealismLayer: new ProseRealismDerivationService().derive(minimalSceneGenerationInput()),
    });
    const block = compactProseRealismLines(input);
    assert.ok(block?.includes("PROSE_REALISM_CLUSTER5"));
  });

  it("changes canonical hash when proseRealismLayer is attached", () => {
    const base = minimalSceneGenerationInput();
    const withLayer = {
      ...base,
      proseRealismLayer: new ProseRealismDerivationService().derive(base),
    };
    assert.notEqual(computeSceneGenerationInputHash(base, null), computeSceneGenerationInputHash(withLayer, null));
  });

  it("flags anti-mechanical repetition and invalidates visibly system-driven template prose", () => {
    const mech = new AntiMechanicalProseValidationService();
    const bad =
      "It was a quiet morning. It was a still morning. She felt anxious about what it meant. The structured facts were clear.";
    const r = mech.evaluate(bad);
    assert.ok(r.antiMechanicalScore < 1);
    assert.ok(r.flags.length > 0);
    assert.equal(r.sceneOutputInvalid, true);
    assert.ok(r.invalidationReasons.length > 0);
  });

  it("hard-fails modern cognition snippets in validation", () => {
    const pre = minimalSceneGenerationInput();
    const layer = new ProseRealismDerivationService().derive(pre);
    const bundle = new ProseRealismValidationService().validate({
      sceneId: pre.contract.scene.id,
      generatedText: "She processed her trauma response before breakfast.",
      sceneGenerationInput: pre,
      preGenerationProfile: layer.profileSeed,
    });
    assert.ok(bundle.driftReport.hardFailures.some((h) => h.startsWith("modern_cognition")));
    assert.equal(bundle.realismTruth.canonicalSceneGenerationObserved, true);
    assert.equal(bundle.realismTruth.sceneOutputValidUnderRealismRules, false);
  });

  it("marks realism truth satisfied only when canonical validation passes", () => {
    const pre = minimalSceneGenerationInput();
    const layer = new ProseRealismDerivationService().derive(pre);
    const bundle = new ProseRealismValidationService().validate({
      sceneId: pre.contract.scene.id,
      generatedText:
        "The river mud clung to her boots. Smoke threaded the cold air; she said nothing and kept walking.",
      sceneGenerationInput: pre,
      preGenerationProfile: layer.profileSeed,
    });
    assert.equal(bundle.realismTruth.sceneOutputValidUnderRealismRules, true);
    assert.equal(bundle.realismTruth.invalidationReasons.length, 0);
  });

  it("surfaces prose realism cockpit panel from governance", () => {
    const panel = buildProseRealismCockpitPanelFromGovernance({
      chapterId: "ch1",
      proseConstraints: null,
      narratorPresencePack: null,
      epicEmotionalGravityPack: null,
    });
    assert.equal(panel.chapterId, "ch1");
    assert.ok(panel.recommendedRefinementTargets.length > 0);
  });
});
