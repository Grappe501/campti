import { prisma } from "@/lib/prisma";
import type { RicreAcceptedCanonKnowledgeBundle } from "@/lib/domain/canon-reconciliation";
import { findResearchTargetIdsLinkedToSceneContext } from "@/lib/services/research-target-scene-graph-service";

/**
 * Loads **author-accepted** RICRE canon rows relevant to a scene for prompt grounding (subordinate to P2-E sources).
 */
export async function loadAcceptedRicreCanonKnowledgeForScene(sceneId: string): Promise<RicreAcceptedCanonKnowledgeBundle | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: {
      id: true,
      chapterId: true,
      persons: { select: { id: true } },
      places: { select: { id: true } },
    },
  });
  if (!scene) return null;

  const personIds = scene.persons.map((p) => p.id);
  const placeIds = scene.places.map((p) => p.id);
  const targets: Array<{ type: string; id: string }> = [
    { type: "scene", id: scene.id },
    { type: "chapter", id: scene.chapterId },
    ...personIds.map((id) => ({ type: "person", id })),
    ...placeIds.map((id) => ({ type: "place", id })),
  ];

  const rows = await prisma.authorCanonKnowledgeRecord.findMany({
    where: {
      canonicalStatus: "active",
      OR: targets.map((t) => ({ targetType: t.type, targetId: t.id })),
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  if (!rows.length) return null;

  const validationFlags: string[] = [];
  const promptInstructionLines: string[] = [
    "RICRE_ACCEPTED_CANON (author-gated research knowledge — subordinate to contract facts and P2-E narrative sources; do not treat as permission to contradict structured genealogy or world-state):",
  ];
  for (const r of rows) {
    promptInstructionLines.push(`- [${r.targetType}:${r.targetId}] ${r.knowledgeType}: ${r.content.replace(/\s+/g, " ").trim().slice(0, 400)}`);
    if (r.storyRealityStatus === "intentional_story_divergence") {
      validationFlags.push(`ricre:divergence_declared:${r.id}`);
    }
  }

  return {
    contractVersion: "1",
    promptInstructionLines,
    recordCount: rows.length,
    validationFlags,
  };
}

/**
 * Cockpit summary: targets linked to scene + open claim/comparison counts.
 */
export async function summarizeRicreForScene(sceneId: string): Promise<{
  linkedTargets: number;
  openClaims: number;
  contradictions: number;
  acceptedCanonRecords: number;
  advisoryOnly: true;
  lastDecisionAt: string | null;
}> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, persons: { select: { id: true } }, places: { select: { id: true } } },
  });
  if (!scene) {
    return {
      linkedTargets: 0,
      openClaims: 0,
      contradictions: 0,
      acceptedCanonRecords: 0,
      advisoryOnly: true,
      lastDecisionAt: null,
    };
  }

  const personIds = scene.persons.map((p) => p.id);
  const placeIds = scene.places.map((p) => p.id);

  const targetIds = await findResearchTargetIdsLinkedToSceneContext({
    sceneId: scene.id,
    chapterId: scene.chapterId,
    personIds,
    placeIds,
  });

  const openClaims =
    targetIds.length > 0
      ? await prisma.authorResearchClaim.count({
          where: { researchTargetId: { in: targetIds }, claimStatus: { in: ["pending", "extracted", "compared"] } },
        })
      : 0;

  const claimIds =
    targetIds.length > 0
      ? (
          await prisma.authorResearchClaim.findMany({
            where: { researchTargetId: { in: targetIds } },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

  const contradictions =
    claimIds.length > 0
      ? await prisma.authorCanonComparison.count({
          where: {
            claimId: { in: claimIds },
            OR: [{ comparisonResult: "contradicts_canon" }, { contradictionType: { not: null } }],
          },
        })
      : 0;

  const acceptedCanonRecords = await prisma.authorCanonKnowledgeRecord.count({
    where: {
      canonicalStatus: "active",
      OR: [
        { targetType: "scene", targetId: scene.id },
        { targetType: "chapter", targetId: scene.chapterId },
        ...personIds.map((id) => ({ targetType: "person", targetId: id })),
        ...placeIds.map((id) => ({ targetType: "place", targetId: id })),
      ],
    },
  });

  const lastDecision =
    claimIds.length > 0
      ? await prisma.authorCanonDecision.findFirst({
          where: { claimId: { in: claimIds } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : null;

  return {
    linkedTargets: targetIds.length,
    openClaims,
    contradictions,
    acceptedCanonRecords,
    advisoryOnly: true,
    lastDecisionAt: lastDecision?.createdAt.toISOString() ?? null,
  };
}
