import { randomUUID } from "node:crypto";

import type { SceneDecisionRecommendation, SceneDecisionRecommendationSet } from "@/lib/domain/scene-decision-assist";
import type { LogRecommendationFollowupInput, LogRecommendationShownInput } from "@/lib/domain/scene-recommendation-learning-validation";
import { prisma } from "@/lib/prisma";

/**
 * Append-only: records one Decision Assist render (all visible recommendation ids/categories).
 */
export async function logRecommendationShownFromAssistInput(input: LogRecommendationShownInput): Promise<string | null> {
  try {
    const row = await prisma.sceneRecommendationEvent.create({
      data: {
        sceneId: input.sceneId,
        ledgerRunKey: input.ledgerRunKey ?? null,
        eventType: "recommendation_shown",
        recommendationIds: input.recommendationIds,
        recommendationCategories: input.recommendationCategories,
        displayBatchId: input.displayBatchId ?? randomUUID(),
        contextSummary: input.contextSummary ?? null,
      },
    });
    return row.id;
  } catch {
    return null;
  }
}

export function buildShownPayloadFromRecommendationSet(
  sceneId: string,
  set: SceneDecisionRecommendationSet,
  ledgerRunKey?: string | null,
): LogRecommendationShownInput {
  const list: SceneDecisionRecommendation[] = [...(set.primary ? [set.primary] : []), ...set.secondary];
  const recommendationIds = list.map((r) => r.id);
  const recommendationCategories = list.map((r) => r.category);
  return {
    sceneId,
    ledgerRunKey: ledgerRunKey ?? null,
    recommendationIds,
    recommendationCategories,
    displayBatchId: randomUUID(),
    contextSummary: list.length ? `Assist render: ${list.length} recommendation(s).` : "Assist render: empty set.",
  };
}

async function findLatestParentShownId(sceneId: string, before: Date): Promise<string | null> {
  const row = await prisma.sceneRecommendationEvent.findFirst({
    where: { sceneId, eventType: "recommendation_shown", createdAt: { lt: before } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Client or server: user took an identifiable follow-up (tab navigation, replay, etc.).
 */
export async function logRecommendationFollowupEvent(input: LogRecommendationFollowupInput): Promise<string | null> {
  try {
    const before = new Date();
    const parentEventId = input.parentEventId ?? (await findLatestParentShownId(input.sceneId, before));
    const row = await prisma.sceneRecommendationEvent.create({
      data: {
        sceneId: input.sceneId,
        eventType: "recommendation_action_taken",
        actionType: input.actionType,
        parentEventId,
        recommendationIds: input.recommendationId ? [input.recommendationId] : [],
        recommendationCategories: input.recommendationCategory ? [input.recommendationCategory] : [],
        meta: {
          inferredParent: !input.parentEventId,
        },
      },
    });
    return row.id;
  } catch {
    return null;
  }
}

/** Server-only convenience (replay path, etc.). */
export async function recordRecommendationServerFollowup(sceneId: string, actionType: LogRecommendationFollowupInput["actionType"]): Promise<void> {
  await logRecommendationFollowupEvent({ sceneId, actionType });
}
