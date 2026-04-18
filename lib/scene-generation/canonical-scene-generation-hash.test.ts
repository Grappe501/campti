/**
 * Canonical scene generation hash — stability & sensitivity (node:test).
 * Run: npx tsx --test lib/scene-generation/canonical-scene-generation-hash.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { HierarchyShapingResolution } from "@/lib/domain/narrative-shaping-defaults";

import {
  buildCanonicalSceneGenerationHashInputV1,
  computeSceneGenerationInputHash,
  hashCanonicalSceneGenerationHashInput,
  SCENE_GENERATION_HASH_SCHEME_V1,
  serializeCanonicalSceneGenerationHashInput,
  sha256Utf8Hex,
  stableDeepSort,
} from "@/lib/scene-generation/canonical-scene-generation-hash";

function minimalContract(): SceneGenerationContractV1 {
  return {
    contractVersion: "1",
    epic: { id: "epic1", title: "E", summary: null, metadataJson: {} },
    book: { id: "book1", movementIndex: 0, title: "B", readerFacingTitle: null, summary: null },
    chapter: {
      id: "ch1",
      title: "C",
      summary: null,
      sequenceInBook: 1,
      chapterNumber: 1,
    },
    scene: {
      id: "scene1",
      description: "d",
      summary: null,
      narrativeIntent: null,
      emotionalTone: null,
      orderInChapter: 1,
      writingMode: "STRUCTURED",
      historicalAnchor: null,
      locationNote: null,
      pov: null,
      structuredDataJson: {},
    },
    effectiveWorldState: { worldStateId: "ws1", eraId: null, label: "era" },
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
    historicalAnchorTerms: [],
    proseQaContext: {},
    sourceIdsUsed: [],
    ...overrides,
  };
}

describe("stableDeepSort", () => {
  it("normalizes key order without changing semantics", () => {
    const a = { z: 1, a: 2, m: { y: 1, b: 2 } };
    const b = { a: 2, m: { b: 2, y: 1 }, z: 1 };
    assert.equal(
      JSON.stringify(stableDeepSort(a)),
      JSON.stringify(stableDeepSort(b))
    );
  });

  it("preserves array order", () => {
    const x = stableDeepSort({ lines: ["b", "a"] }) as { lines: string[] };
    assert.deepEqual(x.lines, ["b", "a"]);
  });
});

describe("computeSceneGenerationInputHash", () => {
  it("same inputs produce same hash", () => {
    const input = minimalSceneGenerationInput();
    const h1 = computeSceneGenerationInputHash(input, null);
    const h2 = computeSceneGenerationInputHash(input, null);
    assert.equal(h1, h2);
    assert.equal(h1.length, 64);
  });

  it("changing merged narrative shaping changes hash", () => {
    const base = minimalSceneGenerationInput();
    const withShaping = minimalSceneGenerationInput({
      narrativeShapingResolution: {
        contractVersion: "1",
        sceneId: "scene1",
        epicId: "e",
        bookId: "b",
        chapterId: "c",
        merged: { shapingNotes: "alpha" },
        fieldSources: {},
        layers: { epic: null, book: null, chapter: null, scene: null },
        resolvedAtIso: "2020-01-01T00:00:00.000Z",
      } satisfies HierarchyShapingResolution,
    });
    assert.notEqual(computeSceneGenerationInputHash(base, null), computeSceneGenerationInputHash(withShaping, null));
  });

  it("fieldSources-only change does not change hash when merged unchanged", () => {
    const res1: HierarchyShapingResolution = {
      contractVersion: "1",
      sceneId: "scene1",
      epicId: "e",
      bookId: "b",
      chapterId: "c",
      merged: { shapingNotes: "same" },
      fieldSources: { "shapingNotes": "epic" },
      layers: { epic: null, book: null, chapter: null, scene: null },
      resolvedAtIso: "2020-01-01T00:00:00.000Z",
    };
    const res2: HierarchyShapingResolution = {
      ...res1,
      fieldSources: { "shapingNotes": "scene" },
      resolvedAtIso: "2030-01-01T00:00:00.000Z",
    };
    const a = minimalSceneGenerationInput({ narrativeShapingResolution: res1 });
    const b = minimalSceneGenerationInput({ narrativeShapingResolution: res2 });
    assert.equal(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("changing contract social bundle changes hash", () => {
    const a = minimalSceneGenerationInput();
    const c = minimalContract();
    const b = minimalSceneGenerationInput({
      contract: {
        ...c,
        socialFieldGeneration: {
          contractVersion: "1",
          pressureIntensityScore: 0.2,
          socialFieldSummaryForGeneration: "x",
          invisiblePressureSummary: "",
          witnessRiskSummary: "",
          gossipRiskSummary: "",
          authorityAtmosphereSummary: "",
          kinVisibilitySummary: "",
          householdDensityHint: "",
          nearbyPopulationHint: "",
        },
      },
    });
    assert.notEqual(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("changing cognition frame payload changes hash", () => {
    const a = minimalSceneGenerationInput();
    const b = minimalSceneGenerationInput({
      cognitionFramePayload: { contractVersion: "cognition-frame-v6", x: 1 },
    });
    assert.notEqual(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("socialFieldQaScalars change does not change hash (not in prompt)", () => {
    const a = minimalSceneGenerationInput();
    const b = minimalSceneGenerationInput({
      socialFieldQaScalars: {
        witnessRisk01: 0.5,
        gossipRisk01: 0.1,
        authorityPressure01: 0.2,
      },
    });
    assert.equal(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("basis prose digest changes hash when non-null", () => {
    const input = minimalSceneGenerationInput({
      generationMode: "rewrite",
      generationPurpose: "prose_rewrite",
    });
    const h1 = computeSceneGenerationInputHash(input, "hello");
    const h2 = computeSceneGenerationInputHash(input, "hello!");
    assert.notEqual(h1, h2);
  });

  it("changing narrative source ids changes hash", () => {
    const a = minimalSceneGenerationInput({ sourceIdsUsed: [] });
    const b = minimalSceneGenerationInput({ sourceIdsUsed: ["nsrc_1"] });
    assert.notEqual(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("changing canonical pre-generation bundle changes hash", () => {
    const a = minimalSceneGenerationInput();
    const b = minimalSceneGenerationInput({
      canonicalPreGeneration: { contractVersion: "1", governanceMergeApplied: true } as SceneGenerationInput["canonicalPreGeneration"],
    });
    assert.notEqual(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });

  it("changing character simulation runtime changes hash", () => {
    const a = minimalSceneGenerationInput();
    const b = minimalSceneGenerationInput({
      characterSimulationRuntime: {
        contractVersion: "1",
        clusterTag: "cluster8_character_simulation_runtime",
        sceneId: "scene1",
        chapterId: "ch1",
        mindProfiles: [],
        cognitiveStates: [],
        voiceProfiles: [],
        voiceStates: [],
        relationshipProfiles: [],
        relationshipStates: [],
        sceneEmergenceDigest: {
          sceneId: "scene1",
          sceneNecessityReasons: ["x"],
          conflictSources: ["y"],
          povCandidates: [{ personId: "p1", weight: 1, rationale: "r" }],
          scenePurposeFromPressure: "purpose",
          dominantPressureIds: ["d1"],
          validationFlags: [],
        },
        constraintFlags: [],
        evolutionStamp: { sceneOrderIndex: 0, residueNotes: [], noResetAligned: true },
        promptInstructionLines: ["line-a"],
        validationFlags: [],
      } as SceneGenerationInput["characterSimulationRuntime"],
    });
    assert.notEqual(computeSceneGenerationInputHash(a, null), computeSceneGenerationInputHash(b, null));
  });
});

describe("serializeCanonicalSceneGenerationHashInput", () => {
  it("is stable under object key insertion order for payload", () => {
    const input = minimalSceneGenerationInput();
    const p1 = buildCanonicalSceneGenerationHashInputV1(input, null);
    const p2 = buildCanonicalSceneGenerationHashInputV1(input, null);
    assert.equal(serializeCanonicalSceneGenerationHashInput(p1), serializeCanonicalSceneGenerationHashInput(p2));
    assert.equal(p1.sceneGenerationHashScheme, SCENE_GENERATION_HASH_SCHEME_V1);
  });
});

describe("hashCanonicalSceneGenerationHashInput", () => {
  it("matches sha256 of serialized canonical payload", () => {
    const input = minimalSceneGenerationInput();
    const p = buildCanonicalSceneGenerationHashInputV1(input, null);
    const expected = sha256Utf8Hex(serializeCanonicalSceneGenerationHashInput(p));
    assert.equal(hashCanonicalSceneGenerationHashInput(p), expected);
  });
});
