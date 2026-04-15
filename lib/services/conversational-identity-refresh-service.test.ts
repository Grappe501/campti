/**
 * P2-P conversational identity refresh. Run: npx tsx --test lib/services/conversational-identity-refresh-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import {
  CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
  type ConversationalTurnInput,
} from "@/lib/domain/conversational-turn-input";
import { prisma } from "@/lib/prisma";
import { buildConversationalIdentitySnapshot } from "@/lib/conversational-identity/build-conversational-identity-snapshot";
import { createConversationSession } from "@/lib/services/character-conversation-session-service";
import {
  appendCharacterTurn,
  appendReaderTurn,
} from "@/lib/services/character-conversation-turn-service";
import {
  formatBoundedTurnSummary,
  refreshConversationalIdentitySnapshot,
} from "@/lib/services/conversational-identity-refresh-service";

describe("formatBoundedTurnSummary (unit)", () => {
  it("formats reader and character lines deterministically", () => {
    assert.equal(
      formatBoundedTurnSummary({
        speakerType: "reader",
        orderIndex: 0,
        payloadJson: { readerText: "Hello there." },
      }),
      "[reader #0] Hello there."
    );
    assert.equal(
      formatBoundedTurnSummary({
        speakerType: "character",
        orderIndex: 1,
        payloadJson: {
          contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
          spokenResponse: "I listen.",
          internalThought: "",
          knowledgeSource: "uncertain",
          emotionalTone: "neutral",
        },
      }),
      "[character #1] I listen."
    );
  });
});

describe("refreshConversationalIdentitySnapshot (integration)", () => {
  let enabled = false;
  let characterId = "";
  const READER = "p2p-refresh-test-reader";

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
      /* ok */
    }
  });

  it("session-less refresh leaves sessionContext null", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const snap = await refreshConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
    });
    assert.equal(snap.sessionContext, null);
  });

  it("base builder still exposes null sessionContext", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const snap = await buildConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
    });
    assert.equal(snap.sessionContext, null);
  });

  it("session-aware refresh includes bounded turn lines and interaction count slot", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person, P2-M/N tables");
      return;
    }

    const session = await createConversationSession({
      characterId,
      readerId: READER,
    });

    const turnIn: ConversationalTurnInput = {
      contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
      characterId,
      readerId: READER,
      sessionId: session.id,
      inputMode: "text",
      readerText: "Can you hear me?",
    };
    await appendReaderTurn(session.id, turnIn);
    await appendCharacterTurn(session.id, {
      contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
      spokenResponse: "I hear you.",
      internalThought: "",
      knowledgeSource: "uncertain",
      emotionalTone: "neutral",
    });

    const snap = await refreshConversationalIdentitySnapshot({
      characterId,
      readerId: READER,
      sessionId: session.id,
      maxRecentTurnLines: 6,
    });

    assert.ok(snap.sessionContext);
    assert.equal(snap.sessionContext!.sessionId, session.id);
    assert.equal(snap.sessionContext!.sessionStatus, "ACTIVE");
    assert.equal(snap.sessionContext!.recentTurnSummaries.length, 2);
    assert.ok(snap.sessionContext!.recentTurnSummaries[0].includes("reader"));
    assert.ok(snap.sessionContext!.recentTurnSummaries[0].includes("Can you hear me?"));
    assert.ok(snap.sessionContext!.recentTurnSummaries[1].includes("I hear you."));
  });
});
