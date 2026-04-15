/**
 * P2-N — Persisted transcript turn for a reader–character session.
 *
 * **`payloadJson`** should store a registry-validated wire object:
 * - **reader** turns: {@link ConversationalTurnInput} (`conversationalTurnInput` contract).
 * - **character** turns: {@link CharacterResponse} (`characterResponse` contract).
 *
 * Callers validate at write via `validateRegisteredContractPayload` in the turn service.
 */

import type { Prisma } from "@prisma/client";

export type CharacterConversationTurnSpeaker = "reader" | "character";

export type CharacterConversationTurn = {
  id: string;
  sessionId: string;
  orderIndex: number;
  speakerType: CharacterConversationTurnSpeaker;
  payloadJson: Prisma.JsonValue;
  createdAt: Date;
};
