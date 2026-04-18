import type { CanonComparisonRecord, CanonComparisonResult, ComparedAgainstType } from "@/lib/domain/canon-reconciliation";
import { RICRE_CANON_RECONCILIATION_CONTRACT_VERSION } from "@/lib/domain/canon-reconciliation";
import {
  SCENE_RESEARCH_TAB_CONTRACT_VERSION,
  type SceneAcceptedCanonItem,
  type SceneResearchClaimItem,
  type SceneResearchContradictionItem,
  type SceneResearchContradictionSeverity,
  type SceneResearchDecisionHistoryItem,
  type SceneResearchEntityImpact,
  type SceneResearchHashImpactSummary,
  type SceneResearchPromptImpactSummary,
  type SceneResearchQuickActionState,
  type SceneResearchSourceItem,
  type SceneResearchSummary,
  type SceneResearchTabViewModel,
  type SceneResearchTargetLink,
} from "@/lib/domain/scene-research-tab";
import { canonRelevance, classifyTargetRelevance, groupAcceptedCanonByTargetType } from "@/lib/domain/scene-research-relevance";
import { prisma } from "@/lib/prisma";
import { ResearchContradictionDetectionService } from "@/lib/services/research-contradiction-detection-service";
import { findResearchTargetIdsLinkedToSceneContext } from "@/lib/services/research-target-scene-graph-service";
import { loadAcceptedRicreCanonKnowledgeForScene } from "@/lib/services/ricre-canon-knowledge-loader-service";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function preview(s: string | null | undefined, n = 200): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
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

function contradictionSeverity(c: CanonComparisonRecord): SceneResearchContradictionSeverity {
  if (c.comparisonResult === "contradicts_runtime_assumption") return "blocking";
  if (c.comparisonResult === "contradicts_canon") return "warning";
  return "observational";
}

function nextStepForContradiction(c: CanonComparisonRecord): string {
  if (c.comparisonResult === "contradicts_canon") {
    return "Review canon comparison and record an author decision (accept / reject / uncertain / divergence) in the workbench path.";
  }
  if (c.comparisonResult === "contradicts_runtime_assumption") {
    return "Treat as high-signal against runtime assumptions — reconcile in cockpit or canon before treating as settled.";
  }
  return "Observational tension — confirm whether it should gate story choices or remain advisory.";
}

/**
 * Full scene-local RICRE tab payload. Returns empty shell if scene missing.
 */
export async function loadSceneResearchTab(sceneId: string): Promise<SceneResearchTabViewModel | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      chapter: { select: { id: true, title: true } },
      persons: { select: { id: true, name: true } },
      places: { select: { id: true, name: true } },
    },
  });
  if (!scene) return null;

  const personIds = scene.persons.map((p) => p.id);
  const placeIds = scene.places.map((p) => p.id);
  const chapterId = scene.chapterId;

  const targetIds = await findResearchTargetIdsLinkedToSceneContext({
    sceneId: scene.id,
    chapterId,
    personIds,
    placeIds,
  });

  const targets =
    targetIds.length === 0
      ? []
      : await prisma.authorResearchTarget.findMany({
          where: { id: { in: targetIds } },
          include: {
            _count: { select: { sources: true, claims: true } },
          },
          orderBy: { updatedAt: "desc" },
        });

  const openStatuses = ["pending", "extracted", "compared"] as const;
  const openClaimsRows =
    targetIds.length === 0
      ? []
      : await prisma.authorResearchClaim.findMany({
          where: { researchTargetId: { in: targetIds }, claimStatus: { in: [...openStatuses] } },
          orderBy: { updatedAt: "desc" },
          take: 40,
          include: {
            source: { select: { sourceTitle: true } },
            evidence: { select: { summary: true } },
            comparisons: true,
            _count: { select: { decisions: true } },
            researchTarget: { select: { targetName: true, linkedSceneIds: true, linkedChapterIds: true, linkedPersonIds: true, linkedPlaceIds: true } },
          },
        });

  const sourcesRows =
    targetIds.length === 0
      ? []
      : await prisma.authorResearchSource.findMany({
          where: { researchTargetId: { in: targetIds } },
          orderBy: { updatedAt: "desc" },
          take: 24,
          include: { researchTarget: { select: { targetName: true } } },
        });

  const canonTargets = [
    { type: "scene", id: scene.id },
    { type: "chapter", id: chapterId },
    ...personIds.map((id) => ({ type: "person", id })),
    ...placeIds.map((id) => ({ type: "place", id })),
  ];

  const acceptedCanonRows = await prisma.authorCanonKnowledgeRecord.findMany({
    where: {
      canonicalStatus: "active",
      OR: canonTargets.map((t) => ({ targetType: t.type, targetId: t.id })),
    },
    orderBy: { updatedAt: "desc" },
    take: 48,
  });

  const canonRecordIds = acceptedCanonRows.map((r) => r.id);
  const decsTouchingCanon =
    canonRecordIds.length > 0
      ? await prisma.authorCanonDecision.findMany({
          where: { resultingCanonRecordId: { in: canonRecordIds } },
          orderBy: { createdAt: "desc" },
          select: { resultingCanonRecordId: true, createdAt: true },
        })
      : [];
  const latestCanonDecisionIso = new Map<string, string>();
  for (const d of decsTouchingCanon) {
    const rid = d.resultingCanonRecordId;
    if (rid != null && !latestCanonDecisionIso.has(rid)) {
      latestCanonDecisionIso.set(rid, d.createdAt.toISOString());
    }
  }

  const ricreBundle = await loadAcceptedRicreCanonKnowledgeForScene(scene.id);

  const contradictionSvc = new ResearchContradictionDetectionService();
  const contradictions: SceneResearchContradictionItem[] = [];
  for (const c of openClaimsRows) {
    const domainRows = c.comparisons.map(toCanonComparisonRecord);
    for (const x of contradictionSvc.listContradictions(domainRows)) {
      const row = c.comparisons.find((r) => r.id === x.comparisonId);
      const sev = contradictionSeverity(x);
      contradictions.push({
        claimId: c.id,
        claimTextPreview: preview(c.claimText, 160),
        comparisonId: x.comparisonId,
        comparisonResult: x.comparisonResult,
        contradictionType: x.contradictionType,
        impactScope: x.impactScope,
        affectedTargetType: row?.comparedAgainstType ?? null,
        affectedTargetId: row?.comparedAgainstId ?? null,
        severity: sev,
        recommendedNextStep: nextStepForContradiction(x),
        honestyLabel: "approximate_contradiction_shape",
      });
    }
  }

  const allClaimsUnderTargets =
    targetIds.length === 0
      ? []
      : await prisma.authorResearchClaim.findMany({
          where: { researchTargetId: { in: targetIds } },
          select: { id: true, researchTargetId: true },
        });
  const allClaimIdsForSceneTargets = allClaimsUnderTargets.map((x) => x.id);

  const lastDecision =
    allClaimIdsForSceneTargets.length > 0
      ? await prisma.authorCanonDecision.findFirst({
          where: { claimId: { in: allClaimIdsForSceneTargets } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : null;

  const decisionHistoryRows =
    allClaimIdsForSceneTargets.length > 0
      ? await prisma.authorCanonDecision.findMany({
          where: { claimId: { in: allClaimIdsForSceneTargets } },
          orderBy: { createdAt: "desc" },
          take: 16,
          include: {
            claim: {
              select: {
                claimText: true,
                researchTarget: { select: { targetName: true } },
              },
            },
          },
        })
      : [];

  const decisionsForEntityTimestamps =
    allClaimIdsForSceneTargets.length > 0
      ? await prisma.authorCanonDecision.findMany({
          where: { claimId: { in: allClaimIdsForSceneTargets } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, claimId: true },
        })
      : [];
  const latestDecisionAtByClaimId = new Map<string, Date>();
  for (const d of decisionsForEntityTimestamps) {
    if (!latestDecisionAtByClaimId.has(d.claimId)) latestDecisionAtByClaimId.set(d.claimId, d.createdAt);
  }

  function lastDecisionIsoForTargetSubset(targetSubsetIds: string[]): string | null {
    let best: Date | null = null;
    for (const c of allClaimsUnderTargets) {
      if (!targetSubsetIds.includes(c.researchTargetId)) continue;
      const ts = latestDecisionAtByClaimId.get(c.id);
      if (ts && (!best || ts > best)) best = ts;
    }
    return best?.toISOString() ?? null;
  }

  const linkedTargets: SceneResearchTargetLink[] = targets.map((t) => {
    const rel = classifyTargetRelevance({
      linkedSceneIds: t.linkedSceneIds,
      linkedChapterIds: t.linkedChapterIds,
      linkedPersonIds: t.linkedPersonIds,
      linkedPlaceIds: t.linkedPlaceIds,
      sceneId: scene.id,
      chapterId,
      personIds,
      placeIds,
    });
    const openForTarget = openClaimsRows.filter((c) => c.researchTargetId === t.id).length;
    return {
      targetId: t.id,
      targetType: t.targetType,
      targetName: t.targetName,
      researchIntent: t.researchIntent,
      updatedAtIso: t.updatedAt.toISOString(),
      primaryRelevance: rel.primary,
      relevanceExplanation: rel.explanation,
      openClaimCount: openForTarget,
      sourceCount: t._count.sources,
    };
  });

  const openClaims: SceneResearchClaimItem[] = openClaimsRows.map((c) => {
    const rel = classifyTargetRelevance({
      linkedSceneIds: c.researchTarget.linkedSceneIds,
      linkedChapterIds: c.researchTarget.linkedChapterIds,
      linkedPersonIds: c.researchTarget.linkedPersonIds,
      linkedPlaceIds: c.researchTarget.linkedPlaceIds,
      sceneId: scene.id,
      chapterId,
      personIds,
      placeIds,
    });
    const hasContradiction = contradictionSvc.listContradictions(c.comparisons.map(toCanonComparisonRecord)).length > 0;
    const compStatus = c.comparisons.length === 0 ? "not_compared" : "compared";
    return {
      claimId: c.id,
      researchTargetId: c.researchTargetId,
      targetName: c.researchTarget.targetName,
      sourceId: c.sourceId,
      sourceTitle: c.source.sourceTitle,
      claimText: c.claimText,
      normalizedPreview: c.structuredValue != null ? preview(JSON.stringify(c.structuredValue), 120) : null,
      claimStatus: c.claimStatus,
      extractionMethod: c.extractionMethod,
      extractionHonestyLabel: "heuristic_stub",
      comparisonStatus: compStatus,
      contradictionFlag: hasContradiction,
      evidenceSnippet: c.evidence?.summary ? preview(c.evidence.summary, 220) : null,
      priorDecisionCount: c._count.decisions,
      relevance: rel.primary,
      relevanceExplanation: rel.explanation,
    };
  });

  const sources: SceneResearchSourceItem[] = sourcesRows.map((s) => {
    let fetchHonesty: SceneResearchSourceItem["fetchHonestyLabel"] = "no_network";
    if (s.ingestMethod === "author_url_fetch") fetchHonesty = "bounded_single_url";
    if (s.ingestMethod === "author_url_fetch_failed") fetchHonesty = "fetch_failed";
    return {
      sourceId: s.id,
      researchTargetId: s.researchTargetId,
      targetName: s.researchTarget.targetName,
      sourceTitle: s.sourceTitle,
      sourceTrustTier: s.sourceTrustTier,
      ingestMethod: s.ingestMethod,
      provenanceHash: s.provenanceHash,
      fetchHonestyLabel: fetchHonesty,
      accessDateIso: s.accessDate.toISOString(),
    };
  });

  const acceptedCanon: SceneAcceptedCanonItem[] = acceptedCanonRows.map((r) => {
    const { r: rel, explanation } = canonRelevance({ targetType: r.targetType, targetId: r.targetId }, scene.id, chapterId);
    const links = asStringArray(r.sourceLinks);
    return {
      canonRecordId: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      knowledgeType: r.knowledgeType,
      contentPreview: preview(r.content, 280),
      canonicalStatus: r.canonicalStatus,
      historicalRealityStatus: r.historicalRealityStatus,
      storyRealityStatus: r.storyRealityStatus,
      sourceLinkCount: links.length,
      updatedAtIso: r.updatedAt.toISOString(),
      lastCanonDecisionAtIso: latestCanonDecisionIso.get(r.id) ?? null,
      relevance: rel,
      relevanceExplanation: explanation,
      trustSummary: links.length ? `${links.length} linked source/claim ref(s) on record` : "No explicit source links on canon row (audit still via decision history).",
    };
  });

  const acceptedCanonGrouped = groupAcceptedCanonByTargetType(acceptedCanon);

  const decisionHistory: SceneResearchDecisionHistoryItem[] = decisionHistoryRows.map((d) => ({
    decisionId: d.id,
    createdAtIso: d.createdAt.toISOString(),
    claimId: d.claimId,
    claimTextPreview: preview(d.claim.claimText, 120),
    authorDecision: d.authorDecision,
    decisionReasonPreview: preview(d.decisionReason, 160),
    resultingCanonAction: d.resultingCanonAction,
    resultingCanonRecordId: d.resultingCanonRecordId,
    targetName: d.claim.researchTarget?.targetName ?? null,
    overrideNotesPreview: preview(d.overrideNotes, 120),
  }));

  const entityImpacts: SceneResearchEntityImpact[] = [];

  for (const p of scene.persons) {
    const acceptedCanonCount = acceptedCanonRows.filter((r) => r.targetType === "person" && r.targetId === p.id).length;
    const targetIdsForPerson = targets.filter((t) => asStringArray(t.linkedPersonIds).includes(p.id)).map((t) => t.id);
    const openClaimCount = openClaimsRows.filter((c) => targetIdsForPerson.includes(c.researchTargetId)).length;
    const contradictionCount = contradictions.filter((x) => {
      const row = openClaimsRows.find((c) => c.id === x.claimId);
      return Boolean(row && targetIdsForPerson.includes(row.researchTargetId));
    }).length;
    entityImpacts.push({
      entityKind: "person",
      entityId: p.id,
      entityName: p.name,
      acceptedCanonCount,
      openClaimCount,
      contradictionCount,
      lastDecisionAtIso: lastDecisionIsoForTargetSubset(targetIdsForPerson),
    });
  }

  for (const pl of scene.places) {
    const acceptedCanonCount = acceptedCanonRows.filter((r) => r.targetType === "place" && r.targetId === pl.id).length;
    const targetIdsForPlace = targets.filter((t) => asStringArray(t.linkedPlaceIds).includes(pl.id)).map((t) => t.id);
    const openClaimCount = openClaimsRows.filter((c) => targetIdsForPlace.includes(c.researchTargetId)).length;
    const contradictionCount = contradictions.filter((x) => {
      const row = openClaimsRows.find((c) => c.id === x.claimId);
      return Boolean(row && targetIdsForPlace.includes(row.researchTargetId));
    }).length;
    entityImpacts.push({
      entityKind: "place",
      entityId: pl.id,
      entityName: pl.name,
      acceptedCanonCount,
      openClaimCount,
      contradictionCount,
      lastDecisionAtIso: lastDecisionIsoForTargetSubset(targetIdsForPlace),
    });
  }

  const promptImpact: SceneResearchPromptImpactSummary = {
    ricreAcceptedCanonBundleLoaded: Boolean(ricreBundle && ricreBundle.recordCount > 0),
    activeAcceptedCanonRecordCount: ricreBundle?.recordCount ?? 0,
    ricrePromptBlockEligible: Boolean(ricreBundle && ricreBundle.recordCount > 0),
    subordinationNote:
      "RICRE_ACCEPTED_CANON lines are injected only when active accepted rows exist for this scene’s scope; they remain subordinate to scene contract facts and P2-E narrative sources.",
    honestyNotes: [
      "Bundle is assembled by `loadAcceptedRicreCanonKnowledgeForScene` — same path as scene generation input.",
      "Extraction remains heuristic_stub where claims were not LLM-derived.",
    ],
  };

  const hashImpact: SceneResearchHashImpactSummary = {
    canonicalHashIncludesRicreBundle: Boolean(ricreBundle && ricreBundle.recordCount > 0),
    explanation:
      "`computeSceneGenerationInputHash` includes a stable projection of `ricreAcceptedCanonKnowledge` only when that bundle is present on the generation input (non-empty accepted rows).",
  };

  const summary: SceneResearchSummary = {
    acceptedCanonCount: acceptedCanonRows.length,
    openClaimsCount: openClaimsRows.length,
    contradictionShapedCount: contradictions.length,
    linkedTargetsCount: targets.length,
    lastRelevantDecisionAtIso: lastDecision?.createdAt.toISOString() ?? null,
    advisoryLabels: [
      "Contradiction-shaped results are approximate — not proof of factual falsehood.",
      "Heuristic extraction — claims are not certainties until you record a canon decision.",
    ],
  };

  const quickActions: SceneResearchQuickActionState = {
    canCreateSceneTarget: true,
    canIngestForSceneTargets: targets.length > 0,
    hasSceneLinkedTargets: targets.some((t) => asStringArray(t.linkedSceneIds).includes(scene.id)),
    unresolvedClaimIds: openClaimsRows.map((c) => c.id),
  };

  return {
    contractVersion: SCENE_RESEARCH_TAB_CONTRACT_VERSION,
    scene: {
      id: scene.id,
      chapterId,
      title: scene.description,
      chapterTitle: scene.chapter.title,
    },
    summary,
    acceptedCanon,
    acceptedCanonGrouped,
    linkedTargets,
    openClaims,
    contradictions,
    sources,
    entityImpacts,
    decisionHistory,
    promptImpact,
    hashImpact,
    quickActions,
    honestyBanner:
      "Scene research tab is a visibility lens into RICRE — governance and queue depth remain in /admin/research. Nothing here bypasses author decisions.",
  };
}

/**
 * Verifies a research target is linked to the scene graph (for scene-scoped writes).
 */
export async function assertResearchTargetLinkedToSceneContext(sceneId: string, researchTargetId: string): Promise<boolean> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, persons: { select: { id: true } }, places: { select: { id: true } } },
  });
  if (!scene) return false;
  const ids = await findResearchTargetIdsLinkedToSceneContext({
    sceneId: scene.id,
    chapterId: scene.chapterId,
    personIds: scene.persons.map((p) => p.id),
    placeIds: scene.places.map((p) => p.id),
  });
  return ids.includes(researchTargetId);
}
