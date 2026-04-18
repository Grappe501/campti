/**
 * Scene research relevance — pure classification (node:test).
 * Run: npx tsx --test lib/domain/scene-research-relevance.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canonRelevance, classifyTargetRelevance, groupAcceptedCanonByTargetType } from "@/lib/domain/scene-research-relevance";

describe("classifyTargetRelevance", () => {
  it("prefers direct scene link over chapter", () => {
    const r = classifyTargetRelevance({
      linkedSceneIds: ["s1"],
      linkedChapterIds: ["c1"],
      linkedPersonIds: [],
      linkedPlaceIds: [],
      sceneId: "s1",
      chapterId: "c1",
      personIds: [],
      placeIds: [],
    });
    assert.equal(r.primary, "direct_scene_link");
  });

  it("uses chapter when scene not linked", () => {
    const r = classifyTargetRelevance({
      linkedSceneIds: [],
      linkedChapterIds: ["c9"],
      linkedPersonIds: [],
      linkedPlaceIds: [],
      sceneId: "s1",
      chapterId: "c9",
      personIds: [],
      placeIds: [],
    });
    assert.equal(r.primary, "chapter_link");
  });

  it("uses person link when scene/chapter miss", () => {
    const r = classifyTargetRelevance({
      linkedSceneIds: [],
      linkedChapterIds: [],
      linkedPersonIds: ["p77"],
      linkedPlaceIds: [],
      sceneId: "s1",
      chapterId: "c1",
      personIds: ["p77"],
      placeIds: [],
    });
    assert.equal(r.primary, "person_link");
  });

  it("does not invent person link when person not in scene list", () => {
    const r = classifyTargetRelevance({
      linkedSceneIds: [],
      linkedChapterIds: [],
      linkedPersonIds: ["p99"],
      linkedPlaceIds: [],
      sceneId: "s1",
      chapterId: "c1",
      personIds: ["p77"],
      placeIds: [],
    });
    assert.equal(r.primary, "explicit_topic_link");
  });
});

describe("canonRelevance", () => {
  it("classifies scene-targeted active canon", () => {
    const x = canonRelevance({ targetType: "scene", targetId: "s1" }, "s1", "c1");
    assert.equal(x.r, "accepted_scene_canon");
  });

  it("classifies chapter canon", () => {
    const x = canonRelevance({ targetType: "chapter", targetId: "c1" }, "s1", "c1");
    assert.equal(x.r, "accepted_chapter_canon");
  });
});

describe("groupAcceptedCanonByTargetType", () => {
  it("groups and sorts target types", () => {
    const g = groupAcceptedCanonByTargetType([
      { targetType: "person", canonRecordId: "a" },
      { targetType: "scene", canonRecordId: "b" },
      { targetType: "person", canonRecordId: "c" },
    ] as { targetType: string; canonRecordId: string }[]);
    assert.equal(g.length, 2);
    assert.equal(g[0]!.targetType, "person");
    assert.equal(g[0]!.items.length, 2);
    assert.equal(g[1]!.targetType, "scene");
  });
});
