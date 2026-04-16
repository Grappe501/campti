import { z } from "zod";

import { Book1SimulationModeSchema } from "@/lib/domain/book1-author-cockpit-simulation";

export const Book1LawConsoleGovernancePolicySchema = z.object({
  allowChapterLawMutation: z.boolean(),
  allowForeshadowingRetune: z.boolean(),
  allowVoiceSpecTuning: z.boolean(),
  allowAnchorMutation: z.boolean(),
  simulationMode: Book1SimulationModeSchema,
});
export type Book1LawConsoleGovernancePolicy = z.infer<typeof Book1LawConsoleGovernancePolicySchema>;

export const Book1LawConsoleActionTypeSchema = z.enum([
  "adjust_symbolic_emphasis",
  "adjust_foreshadowing_intensity",
  "change_reveal_imply_balance",
  "strengthen_ritual_visibility",
  "weaken_ritual_visibility",
  "change_emotional_residue_target",
  "alter_chapter_end_hook_intensity",
  "shift_scene_weighting",
  "propose_anchor_mutation",
]);
export type Book1LawConsoleActionType = z.infer<typeof Book1LawConsoleActionTypeSchema>;

export const Book1LawConsoleActionSchema = z.object({
  actionId: z.string().min(1),
  chapter: z.literal(1),
  actionType: Book1LawConsoleActionTypeSchema,
  targetKey: z.string().min(1),
  rationale: z.string().min(1),
  patch: z.record(z.string(), z.unknown()),
  requestedBy: z.string().default("book1_law_console"),
  requestedAt: z.string(),
  provenanceRefs: z.array(z.string()).default([]),
});
export type Book1LawConsoleAction = z.infer<typeof Book1LawConsoleActionSchema>;
