import { prisma } from "@/lib/prisma";
import {
  ResearchComparisonRerunInputSchema,
  ResearchIngestionManualInputSchema,
  ResearchIngestionUrlInputSchema,
  ResearchTargetCreateInputSchema,
  ResearchWorkbenchDecisionInputSchema,
  mapWorkbenchDecisionToAuthorType,
} from "@/lib/domain/research-workbench-validation";
import { CanonComparisonService } from "@/lib/services/canon-comparison-service";
import { CanonReconciliationService } from "@/lib/services/canon-reconciliation-service";
import { ResearchClaimExtractionService } from "@/lib/services/research-claim-extraction-service";
import { ResearchSourceIngestionService } from "@/lib/services/research-source-ingestion-service";

const ingestion = new ResearchSourceIngestionService();
const extraction = new ResearchClaimExtractionService();
const comparison = new CanonComparisonService();
const reconciliation = new CanonReconciliationService();

export type OrchestrationResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

export async function orchestrateCreateResearchTarget(input: unknown): Promise<OrchestrationResult<{ targetId: string }>> {
  const parsed = ResearchTargetCreateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const d = parsed.data;
  const row = await ingestion.createResearchTarget({
    targetType: d.targetType,
    targetName: d.targetName,
    researchIntent: d.researchIntent ?? null,
    linkedSceneIds: d.linkedSceneIds,
    linkedChapterIds: d.linkedChapterIds,
    linkedBookIds: d.linkedBookIds,
    linkedCharacterIds: d.linkedCharacterIds,
    linkedSettingIds: d.linkedSettingIds,
    linkedEraIds: d.linkedEraIds,
    linkedThreadIds: d.linkedThreadIds,
  });
  return { ok: true, data: { targetId: row.id } };
}

export async function orchestrateIngestManualSource(input: unknown): Promise<
  OrchestrationResult<{ sourceId: string; ingestMethod: string }>
> {
  const parsed = ResearchIngestionManualInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const r = await ingestion.ingestManualTextForTarget({
    researchTargetId: parsed.data.researchTargetId,
    sourceTitle: parsed.data.sourceTitle,
    manualText: parsed.data.manualText,
    sourceTrustTier: parsed.data.sourceTrustTier,
    publisher: parsed.data.publisher ?? null,
    authorAttribution: parsed.data.authorAttribution ?? null,
  });
  return { ok: true, data: { sourceId: r.sourceId, ingestMethod: r.ingestMethod } };
}

export async function orchestrateIngestUrlSource(input: unknown): Promise<
  OrchestrationResult<{ sourceId: string; ingestMethod: string }>
> {
  const parsed = ResearchIngestionUrlInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const d = parsed.data;
  const r = await ingestion.ingestUrlForTarget({
    researchTargetId: d.researchTargetId,
    sourceTitle: d.sourceTitle,
    sourceUrl: d.sourceUrl,
    fetchRemote: d.fetchRemote,
    publisher: d.publisher ?? null,
    authorAttribution: d.authorAttribution ?? null,
    publicationDate: d.publicationDate ?? null,
  });
  return { ok: true, data: { sourceId: r.sourceId, ingestMethod: r.ingestMethod } };
}

export async function orchestrateExtractClaimsForSource(sourceId: string): Promise<OrchestrationResult<{ evidenceId: string; claimIds: string[] }>> {
  if (!sourceId.trim()) return { ok: false, code: "validation", message: "sourceId required." };
  try {
    const out = await extraction.extractClaimsForSource(sourceId);
    return { ok: true, data: out };
  } catch (e) {
    return { ok: false, code: "extract_failed", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function orchestrateRunComparisonsForClaim(claimId: string): Promise<OrchestrationResult<{ comparisonCount: number }>> {
  const parsed = ResearchComparisonRerunInputSchema.safeParse({ claimId });
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  try {
    await prisma.authorCanonComparison.deleteMany({ where: { claimId: parsed.data.claimId } });
    const rows = await comparison.compareClaimToCanon(parsed.data.claimId);
    await comparison.persistComparisons(parsed.data.claimId, rows);
    return { ok: true, data: { comparisonCount: rows.length } };
  } catch (e) {
    return { ok: false, code: "compare_failed", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function orchestrateSubmitAuthorDecision(input: unknown): Promise<
  OrchestrationResult<{ decisionId: string; canonRecordId: string | null }>
> {
  const parsed = ResearchWorkbenchDecisionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const d = parsed.data;
  const authorDecision = mapWorkbenchDecisionToAuthorType(d.workbenchDecision);

  try {
    const out = await reconciliation.applyAuthorDecision({
      claimId: d.claimId,
      authorDecision,
      decisionReason: d.decisionReason,
      decidedBy: d.decidedBy ?? null,
      overrideNotes: d.overrideNotes ?? null,
      canonTargetType: d.canonTargetType,
      canonTargetId: d.canonTargetId,
      knowledgeType: d.knowledgeType,
      historicalRealityStatus: d.historicalRealityStatus,
      storyRealityStatus: d.storyRealityStatus,
    });
    return { ok: true, data: { decisionId: out.decisionId, canonRecordId: out.canonRecordId } };
  } catch (e) {
    return { ok: false, code: "decision_failed", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function loadResearchClaimDetail(claimId: string) {
  const claim = await prisma.authorResearchClaim.findUnique({
    where: { id: claimId },
    include: {
      source: true,
      researchTarget: true,
      evidence: true,
      comparisons: { orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  return claim;
}

