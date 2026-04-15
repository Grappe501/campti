/**
 * P2-N — Append and list persisted conversation turns (transcript slices).
 *
 * Reader payloads validate as `conversationalTurnInput`; character payloads as `characterResponse`.
 * No billing or LLM calls.
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import type { ConversationalTurnInput } from "@/lib/domain/conversational-turn-input";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { prisma } from "@/lib/prisma";

function toDomain(row: {
  id: string;
  sessionId: string;
  orderIndex: number;
  speakerType: "reader" | "character";
  payloadJson: unknown;
  createdAt: Date;
}): CharacterConversationTurn {
  return {
    id: row.id,
    sessionId: row.sessionId,
    orderIndex: row.orderIndex,
    speakerType: row.speakerType,
    payloadJson: row.payloadJson as CharacterConversationTurn["payloadJson"],
    createdAt: row.createdAt,
  };
}

async function nextOrderIndex(sessionId: string): Promise<number> {
  const agg = await prisma.characterConversationTurn.aggregate({
    where: { sessionId },
    _max: { orderIndex: true },
  });
  return (agg._max.orderIndex ?? -1) + 1;
}

/**
 * Append a reader turn. Validates `payload` as **conversationalTurnInput** write contract before persist.
 */
export async function appendReaderTurn(
  sessionId: string,
  payload: ConversationalTurnInput
): Promise<CharacterConversationTurn> {
  const validated = validateRegisteredContractPayload("conversationalTurnInput", payload, "write");
  const orderIndex = await nextOrderIndex(sessionId);
  const row = await prisma.characterConversationTurn.create({
    data: {
      sessionId,
      orderIndex,
      speakerType: "reader",
      payloadJson: validated as object,
    },
  });
  return toDomain(row);
}

/**
 * Append a character turn. Validates `payload` as **characterResponse** write contract before persist.
 */
export async function appendCharacterTurn(
  sessionId: string,
  payload: CharacterResponse
): Promise<CharacterConversationTurn> {
  const validated = validateRegisteredContractPayload("characterResponse", payload, "write");
  const orderIndex = await nextOrderIndex(sessionId);
  const row = await prisma.characterConversationTurn.create({
    data: {
      sessionId,
      orderIndex,
      speakerType: "character",
      payloadJson: validated as object,
    },
  });
  return toDomain(row);
}

/** All turns for the session, ascending by `orderIndex`. */
export async function listSessionTurnsOrdered(sessionId: string): Promise<CharacterConversationTurn[]> {
  const rows = await prisma.characterConversationTurn.findMany({
    where: { sessionId },
    orderBy: { orderIndex: "asc" },
  });
  return rows.map(toDomain);
}
