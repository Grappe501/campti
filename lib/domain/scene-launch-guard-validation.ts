import { z } from "zod";

export const SceneLaunchIntentSchema = z.enum(["full_generation", "draft", "rewrite", "repair"]);

export const EvaluateSceneLaunchGuardSchema = z.object({
  sceneId: z.string().trim().min(1),
});

export const ConfirmAndLaunchSceneGenerationSchema = z.object({
  sceneId: z.string().trim().min(1),
  /** Sha256 hex (64 chars) from `computeSceneLaunchFreshnessDigest`. */
  freshnessDigest: z.string().regex(/^[a-f0-9]{64}$/i, "freshnessDigest must be sha256 hex"),
  riskAcknowledged: z.boolean(),
  intent: SceneLaunchIntentSchema,
  /** Optional flags forwarded to `runSceneGeneration` after guard approval (server-trusted shape). */
  saveGenerationText: z.boolean().optional(),
  registerDependencies: z.boolean().optional(),
  runProseQuality: z.boolean().optional(),
});

export const RecordBlockedLaunchAcknowledgementSchema = z.object({
  sceneId: z.string().trim().min(1),
  freshnessDigest: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  note: z.string().max(2000).optional(),
});

export type ConfirmAndLaunchSceneGenerationInput = z.infer<typeof ConfirmAndLaunchSceneGenerationSchema>;
