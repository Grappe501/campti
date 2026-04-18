import { z } from "zod";

export const SceneGenerationPreflightSceneIdSchema = z.object({
  sceneId: z.string().trim().min(1, "sceneId required"),
});
