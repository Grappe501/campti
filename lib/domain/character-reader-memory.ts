import type { Prisma } from "@prisma/client";

/** P2-G — Row shape for `CharacterReaderMemory` (reader-specific, interaction-earned). */
export type CharacterReaderMemoryDomain = {
  id: string;
  characterId: string;
  readerId: string;
  familiarityLevel: number;
  interactionCount: number;
  knownFacts: Prisma.JsonValue;
  lastInteractionAt: Date;
};
