import { z } from "zod";

import {
  SCENE_RECOMMENDATION_ACTION_TYPES,
  SCENE_RECOMMENDATION_EVENT_TYPES,
} from "@/lib/domain/scene-recommendation-learning";
import { type SceneDecisionRecommendationCategory } from "@/lib/domain/scene-decision-assist";

const categorySchema: z.ZodType<SceneDecisionRecommendationCategory> = z.enum([
  "replay_now",
  "repair_instead_of_replay",
  "resolve_research_pressure_first",
  "resolve_character_simulation_first",
  "review_preflight_blockers",
  "inspect_run_diff_first",
  "pause_relaunch_churn",
  "proceed_stability_improving",
  "historical_review_only",
]);

export const LogRecommendationShownInputSchema = z.object({
  sceneId: z.string().trim().min(1),
  ledgerRunKey: z.string().trim().min(1).nullable().optional(),
  recommendationIds: z.array(z.string().trim().min(1)).max(64),
  recommendationCategories: z.array(categorySchema).max(32),
  displayBatchId: z.string().trim().min(1).max(80).optional(),
  contextSummary: z.string().max(500).optional(),
});

export const LogRecommendationFollowupInputSchema = z.object({
  sceneId: z.string().trim().min(1),
  actionType: z.enum(SCENE_RECOMMENDATION_ACTION_TYPES),
  /** When the user followed a specific card. */
  recommendationCategory: categorySchema.optional(),
  recommendationId: z.string().trim().min(1).max(200).optional(),
  parentEventId: z.string().trim().min(1).optional(),
});

export const LoadRecommendationEffectivenessInputSchema = z.object({
  sceneId: z.string().trim().min(1),
  windowDays: z.number().int().min(7).max(365).optional(),
});

export const SceneRecommendationEventTypeSchema = z.enum(SCENE_RECOMMENDATION_EVENT_TYPES);

export type LogRecommendationShownInput = z.infer<typeof LogRecommendationShownInputSchema>;
export type LogRecommendationFollowupInput = z.infer<typeof LogRecommendationFollowupInputSchema>;
export type LoadRecommendationEffectivenessInput = z.infer<typeof LoadRecommendationEffectivenessInputSchema>;
