import type { SceneDecisionRecommendationCategory } from "@/lib/domain/scene-decision-assist";
import type { SceneRecommendationOutcomeLinkStatus } from "@/lib/domain/scene-recommendation-learning";
import { prisma } from "@/lib/prisma";

export type LaunchOutcomeLinkParams = {
  sceneId: string;
  startAuditCreatedAt: Date;
  startAuditId: string;
  endAuditId: string | null;
  ledgerRunKey: string | null;
  launchAllowance: string | null;
  generationSucceeded: boolean;
};

function parseCategories(raw: unknown): SceneDecisionRecommendationCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is SceneDecisionRecommendationCategory => typeof x === "string");
}

/**
 * After a guarded launch terminal audit, relate the run to the most recent prior `recommendation_shown`.
 * Append-only; skips when duplicate `recommendation_outcome_linked` for the same `ledgerRunKey` or when no parent show exists.
 */
export async function recordLaunchOutcomeForRecommendationLearning(params: LaunchOutcomeLinkParams): Promise<void> {
  if (!params.ledgerRunKey) return;

  try {
    const dup = await prisma.sceneRecommendationEvent.findFirst({
      where: {
        sceneId: params.sceneId,
        eventType: "recommendation_outcome_linked",
        linkedLedgerRunKey: params.ledgerRunKey,
      },
      select: { id: true },
    });
    if (dup) return;

    const recentShows = await prisma.sceneRecommendationEvent.findMany({
      where: {
        sceneId: params.sceneId,
        eventType: "recommendation_shown",
        createdAt: { lt: params.startAuditCreatedAt },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { id: true, createdAt: true, recommendationCategories: true },
    });

    const parent = recentShows[0];
    if (!parent) {
      await prisma.sceneRecommendationEvent.create({
        data: {
          sceneId: params.sceneId,
          eventType: "recommendation_outcome_evaluated",
          linkedLedgerRunKey: params.ledgerRunKey,
          linkedLaunchAuditId: params.endAuditId,
          contextSummary: "No prior recommendation_shown before this run — outcome not paired to advice.",
          meta: {
            linkStatus: "no_observed_outcome" satisfies SceneRecommendationOutcomeLinkStatus,
            startAuditId: params.startAuditId,
          },
        },
      });
      return;
    }

    let linkStatus: SceneRecommendationOutcomeLinkStatus = "linked_outcome";
    if (recentShows.length >= 2) {
      const a = recentShows[0]!.createdAt.getTime();
      const b = recentShows[1]!.createdAt.getTime();
      if (a - b < 60_000) linkStatus = "ambiguous_followup";
    }

    const categories = parseCategories(parent.recommendationCategories);

    await prisma.sceneRecommendationEvent.create({
      data: {
        sceneId: params.sceneId,
        eventType: "recommendation_outcome_linked",
        parentEventId: parent.id,
        linkedLaunchAuditId: params.endAuditId,
        linkedLedgerRunKey: params.ledgerRunKey,
        recommendationCategories: categories,
        meta: {
          launchAllowance: params.launchAllowance,
          generationSucceeded: params.generationSucceeded,
          linkStatus,
          startAuditId: params.startAuditId,
        },
      },
    });
  } catch {
    /* non-fatal — learning must not break launches */
  }
}
