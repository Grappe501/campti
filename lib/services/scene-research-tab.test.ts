/**
 * Scene detail research tab — URL contracts, validation, honesty labels (node:test).
 * Run: npx tsx --test lib/services/scene-research-tab.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildResearchWorkbenchUrl, parseResearchWorkbenchUrlState } from "@/lib/domain/research-workbench-nav";
import {
  SceneResearchDecisionActionSchema,
  SceneResearchTabCreateTargetActionSchema,
} from "@/lib/domain/scene-research-tab-validation";

describe("research-workbench navigation", () => {
  it("builds stable scene + queue URLs", () => {
    const u = buildResearchWorkbenchUrl({ sceneId: "sc_1", queue: "contradictions" });
    assert.equal(u, "/admin/research?sceneId=sc_1&queue=contradictions");
  });

  it("parses round-trip search params", () => {
    const parsed = parseResearchWorkbenchUrlState({
      sceneId: "a",
      chapterId: "b",
      personId: "c",
      placeId: "d",
      queue: "open_claims",
    });
    assert.equal(parsed.sceneId, "a");
    assert.equal(parsed.chapterId, "b");
    assert.equal(parsed.personId, "c");
    assert.equal(parsed.placeId, "d");
    assert.equal(parsed.queue, "open_claims");
  });

  it("ignores invalid queue tokens", () => {
    const parsed = parseResearchWorkbenchUrlState({ queue: "nope" });
    assert.equal(parsed.queue, undefined);
  });
});

describe("SceneResearchDecisionActionSchema", () => {
  it("requires sceneId alongside workbench decision fields", () => {
    const bad = SceneResearchDecisionActionSchema.safeParse({
      sceneId: "",
      claimId: "c1",
      workbenchDecision: "accept",
      decisionReason: "because",
      canonTargetType: "scene",
      canonTargetId: "s1",
      knowledgeType: "ricre_research_claim",
      historicalRealityStatus: "likely_historical",
      storyRealityStatus: "accepted_story_canon",
    });
    assert.equal(bad.success, false);
  });
});

describe("SceneResearchTabCreateTargetActionSchema", () => {
  it("rejects sceneId / anchorSceneId mismatch", () => {
    const r = SceneResearchTabCreateTargetActionSchema.safeParse({
      sceneId: "scene-a",
      anchorSceneId: "scene-b",
      targetType: "scene",
      targetName: "Test",
      linkedSceneIds: ["scene-b"],
      linkedChapterIds: [],
      linkedBookIds: [],
      linkedCharacterIds: [],
      linkedSettingIds: [],
      linkedEraIds: [],
      linkedThreadIds: [],
    });
    assert.equal(r.success, false);
  });

  it("accepts aligned scene-tab create payload", () => {
    const r = SceneResearchTabCreateTargetActionSchema.safeParse({
      sceneId: "scene-a",
      anchorSceneId: "scene-a",
      targetType: "scene",
      targetName: "Test",
      linkedSceneIds: ["scene-a"],
      linkedChapterIds: ["ch1"],
      linkedBookIds: [],
      linkedCharacterIds: [],
      linkedSettingIds: [],
      linkedEraIds: [],
      linkedThreadIds: [],
    });
    assert.equal(r.success, true);
  });
});
