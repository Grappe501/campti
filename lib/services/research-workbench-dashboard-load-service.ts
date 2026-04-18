import { prisma } from "@/lib/prisma";
import type { CanonComparisonRecord, CanonComparisonResult, ComparedAgainstType } from "@/lib/domain/canon-reconciliation";
import { RICRE_CANON_RECONCILIATION_CONTRACT_VERSION } from "@/lib/domain/canon-reconciliation";
import {
  RESEARCH_WORKBENCH_CONTRACT_VERSION,
  type ContradictionReviewItem,
  type ResearchClaimReviewItem,
  type ResearchSourceSummary,
  type ResearchTargetSummary,
  type ResearchWorkbenchAuditViewModel,
  type ResearchWorkbenchDashboardViewModel,
  type ResearchWorkbenchNarrowContext,
} from "@/lib/domain/research-workbench";
import { ResearchContradictionDetectionService } from "@/lib/services/research-contradiction-detection-service";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function preview(s: string | null | undefined, n = 160): string | null {
  if (!s?.trim()) return null;
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function toCanonComparisonRecord(row: {
  id: string;
  claimId: string;
  comparedAgainstType: string;
  comparedAgainstId: string;
  comparisonResult: string;
  contradictionType: string | null;
  impactScope: string | null;
  validationFlags: unknown;
}): CanonComparisonRecord {
  return {
    contractVersion: RICRE_CANON_RECONCILIATION_CONTRACT_VERSION,
    comparisonId: row.id,
    claimId: row.claimId,
    comparedAgainstType: row.comparedAgainstType as ComparedAgainstType,
    comparedAgainstId: row.comparedAgainstId,
    comparisonResult: row.comparisonResult as CanonComparisonResult,
    contradictionType: row.contradictionType,
    impactScope: row.impactScope,
    validationFlags: asStringArray(row.validationFlags),
  };
}

export type ResearchWorkbenchDashboardQuery = {
  narrowTargetIds?: string[] | null;
  sceneScopeForAcceptedCanonCount?: {
    sceneId: string;
    chapterId: string;
    personIds: string[];
    placeIds: string[];
  };
  queue?: "open_claims" | "contradictions";
  narrowContext?: ResearchWorkbenchNarrowContext | null;
};

/**
 * Full dashboard payload for `/admin/research`.
 */
export async function loadResearchWorkbenchDashboard(query?: ResearchWorkbenchDashboardQuery): Promise<ResearchWorkbenchDashboardViewModel> {
  const narrow = query?.narrowTargetIds;
  const openClaimStatuses = ["pending", "extracted", "compared"];
  const claimWhere =
    narrow === undefined || narrow === null
      ? { claimStatus: { in: openClaimStatuses } }
      : { claimStatus: { in: openClaimStatuses }, researchTargetId: { in: narrow } };

  const targetsWhere =
    narrow === undefined || narrow === null ? undefined : narrow.length === 0 ? { id: { in: [] as string[] } } : { id: { in: narrow } };

  const sourcesWhere =
    narrow === undefined || narrow === null ? undefined : narrow.length === 0 ? { researchTargetId: { in: [] as string[] } } : { researchTargetId: { in: narrow } };

  const decisionsWhere =
    narrow === undefined || narrow === null
      ? undefined
      : narrow.length === 0
        ? { claimId: { in: [] as string[] } }
        : { claim: { researchTargetId: { in: narrow } } };

  const acceptedCanonPromise =
    query?.sceneScopeForAcceptedCanonCount != null
      ? prisma.authorCanonKnowledgeRecord.count({
          where: {
            canonicalStatus: "active",
            OR: [
              { targetType: "scene", targetId: query.sceneScopeForAcceptedCanonCount.sceneId },
              { targetType: "chapter", targetId: query.sceneScopeForAcceptedCanonCount.chapterId },
              ...query.sceneScopeForAcceptedCanonCount.personIds.map((id) => ({ targetType: "person" as const, targetId: id })),
              ...query.sceneScopeForAcceptedCanonCount.placeIds.map((id) => ({ targetType: "place" as const, targetId: id })),
            ],
          },
        })
      : prisma.authorCanonKnowledgeRecord.count({ where: { canonicalStatus: "active" } });

  const [targetsTotal, openClaimsTotal, acceptedCanonActiveTotal, lastDecision, recentTargets, recentSources] = await Promise.all([
    narrow === undefined || narrow === null
      ? prisma.authorResearchTarget.count()
      : prisma.authorResearchTarget.count({ where: targetsWhere }),
    prisma.authorResearchClaim.count({ where: claimWhere }),
    acceptedCanonPromise,
    prisma.authorCanonDecision.findFirst({
      where: decisionsWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.authorResearchTarget.findMany({
      where: targetsWhere,
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        _count: { select: { claims: true } },
      },
    }),
    prisma.authorResearchSource.findMany({
      where: sourcesWhere,
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { researchTarget: { select: { targetName: true } } },
    }),
  ]);

  const openClaims = await prisma.authorResearchClaim.findMany({
    where: claimWhere,
    orderBy: { updatedAt: "desc" },
    take: query?.queue === "contradictions" ? 60 : 30,
    include: {
      source: { select: { sourceTitle: true } },
      evidence: { select: { id: true, summary: true, confidence: true, relevanceScore: true, validationFlags: true } },
      comparisons: true,
    },
  });

  const recentDecisions = await prisma.authorCanonDecision.findMany({
    where: decisionsWhere,
    orderBy: { createdAt: "desc" },
    take: 18,
    include: {
      claim: {
        select: {
          claimText: true,
          researchTarget: { select: { targetName: true, id: true } },
        },
      },
    },
  });

  const contradictionSvc = new ResearchContradictionDetectionService();
  const contradictionItems: ContradictionReviewItem[] = [];
  const claimsForQueue =
    query?.queue === "contradictions"
      ? openClaims.filter((c) => contradictionSvc.listContradictions(c.comparisons.map(toCanonComparisonRecord)).length > 0)
      : openClaims;

  for (const c of claimsForQueue) {
    const domainRows = c.comparisons.map(toCanonComparisonRecord);
    for (const x of contradictionSvc.listContradictions(domainRows)) {
      contradictionItems.push({
        claimId: c.id,
        claimTextPreview: preview(c.claimText, 200) ?? "",
        sourceTitle: c.source.sourceTitle,
        comparisonId: x.comparisonId,
        comparisonResult: x.comparisonResult,
        contradictionType: x.contradictionType,
        impactScope: x.impactScope,
        honestyLabel: "approximate_contradiction_shape",
      });
    }
  }

  const claimReviewQueue: ResearchClaimReviewItem[] = claimsForQueue.map((c) => ({
    claimId: c.id,
    researchTargetId: c.researchTargetId,
    sourceId: c.sourceId,
    sourceTitle: c.source.sourceTitle,
    claimType: c.claimType,
    claimText: c.claimText,
    claimStatus: c.claimStatus,
    extractionMethod: c.extractionMethod,
    extractionHonestyLabel: "heuristic_stub",
    confidence: c.confidence,
    evidence: c.evidence
      ? {
          evidenceId: c.evidence.id,
          summary: c.evidence.summary,
          confidence: c.evidence.confidence,
          relevanceScore: c.evidence.relevanceScore,
          validationFlags: asStringArray(c.evidence.validationFlags),
        }
      : null,
    comparisons: c.comparisons.map((row) => ({
      comparisonId: row.id,
      comparedAgainstType: row.comparedAgainstType,
      comparedAgainstId: row.comparedAgainstId,
      comparisonResult: row.comparisonResult,
      contradictionType: row.contradictionType,
      impactScope: row.impactScope,
      validationFlags: asStringArray(row.validationFlags),
      honestyLabel: "heuristic_overlap" as const,
    })),
    contradictionFlags: contradictionSvc.listContradictions(c.comparisons.map(toCanonComparisonRecord)).map((x) => x.comparisonResult),
  }));

  const recentTargetRows: ResearchTargetSummary[] = recentTargets.map((t) => ({
    id: t.id,
    targetType: t.targetType as ResearchTargetSummary["targetType"],
    targetName: t.targetName,
    researchIntent: t.researchIntent,
    updatedAtIso: t.updatedAt.toISOString(),
    linkedSceneCount: asStringArray(t.linkedSceneIds).length,
    linkedPersonCount: asStringArray(t.linkedPersonIds).length,
    linkedPlaceCount: asStringArray(t.linkedPlaceIds).length,
    openClaimCount: t._count.claims,
  }));

  const recentSourceRows: ResearchSourceSummary[] = recentSources.map((s) => {
    let fetchHonesty: ResearchSourceSummary["fetchHonestyLabel"] = "no_network";
    if (s.ingestMethod === "author_url_fetch") fetchHonesty = "bounded_single_url";
    if (s.ingestMethod === "author_url_fetch_failed") fetchHonesty = "fetch_failed";
    return {
      id: s.id,
      researchTargetId: s.researchTargetId,
      sourceTitle: s.sourceTitle,
      sourceType: s.sourceType,
      ingestMethod: s.ingestMethod,
      sourceTrustTier: s.sourceTrustTier,
      provenanceHash: s.provenanceHash,
      accessDateIso: s.accessDate.toISOString(),
      validationFlags: asStringArray(s.validationFlags),
      excerptPreview: preview(s.rawExcerpt, 220),
      fetchHonestyLabel: fetchHonesty,
    };
  });

  const auditRows: ResearchWorkbenchAuditViewModel[] = recentDecisions.map((d) => ({
    decisionId: d.id,
    createdAtIso: d.createdAt.toISOString(),
    claimId: d.claimId,
    claimTextPreview: preview(d.claim.claimText, 120) ?? "",
    authorDecision: d.authorDecision,
    decisionReasonPreview: preview(d.decisionReason, 160) ?? "",
    resultingCanonAction: d.resultingCanonAction,
    resultingCanonRecordId: d.resultingCanonRecordId,
    targetName: d.claim.researchTarget?.targetName ?? null,
  }));

  const heuristicClaims = await prisma.authorResearchClaim.count({
    where: {
      extractionMethod: "heuristic_stub",
      claimStatus: { in: openClaimStatuses },
      ...(narrow !== undefined && narrow !== null ? { researchTargetId: { in: narrow } } : {}),
    },
  });

  return {
    contractVersion: RESEARCH_WORKBENCH_CONTRACT_VERSION,
    narrowContext: query?.narrowContext ?? null,
    summaryBar: {
      openClaimsTotal,
      contradictionQueueTotal: contradictionItems.length,
      acceptedCanonActiveTotal: acceptedCanonActiveTotal,
      researchTargetsTotal: targetsTotal,
      lastDecisionAtIso: lastDecision?.createdAt.toISOString() ?? null,
      advisoryLabels: [
        "Extraction is heuristic_stub — deterministic sentence rules, not LLM certainty.",
        "Canon comparison uses token overlap heuristics — contradiction-shaped, not legal proof.",
        "Single-URL fetch only when enabled; byte and timeout caps per ResearchSourceIngestionService.",
      ],
    },
    queue: {
      openClaimsTotal,
      contradictionQueueTotal: contradictionItems.length,
      pendingReviewClaims: openClaimsTotal,
      heuristicExtractionClaims: heuristicClaims,
    },
    recentTargets: recentTargetRows,
    recentSources: recentSourceRows,
    claimReviewQueue,
    contradictionQueue: contradictionItems.slice(0, 40),
    recentDecisions: auditRows,
    honestyBanner:
      "RICRE workbench is observational governance: research never becomes canon without an explicit author decision on this path.",
  };
}
