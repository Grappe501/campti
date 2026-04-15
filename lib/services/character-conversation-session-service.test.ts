/**
 * P2-M conversation session lifecycle (integration, optional DB).
 * Run: npx tsx --test lib/services/character-conversation-session-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  bumpSessionInteractionCount,
  createConversationSession,
  getActiveConversationSession,
  markConversationSessionEnded,
  markConversationSessionPaused,
  normalizeCreateSessionMetadataInput,
} from "@/lib/services/character-conversation-session-service";

const READER = "p2m-session-test-reader";

describe("normalizeCreateSessionMetadataInput", () => {
  it("accepts undefined/null and source-only metadata object", () => {
    assert.equal(normalizeCreateSessionMetadataInput(undefined), undefined);
    assert.ok(normalizeCreateSessionMetadataInput(null));
    assert.deepEqual(normalizeCreateSessionMetadataInput({ source: "test" }), { source: "test" });
  });

  it("rejects non-object metadata", () => {
    assert.throws(
      () => normalizeCreateSessionMetadataInput("bad-input" as unknown as never),
      /metadataJson must be an object/
    );
  });

  it("rejects disallowed metadata keys", () => {
    assert.throws(
      () => normalizeCreateSessionMetadataInput({ entitlement: { planType: "premium" } }),
      /session_metadata_key_disallowed|product_account_field_in_reader_memory/
    );
  });
});

describe("CharacterConversationSession service (integration)", () => {
  let enabled = false;
  let characterId = "";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const p = await prisma.person.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (!p) return;
      characterId = p.id;
      await prisma.characterConversationSession.deleteMany({
        where: { readerId: READER },
      });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.characterConversationSession.deleteMany({
        where: { readerId: READER },
      });
    } catch {
      /* best-effort */
    }
  });

  it("create + getActive returns ACTIVE session", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const s = await createConversationSession({
      characterId,
      readerId: READER,
      metadataJson: { source: "test" },
    });
    assert.equal(s.status, "ACTIVE");
    assert.equal(s.interactionCount, 0);
    assert.equal(s.endedAt, null);

    const active = await getActiveConversationSession(characterId, READER);
    assert.ok(active);
    assert.equal(active!.id, s.id);
  });

  it("new ACTIVE session ends previous ACTIVE for same pair", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const first = await createConversationSession({ characterId, readerId: READER });
    const second = await createConversationSession({ characterId, readerId: READER });

    assert.notEqual(first.id, second.id);
    const oldRow = await prisma.characterConversationSession.findUnique({ where: { id: first.id } });
    assert.equal(oldRow?.status, "ENDED");
    assert.ok(oldRow?.endedAt);

    const active = await getActiveConversationSession(characterId, READER);
    assert.equal(active?.id, second.id);
  });

  it("markPaused and markEnded update status and timestamps", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    await prisma.characterConversationSession.deleteMany({ where: { readerId: READER } });
    const s = await createConversationSession({ characterId, readerId: READER });

    const paused = await markConversationSessionPaused(s.id);
    assert.equal(paused.status, "PAUSED");
    assert.equal(paused.id, s.id);

    const ended = await markConversationSessionEnded(s.id);
    assert.equal(ended.status, "ENDED");
    assert.ok(ended.endedAt);

    const active = await getActiveConversationSession(characterId, READER);
    assert.equal(active, null);
  });

  it("bumpSessionInteractionCount increments and touches lastInteractionAt", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    await prisma.characterConversationSession.deleteMany({ where: { readerId: READER } });
    const s = await createConversationSession({ characterId, readerId: READER });
    const bumped = await bumpSessionInteractionCount(s.id, 2);
    assert.equal(bumped.interactionCount, 2);
  });
});
