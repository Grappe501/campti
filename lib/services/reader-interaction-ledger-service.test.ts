/**
 * P2-V reader interaction ledger (integration, optional DB).
 * Run: npx tsx --test lib/services/reader-interaction-ledger-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  createConversationSession,
} from "@/lib/services/character-conversation-session-service";
import {
  createLedgerEntry,
  listLedgerEntriesForReader,
  summarizeLedgerForSession,
} from "@/lib/services/reader-interaction-ledger-service";

const READER = "p2v-ledger-test-reader";

describe("reader-interaction-ledger-service (integration)", () => {
  let enabled = false;
  let characterId = "";
  let sessionId = "";

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
        await prisma.readerInteractionLedgerEntry.deleteMany({
          where: { readerId: READER },
        });
      } catch {
        /* table may not exist until migration is applied */
      }
      await prisma.characterConversationSession.deleteMany({
        where: { readerId: READER },
      });
      const s = await createConversationSession({
        characterId,
        readerId: READER,
      });
      sessionId = s.id;
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.readerInteractionLedgerEntry.deleteMany({ where: { readerId: READER } });
      await prisma.characterConversationSession.deleteMany({ where: { readerId: READER } });
    } catch {
      /* best-effort */
    }
  });

  it("createLedgerEntry + listLedgerEntriesForReader + summarizeLedgerForSession", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }

    const a = await createLedgerEntry({
      readerId: READER,
      sessionId,
      entryType: "text_turn",
      unitCount: 120,
      estimatedCostUnits: 12,
      metadataJson: { model: "stub" },
    });
    assert.equal(a.readerId, READER);
    assert.equal(a.sessionId, sessionId);
    assert.equal(a.entryType, "text_turn");
    assert.equal(a.unitCount, 120);

    await createLedgerEntry({
      readerId: READER,
      sessionId,
      entryType: "voice_render",
      unitCount: 1,
      estimatedCostUnits: 50,
    });

    const listed = await listLedgerEntriesForReader({ readerId: READER, limit: 10 });
    assert.ok(listed.length >= 2);

    const forSession = await listLedgerEntriesForReader({
      readerId: READER,
      sessionId,
      limit: 20,
    });
    assert.equal(forSession.length, 2);

    const sum = await summarizeLedgerForSession(sessionId);
    assert.ok(sum);
    assert.equal(sum!.sessionId, sessionId);
    assert.equal(sum!.entryCount, 2);
    assert.equal(sum!.totalUnitCount, 121);
    assert.equal(sum!.totalEstimatedCostUnits, 62);
    assert.equal(sum!.byEntryType.text_turn?.entryCount, 1);
    assert.equal(sum!.byEntryType.voice_render?.estimatedCostUnits, 50);
  });

  it("createLedgerEntry rejects session reader mismatch", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    await assert.rejects(
      () =>
        createLedgerEntry({
          readerId: "other-reader",
          sessionId,
          entryType: "other",
          unitCount: 1,
          estimatedCostUnits: 1,
        }),
      /readerId/
    );
  });
});
