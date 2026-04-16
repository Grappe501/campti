import { z } from "zod";

export const Book1CharacterConsoleModeSchema = z.enum(["observer", "god"]);
export type Book1CharacterConsoleMode = z.infer<typeof Book1CharacterConsoleModeSchema>;

export const Book1CharacterConsoleGovernancePolicySchema = z.object({
  allowCharacterStateMutation: z.boolean(),
  allowDialogueMutation: z.boolean(),
  allowActionPathMutation: z.boolean(),
  allowAnchorMutation: z.boolean(),
  simulationMode: Book1CharacterConsoleModeSchema,
});
export type Book1CharacterConsoleGovernancePolicy = z.infer<typeof Book1CharacterConsoleGovernancePolicySchema>;

export const Book1CharacterConsoleTurnActionSchema = z.enum(["question", "probe", "intervene"]);
export type Book1CharacterConsoleTurnAction = z.infer<typeof Book1CharacterConsoleTurnActionSchema>;

export const Book1CharacterMutationKindSchema = z.enum(["character_state", "dialogue", "action_path", "anchor"]);
export type Book1CharacterMutationKind = z.infer<typeof Book1CharacterMutationKindSchema>;

export const Book1CharacterMutationProposalSchema = z.object({
  mutationId: z.string().min(1),
  mutationKind: Book1CharacterMutationKindSchema,
  targetKey: z.string().min(1),
  patch: z.record(z.string(), z.unknown()),
  rationale: z.string().min(1),
  provenanceRefs: z.array(z.string()).default([]),
});
export type Book1CharacterMutationProposal = z.infer<typeof Book1CharacterMutationProposalSchema>;

export const Book1CharacterConsoleTurnSchema = z.object({
  turnId: z.string().min(1),
  chapter: z.literal(1),
  scene: z.number().int().positive(),
  character: z.string().min(1),
  actionType: Book1CharacterConsoleTurnActionSchema,
  content: z.string().min(1),
  proposedMutation: Book1CharacterMutationProposalSchema.optional(),
  requestedBy: z.string().default("author_character_console"),
  requestedAt: z.string(),
  provenanceRefs: z.array(z.string()).default([]),
});
export type Book1CharacterConsoleTurn = z.infer<typeof Book1CharacterConsoleTurnSchema>;
