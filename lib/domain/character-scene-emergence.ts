import { z } from "zod";

export const CHARACTER_SCENE_EMERGENCE_CONTRACT_VERSION = "1" as const;

/** Per-scene justification derived from character pressure (not structural filler). */
export const CharacterSceneEmergenceDigestSchema = z.object({
  sceneId: z.string().min(1),
  sceneNecessityReasons: z.array(z.string().min(1)).min(1),
  conflictSources: z.array(z.string().min(1)).min(1),
  povCandidates: z
    .array(
      z.object({
        personId: z.string().min(1),
        weight: z.number().min(0).max(1),
        rationale: z.string().min(1),
      }),
    )
    .min(1),
  scenePurposeFromPressure: z.string().min(1),
  dominantPressureIds: z.array(z.string().min(1)),
  validationFlags: z.array(z.string()),
});
export type CharacterSceneEmergenceDigest = z.infer<typeof CharacterSceneEmergenceDigestSchema>;

/** Chapter overlay: emergence digests keyed by scene plan id (canonical governance bundle). */
export const CharacterSceneEmergenceChapterPlanSchema = z.object({
  contractVersion: z.literal(CHARACTER_SCENE_EMERGENCE_CONTRACT_VERSION),
  clusterTag: z.literal("cluster8_character_scene_emergence_chapter"),
  chapterId: z.string().min(1),
  bookId: z.string().min(1),
  sceneEmergenceBySceneId: z.record(z.string(), CharacterSceneEmergenceDigestSchema),
  chapterPressureSummary: z.string().min(1),
  validationFlags: z.array(z.string()),
});
export type CharacterSceneEmergenceChapterPlan = z.infer<typeof CharacterSceneEmergenceChapterPlanSchema>;
