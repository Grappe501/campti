/**
 * Cluster 9 — final execution package, readiness, persistence hydration assumptions (node:test).
 * Run: npx tsx --test lib/services/cluster9-final-execution.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import {
  buildCanonicalSceneGenerationHashInputV1,
  computeSceneGenerationInputHash,
} from "@/lib/scene-generation/canonical-scene-generation-hash";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";
import {
  buildRehearsalStubFinalExecutionPackage,
  buildFinalExecutionPackage,
} from "@/lib/services/final-execution-package-service";
import { buildFinalReadinessScorecard } from "@/lib/services/final-readiness-scorecard-service";
import { summarizeCharacterSimulationProfileTruth } from "@/lib/services/character-simulation-author-bundle-load-service";

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
    participatingPeople: [{ id: "p1", name: "Alex", description: null, birthYear: null, deathYear: null }],
    genealogicalAssertions: [],
    worldStateReference: null,
    beatPlan: [],
    continuityNotes: [],
    privateNotes: null,
  };
}

function minimalInput(overrides: Partial<SceneGenerationInput> = {}): SceneGenerationInput {
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

describe("Cluster 9 character simulation profile truth", () => {
  it("classifies deterministic-only when no persisted rows", () => {
    assert.equal(summarizeCharacterSimulationProfileTruth(["a", "b"], {}), "deterministic_seed_only");
  });

  it("classifies persisted when all participants have payload", () => {
    const map = {
      a: { mindPartial: { coreDesire: "x" } },
      b: { voicePartial: { metaphorDomain: "weather" } },
    };
    assert.equal(summarizeCharacterSimulationProfileTruth(["a", "b"], map), "persisted_author");
  });

  it("classifies mixed when only some participants have payload", () => {
    const map = { a: { mindPartial: { coreDesire: "x" } } };
    assert.equal(summarizeCharacterSimulationProfileTruth(["a", "b"], map), "mixed");
  });
});

describe("Cluster 9 CharacterMindSeedService merge", () => {
  it("overlays persisted partial onto deterministic seed", () => {
    const svc = new CharacterMindSeedService();
    const base = svc.buildMindProfile({ characterId: "p1", displayLabel: "Pat" });
    const merged = svc.mergeMindProfile(base, { coreDesire: "Author-owned desire line." });
    assert.equal(merged.coreDesire, "Author-owned desire line.");
    assert.equal(merged.characterId, "p1");
    assert.ok(merged.fearProfile.primaryFearId.length > 0);
  });
});

describe("Cluster 9 final execution package integrity", () => {
  it("rehearsal stub is internally consistent", () => {
    const pkg = buildRehearsalStubFinalExecutionPackage({
      executionId: "e1",
      sceneId: "s1",
      chapterId: "c1",
      profileTruth: "deterministic_seed_only",
      rehearsalNotes: ["note:a"],
    });
    assert.equal(pkg.readinessStatus, "rehearsal_incomplete");
    assert.equal(pkg.characterSimulationProfileTruth, "deterministic_seed_only");
    const sc = buildFinalReadinessScorecard({ executionPackage: pkg });
    assert.equal(sc.canonicalRuntimeReady, false);
  });
});

describe("Cluster 9 canonical hash persistence field", () => {
  it("includes persistedCharacterSimulationProfiles when present", () => {
    const a = minimalInput({
      persistedCharacterSimulationProfiles: {
        p1: { mindPartial: { coreDesire: "one" } },
      },
    });
    const b = minimalInput({
      persistedCharacterSimulationProfiles: {
        p1: { mindPartial: { coreDesire: "two" } },
      },
    });
    const ha = computeSceneGenerationInputHash(a, null);
    const hb = computeSceneGenerationInputHash(b, null);
    assert.notEqual(ha, hb);
    const payload = buildCanonicalSceneGenerationHashInputV1(a, null);
    assert.ok("persistedCharacterSimulationProfiles" in payload);
  });
});

describe("Cluster 9 final execution package from mocked run", () => {
  it("maps cluster7 envelope fields without throwing", async () => {
    const { buildCluster7RuntimeTruthEnvelope } = await import("@/lib/services/cluster7-runtime-truth-service");
    const run = {
      output: {
        contractVersion: "1" as const,
        generatedText: "x",
        generationNotes: "n",
        warnings: [],
        continuityFlags: [],
        advisoryOnly: true as const,
      },
      savedGenerationText: false,
      registeredDependencyIds: [] as string[],
      canonicalPreGeneration: { governanceMergeApplied: true } as import("@/lib/domain/canonical-scene-generation-governance").CanonicalPreGenerationBundle,
      characterSimulationRuntime: null,
      characterSimulationValidation: null,
      humanGravityRuntime: null,
      humanGravityValidation: null,
      humanGravityTruth: null,
      proseRealism: null,
      realismTruth: null,
    };
    const c7 = buildCluster7RuntimeTruthEnvelope({
      runId: "r1",
      sceneId: "scene1",
      sceneGenerationInputHash: "abc",
      applyCanonicalNarrativeGovernance: true,
      saveGenerationTextRequested: false,
      allowSaveOnInvalidRealism: false,
      allowSaveOnInvalidHumanGravity: false,
      run,
    });
    const pkg = buildFinalExecutionPackage({
      executionId: "ex",
      runtimeId: c7.canonicalArtifact.runtimeId,
      sceneId: "scene1",
      chapterId: "ch1",
      run: { ...run, cluster7RuntimeTruth: c7 },
      profileTruth: "persisted_author",
    });
    assert.ok(pkg.canonicalArtifactIds.length >= 0);
    assert.ok(pkg.sceneRunIds.includes(c7.runId));
  });
});
