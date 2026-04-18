import { z } from "zod";

export const LoadSceneRunLedgerSchema = z.object({
  sceneId: z.string().trim().min(1),
  limit: z.number().int().min(1).max(200).optional(),
});

export const LoadSceneRunDetailSchema = z.object({
  sceneId: z.string().trim().min(1),
  ledgerRunKey: z.string().trim().min(1),
});

export const CompareSceneRunsSchema = z.object({
  sceneId: z.string().trim().min(1),
  ledgerRunKeyA: z.string().trim().min(1),
  ledgerRunKeyB: z.string().trim().min(1),
});

export const ReplaySceneRunActionSchema = z.object({
  sceneId: z.string().trim().min(1),
  sourceLedgerRunKey: z.string().trim().min(1),
  freshnessDigest: z.string().regex(/^[a-f0-9]{64}$/i, "freshnessDigest must be sha256 hex"),
  riskAcknowledged: z.boolean(),
});

export type LoadSceneRunLedgerInput = z.infer<typeof LoadSceneRunLedgerSchema>;
export type LoadSceneRunDetailInput = z.infer<typeof LoadSceneRunDetailSchema>;
export type CompareSceneRunsInput = z.infer<typeof CompareSceneRunsSchema>;
export type ReplaySceneRunActionInput = z.infer<typeof ReplaySceneRunActionSchema>;
