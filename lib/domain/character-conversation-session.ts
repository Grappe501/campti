/**
 * P2-M — Reader–character conversation session (persistence envelope).
 *
 * Transcript storage and billing are out of scope; this models session lifecycle only.
 */

import type { Prisma } from "@prisma/client";

export type CharacterConversationSessionStatus = "ACTIVE" | "PAUSED" | "ENDED";

/** Domain mirror of `CharacterConversationSession` (Prisma). */
export type CharacterConversationSession = {
  id: string;
  characterId: string;
  readerId: string;
  sceneId: string | null;
  status: CharacterConversationSessionStatus;
  interactionCount: number;
  startedAt: Date;
  lastInteractionAt: Date;
  endedAt: Date | null;
  metadataJson: Prisma.JsonValue | null;
};
