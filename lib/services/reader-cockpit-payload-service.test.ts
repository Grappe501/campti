/**
 * P3-A reader cockpit payload. Run: npx tsx --test lib/services/reader-cockpit-payload-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { READER_COCKPIT_PAYLOAD_CONTRACT_VERSION } from "@/lib/domain/reader-cockpit-payload";
import { NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION } from "@/lib/domain/narration-modes";
import { prisma } from "@/lib/prisma";
import { createConversationSession } from "@/lib/services/character-conversation-session-service";
import { buildReaderCockpitPayload } from "@/lib/services/reader-cockpit-payload-service";

const READER = "p3a-cockpit-test-reader";

describe("buildReaderCockpitPayload", () => {
  it("throws when readerId or characterId is empty", async () => {
    await assert.rejects(
      () => buildReaderCockpitPayload({ readerId: "", characterId: "c" }),
      /readerId/
    );
    await assert.rejects(
      () => buildReaderCockpitPayload({ readerId: "r", characterId: "  " }),
      /readerId/
    );
  });
});

describe("buildReaderCockpitPayload (integration)", () => {
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
      try {
        await prisma.characterConversationSession.deleteMany({
          where: { readerId: READER },
        });
      } catch {
        /* table may be missing */
      }
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

  it("assembles payload with session, policy, narration mode, and voice block", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }

    let session;
    try {
      session = await createConversationSession({
        characterId,
        readerId: READER,
        sceneId: null,
      });
    } catch {
      assert.ok(true, "skip: session table missing");
      return;
    }

    let out: Awaited<ReturnType<typeof buildReaderCockpitPayload>>;
    try {
      out = await buildReaderCockpitPayload({
        readerId: READER,
        characterId,
        sessionId: session.id,
      });
    } catch (e) {
      if (/does not exist in the current database/i.test(String(e))) {
        assert.ok(true, "skip: schema drift");
        return;
      }
      throw e;
    }

    assert.equal(out.contractVersion, READER_COCKPIT_PAYLOAD_CONTRACT_VERSION);
    assert.equal(out.readerId, READER);
    assert.equal(out.characterId, characterId);
    assert.ok(out.activeSession);
    assert.equal(out.activeSession!.sessionId, session.id);
    assert.ok(out.conversationalIdentitySummary);
    assert.ok(out.conversationalIdentitySummary!.personName.length > 0);
    assert.equal(out.policySummary?.inWorldOnly, true);
    assert.equal(out.costEstimateSummary.narrationMode, NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION);
    assert.ok(typeof out.voicePresentationReadiness.hasTtsVoiceAssignment === "boolean");
    assert.ok(Array.isArray(out.latestTranscriptTurns));
    assert.ok(out.degradedInteraction);
    assert.ok(typeof out.degradedInteraction!.freeTurnCount === "number");
  });

  it("returns null session slice when no active session and no sessionId", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }

    let out: Awaited<ReturnType<typeof buildReaderCockpitPayload>>;
    try {
      out = await buildReaderCockpitPayload({
        readerId: `${READER}-no-session`,
        characterId,
      });
    } catch (e) {
      if (/does not exist in the current database/i.test(String(e))) {
        assert.ok(true, "skip: schema drift");
        return;
      }
      throw e;
    }

    assert.equal(out.activeSession, null);
    assert.equal(out.conversationalIdentitySummary, null);
    assert.equal(out.policySummary, null);
    assert.deepEqual(out.latestTranscriptTurns, []);
    assert.ok(out.degradedInteraction);
    assert.equal(typeof out.degradedInteraction!.lastTurnUsedDegradedFallback, "boolean");
  });
});
