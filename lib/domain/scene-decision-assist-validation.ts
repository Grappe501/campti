import { z } from "zod";

export const SceneDecisionAssistRequestSchema = z.object({
  sceneId: z.string().trim().min(1),
  /** When set, run-scoped notes are included (same scene). */
  ledgerRunKey: z.string().trim().min(1).optional(),
  maxLedgerEntries: z.number().int().min(10).max(200).optional(),
});

export type SceneDecisionAssistRequestInput = z.infer<typeof SceneDecisionAssistRequestSchema>;
