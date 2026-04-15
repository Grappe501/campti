/**
 * P2-N turn transcript (integration, optional DB).
 * Run: npx tsx --test lib/services/character-conversation-turn-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import {
  CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
  type ConversationalTurnInput,
} from "@/lib/domain/conversational-turn-input";
import { prisma } from "@/lib/prisma";
import { createConversationSession } from "@/lib/services/character-conversation-session-service";
import {
  appendCharacterTurn,
  appendReaderTurn,
  listSessionTurnsOrdered,
} from "@/lib/services/character-conversation-turn-service";

const READER_A = "p2n-turn-test-reader-a";
const READER_B = "p2n-turn-test-reader-b";

function readerPayload(characterId: string, readerId: string, text: string): ConversationalTurnInput {
  return {
    contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
    characterId,
    readerId,
    inputMode: "text",
    readerText: text,
  };
}

describe("CharacterConversationTurn service (integration)", () => {
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
        where: { readerId: { in: [READER_A, READER_B] } },
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
        where: { readerId: { in: [READER_A, READER_B] } },
      });
    } catch {
      /* best-effort */
    }
  });

  it("orders turns by orderIndex and isolates sessions", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person, and migrated P2-M/P2-N tables");
      return;
    }

    const sA = await createConversationSession({ characterId, readerId: READER_A });
    const sB = await createConversationSession({ characterId, readerId: READER_B });

    await appendReaderTurn(sA.id, readerPayload(characterId, READER_A, "one"));
    await appendCharacterTurn(sA.id, {
      contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
      spokenResponse: "a1",
      internalThought: "",
      knowledgeSource: "uncertain",
      emotionalTone: "neutral",
    });
    await appendReaderTurn(sA.id, readerPayload(characterId, READER_A, "two"));

    await appendReaderTurn(sB.id, readerPayload(characterId, READER_B, "other"));

    const listA = await listSessionTurnsOrdered(sA.id);
    const listB = await listSessionTurnsOrdered(sB.id);

    assert.equal(listA.length, 3);
    assert.equal(listB.length, 1);
    assert.deepEqual(
      listA.map((t) => t.orderIndex),
      [0, 1, 2]
    );
    assert.equal(listA[0].speakerType, "reader");
    assert.equal(listA[1].speakerType, "character");
    assert.equal(listB[0].orderIndex, 0);
    assert.ok(JSON.stringify(listB[0].payloadJson).includes("other"));
  });
});
