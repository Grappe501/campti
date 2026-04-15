/**
 * P2-K — Reader → character conversational turn input (wire contract).
 *
 * Session persistence and orchestration are out of scope here; this type is the structured envelope
 * for a single turn (text or voice transcript). Translation flags are presentation / routing hints only.
 */

import { z } from "zod";

export const CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION = "1" as const;

export const conversationalTurnInputSchemaV1 = z.object({
  contractVersion: z.literal(CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION),
  characterId: z.string().min(1),
  readerId: z.string().min(1),
  sceneId: z.union([z.string(), z.null()]).optional(),
  sessionId: z.union([z.string(), z.null()]).optional(),
  inputMode: z.enum(["text", "voice_transcript"]),
  readerText: z.string(),
  translatedToCharacterLanguage: z.boolean().optional(),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type ConversationalTurnInput = z.infer<typeof conversationalTurnInputSchemaV1>;
