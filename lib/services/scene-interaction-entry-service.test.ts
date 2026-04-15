/**
 * P2-Y scene-linked interaction entry. Run: npx tsx --test lib/services/scene-interaction-entry-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import { openSceneCharacterInteraction } from "@/lib/services/scene-interaction-entry-service";

const READER = "p2y-scene-entry-test-reader";

function isSchemaDriftError(e: unknown): boolean {
  return /does not exist in the current database/i.test(String(e));
}

describe("openSceneCharacterInteraction", () => {
  it("throws on empty sceneId, characterId, or readerId", async () => {
    await assert.rejects(
      () =>
        openSceneCharacterInteraction({
          sceneId: "",
          characterId: "x",
          readerId: "y",
        }),
      /sceneId/
    );
    await assert.rejects(
      () =>
        openSceneCharacterInteraction({
          sceneId: "s",
          characterId: "",
          readerId: "y",
        }),
      /characterId/
    );
    await assert.rejects(
      () =>
        openSceneCharacterInteraction({
          sceneId: "s",
          characterId: "x",
          readerId: "  ",
        }),
      /readerId/
    );
  });

  it("throws when scene does not exist", async () => {
    await assert.rejects(
      () =>
        openSceneCharacterInteraction({
          sceneId: "nonexistent-scene-id-xyz-12345",
          characterId: "any",
          readerId: READER,
        }),
      /Scene not found/
    );
  });
});

describe("openSceneCharacterInteraction (integration)", () => {
  let enabled = false;
  let sceneId = "";
  let characterInCast = "";
  let characterNotInCast = "";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      let scene = await prisma.scene.findFirst({
        where: { persons: { some: {} } },
        select: {
          id: true,
          persons: { select: { id: true } },
        },
      });
      if (!scene) {
        const anyScene = await prisma.scene.findFirst({ select: { id: true } });
        const anyPerson = await prisma.person.findFirst({ select: { id: true } });
        if (!anyScene || !anyPerson) return;
        await prisma.scene.update({
          where: { id: anyScene.id },
          data: { persons: { connect: { id: anyPerson.id } } },
        });
        scene = await prisma.scene.findUniqueOrThrow({
          where: { id: anyScene.id },
          select: { id: true, persons: { select: { id: true } } },
        });
      }
      if (!scene.persons.length) return;

      sceneId = scene.id;
      characterInCast = scene.persons[0]!.id;

      const castSet = new Set(scene.persons.map((p) => p.id));
      const outsider = await prisma.person.findFirst({
        where: { id: { notIn: [...castSet] } },
        select: { id: true },
      });
      if (!outsider) return;
      characterNotInCast = outsider.id;

      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled || !sceneId) return;
    try {
      await prisma.characterConversationSession.deleteMany({
        where: { readerId: READER },
      });
    } catch {
      /* best-effort / table may be missing */
    }
  });

  it("returns scene-aware snapshot, P2-E sources array, and a conversation session", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Scene, Person");
      return;
    }

    let out: Awaited<ReturnType<typeof openSceneCharacterInteraction>>;
    try {
      out = await openSceneCharacterInteraction({
        sceneId,
        characterId: characterInCast,
        readerId: READER,
      });
    } catch (e) {
      if (isSchemaDriftError(e)) {
        assert.ok(true, "skip: Prisma schema not applied to database");
        return;
      }
      throw e;
    }

    assert.equal(out.conversationalIdentitySnapshot.sceneId, sceneId);
    assert.equal(out.conversationalIdentitySnapshot.characterId, characterInCast);
    assert.equal(out.characterConversationSession.sceneId, sceneId);
    assert.equal(out.characterConversationSession.readerId, READER);
    assert.ok(Array.isArray(out.narrativeSourcesForScene));
    assert.equal(out.sourceIdsUsed.length, out.narrativeSourcesForScene.length);
    assert.equal(out.narrativeEmergenceBundle.mode, "scene_mode");
    assert.equal(out.narrativeEmergenceBundle.channel, "canonical_dyad");
    assert.ok(out.narrativeEmergenceBundle.storylineGuidance);
    assert.equal(out.narrativeEmergenceBundle.storylineGuidance?.mode, "scene_mode");
    assert.ok((out.narrativeEmergenceBundle.storylineGuidance?.activeArcPriorities.length ?? 0) <= 5);
    assert.ok(out.conversationalIdentitySnapshot.sessionContext?.sessionId);
    assert.equal(
      out.conversationalIdentitySnapshot.sessionContext?.sessionId,
      out.characterConversationSession.id
    );
    assert.equal(out.sceneCastValidation.characterPresentInSceneCast, true);
  });

  it("reuses ACTIVE session when scene matches", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Scene, Person");
      return;
    }

    let first: Awaited<ReturnType<typeof openSceneCharacterInteraction>>;
    let second: Awaited<ReturnType<typeof openSceneCharacterInteraction>>;
    try {
      first = await openSceneCharacterInteraction({
        sceneId,
        characterId: characterInCast,
        readerId: READER,
      });
      second = await openSceneCharacterInteraction({
        sceneId,
        characterId: characterInCast,
        readerId: READER,
      });
    } catch (e) {
      if (isSchemaDriftError(e)) {
        assert.ok(true, "skip: Prisma schema not applied to database");
        return;
      }
      throw e;
    }
    assert.equal(second.characterConversationSession.id, first.characterConversationSession.id);
  });

  it("throws when scene has cast and character is not in cast", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Scene, Person");
      return;
    }
    if (characterInCast === characterNotInCast) {
      assert.ok(true, "skip: need two distinct persons");
      return;
    }

    try {
      await assert.rejects(
        () =>
          openSceneCharacterInteraction({
            sceneId,
            characterId: characterNotInCast,
            readerId: READER,
          }),
        /not linked to scene/
      );
    } catch (e) {
      if (isSchemaDriftError(e)) {
        assert.ok(true, "skip: Prisma schema not applied to database");
        return;
      }
      throw e;
    }
  });
});
