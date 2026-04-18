import { z } from "zod";

import {
  ResearchComparisonRerunInputSchema,
  ResearchIngestionManualInputSchema,
  ResearchIngestionUrlInputSchema,
  ResearchTargetCreateInputSchema,
  ResearchWorkbenchDecisionInputSchema,
} from "@/lib/domain/research-workbench-validation";

/** Scene tab: create target — same shape as workbench but requires this scene in linkedSceneIds. */
export const SceneResearchTargetCreateInputSchema = ResearchTargetCreateInputSchema.and(
  z.object({
    /** Must match the scene detail route `sceneId` (server action cross-check). */
    anchorSceneId: z.string().min(1),
  }),
).superRefine((val, ctx) => {
  if (!val.linkedSceneIds.includes(val.anchorSceneId)) {
    ctx.addIssue({
      code: "custom",
      message: "Scene-linked target creation requires this scene id in linkedSceneIds.",
      path: ["linkedSceneIds"],
    });
  }
});

/** Wraps target create with explicit scene route id binding. */
export const SceneResearchTabCreateTargetActionSchema = SceneResearchTargetCreateInputSchema.and(
  z.object({
    sceneId: z.string().min(1),
  }),
).superRefine((val, ctx) => {
  if (val.sceneId !== val.anchorSceneId) {
    ctx.addIssue({
      code: "custom",
      message: "sceneId route parameter must match anchorSceneId for scene-tab safety.",
      path: ["sceneId"],
    });
  }
});

export const SceneResearchManualIngestActionSchema = ResearchIngestionManualInputSchema.and(
  z.object({
    sceneId: z.string().min(1),
  }),
);

export const SceneResearchUrlIngestActionSchema = ResearchIngestionUrlInputSchema.and(
  z.object({
    sceneId: z.string().min(1),
  }),
);

export const SceneResearchExtractActionSchema = z.object({
  sceneId: z.string().min(1),
  sourceId: z.string().min(1),
});

export const SceneResearchCompareActionSchema = ResearchComparisonRerunInputSchema.and(
  z.object({
    sceneId: z.string().min(1),
  }),
);

export const SceneResearchDecisionActionSchema = ResearchWorkbenchDecisionInputSchema.and(
  z.object({
    sceneId: z.string().min(1),
  }),
);

export type SceneResearchTargetCreateInput = z.infer<typeof SceneResearchTargetCreateInputSchema>;
