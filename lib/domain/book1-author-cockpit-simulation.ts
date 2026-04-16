import { z } from "zod";

export const Book1SimulationModeSchema = z.enum(["locked_canon", "soft_law", "counterfactual", "unlocked_branch"]);
export type Book1SimulationMode = z.infer<typeof Book1SimulationModeSchema>;

export const Book1AuthorSimulationGovernancePolicySchema = z.object({
  allowAnchorMutation: z.boolean(),
  allowChapterLawMutation: z.boolean(),
  allowCharacterPsychologyTuning: z.boolean(),
  allowForeshadowingRetune: z.boolean(),
  allowTimelineMutation: z.boolean(),
  allowRelationshipPressureRetune: z.boolean(),
  allowVoiceSpecTuning: z.boolean(),
  simulationMode: Book1SimulationModeSchema,
});
export type Book1AuthorSimulationGovernancePolicy = z.infer<typeof Book1AuthorSimulationGovernancePolicySchema>;

export const Book1AuthorActionTypeSchema = z.enum([
  "update_chapter_law",
  "adjust_symbolic_emphasis",
  "retune_foreshadowing",
  "change_relationship_pressure",
  "change_psychological_weighting",
  "propose_anchor_mutation",
  "mutate_timeline",
  "tune_voice_spec",
]);
export type Book1AuthorActionType = z.infer<typeof Book1AuthorActionTypeSchema>;

export const Book1AuthorActionSchema = z.object({
  actionId: z.string().min(1),
  chapter: z.literal(1),
  actionType: Book1AuthorActionTypeSchema,
  targetKey: z.string().min(1),
  rationale: z.string().min(1),
  patch: z.record(z.string(), z.unknown()),
  requestedBy: z.string().default("author_cockpit"),
  requestedAt: z.string(),
  provenanceRefs: z.array(z.string()).default([]),
});
export type Book1AuthorAction = z.infer<typeof Book1AuthorActionSchema>;
