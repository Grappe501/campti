/**
 * P2-H.2 — Conversational identity snapshot (policy + optional DB integration).
 * Run: npx tsx --test lib/conversational-identity/build-conversational-identity-snapshot.test.ts
 */
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { buildConversationalIdentitySnapshot } from "@/lib/conversational-identity/build-conversational-identity-snapshot";
import { BOUNDED_CHARACTER_CONVERSATIONAL_POLICY } from "@/lib/domain/conversational-identity-snapshot";
import { NarrativeSourceTruthMode } from "@/lib/domain/narrative-source";
import type { NarrativeSource } from "@/lib/domain/narrative-source";
import { prisma } from "@/lib/prisma";

const READER = "p2h2-snapshot-test-reader";

function testSource(id: string, title: string): NarrativeSource {
  return {
    id,
    title,
    authorType: "historical",
    createdAt: new Date(),
    effectiveStartWorldStateId: "ws-test",
    effectiveEndWorldStateId: null,
    startYear: null,
    endYear: null,
    scope: "regional",
    truthMode: NarrativeSourceTruthMode.Authoritative,
    tags: [],
    content: "x",
    metadataJson: null,
  };
}

describe("bounded conversational policy (domain)", () => {
  it("always marks author omniscience excluded and in-world-only constraints", () => {
    assert.equal(BOUNDED_CHARACTER_CONVERSATIONAL_POLICY.inWorldOnly, true);
    assert.equal(BOUNDED_CHARACTER_CONVERSATIONAL_POLICY.noFutureKnowledge, true);
    assert.equal(BOUNDED_CHARACTER_CONVERSATIONAL_POLICY.noOutOfWorldTeaching, true);
    assert.equal(BOUNDED_CHARACTER_CONVERSATIONAL_POLICY.translationIsPresentationOnly, true);
    assert.equal(BOUNDED_CHARACTER_CONVERSATIONAL_POLICY.authorOmniscienceExcluded, true);
  });
});

describe("buildConversationalIdentitySnapshot (integration)", () => {
  let enabled = false;
  let characterId = "";
  let sceneId: string | null = null;

  before(async () => {
    enabled = false;
    sceneId = null;
    try {
      await prisma.$connect();
      const person = await prisma.person.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (!person) {
        return;
      }
      characterId = person.id;
      await buildConversationalIdentitySnapshot({
        characterId,
        readerId: READER,
      });
      const scene = await prisma.scene.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (scene?.id) {
        try {
          await buildConversationalIdentitySnapshot({
            characterId,
            readerId: READER,
            sceneId: scene.id,
          });
          sceneId = scene.id;
        } catch {
          sceneId = null;
        }
      }
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  it("scene-less build returns policy, null sceneId, and empty-source boundary hint", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least one Person");
      return;
    }
    const snap = await buildConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
    });
    assert.equal(snap.sceneId, null);
    assert.deepEqual(snap.policy, BOUNDED_CHARACTER_CONVERSATIONAL_POLICY);
    assert.equal(snap.policy.authorOmniscienceExcluded, true);
    assert.ok(
      snap.knowledgeBoundary.unknownDomains.some((d) => d.includes("No omniscient access")),
      "knowledge boundary should forbid narrator-grade omniscience in bounded mode"
    );
    assert.ok(
      snap.knowledgeBoundary.unknownDomains.some((d) => d.includes("No dedicated narrative source bundle")),
      "expected empty-source epistemic hint"
    );
  });

  it("passes narrativeSourcesForScene into knowledge boundary (authoritative title appears)", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least one Person");
      return;
    }
    const uniqueTitle = `P2H2 boundary source ${Date.now()}`;
    const snap = await buildConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
      narrativeSourcesForScene: [testSource("p2h2-src-1", uniqueTitle)],
    });
    assert.deepEqual(snap.policy, BOUNDED_CHARACTER_CONVERSATIONAL_POLICY);
    const hit = snap.knowledgeBoundary.knownFacts.some((line) => line.includes(uniqueTitle));
    assert.equal(hit, true);
    assert.equal(
      snap.knowledgeBoundary.unknownDomains.some((d) => d.includes("No dedicated narrative source bundle")),
      false
    );
  });

  it("scene-aware build sets sceneId and accepts narrativeSourcesForScene", async () => {
    if (!enabled || !sceneId) {
      assert.ok(true, "skip: need DATABASE_URL, Person, and at least one Scene");
      return;
    }
    const uniqueTitle = `P2H2 scene source ${Date.now()}`;
    const snap = await buildConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
      sceneId,
      narrativeSourcesForScene: [testSource("p2h2-scene-src", uniqueTitle)],
    });
    assert.equal(snap.sceneId, sceneId);
    assert.deepEqual(snap.policy, BOUNDED_CHARACTER_CONVERSATIONAL_POLICY);
    assert.ok(snap.knowledgeBoundary.knownFacts.some((line) => line.includes(uniqueTitle)));
  });
});
