import { z } from "zod";

export const SceneRunDiffRequestSchema = z
  .object({
    sceneId: z.string().trim().min(1),
    ledgerRunKeyA: z.string().trim().min(1),
    ledgerRunKeyB: z.string().trim().min(1),
  })
  .refine((d) => d.ledgerRunKeyA !== d.ledgerRunKeyB, { message: "Runs must differ" });

export const SceneRunOutcomeAnalyticsRequestSchema = z.object({
  sceneId: z.string().trim().min(1),
  /** Max ledger entries to analyze (cap). */
  maxEntries: z.number().int().min(5).max(200).optional(),
});

export type SceneRunDiffRequestInput = z.infer<typeof SceneRunDiffRequestSchema>;
export type SceneRunOutcomeAnalyticsRequestInput = z.infer<typeof SceneRunOutcomeAnalyticsRequestSchema>;
