"use server";

import { revalidatePath } from "next/cache";

import { buildResearchDownstreamImpactSummary } from "@/lib/services/research-workbench-downstream-impact-service";
import {
  loadResearchClaimDetail,
  orchestrateCreateResearchTarget,
  orchestrateExtractClaimsForSource,
  orchestrateIngestManualSource,
  orchestrateIngestUrlSource,
  orchestrateRunComparisonsForClaim,
  orchestrateSubmitAuthorDecision,
} from "@/lib/services/research-workbench-orchestration-service";

// TODO(auth): Wire admin RBAC when available; today follows trusted admin surface.

export async function researchWorkbenchCreateTargetAction(input: unknown) {
  const r = await orchestrateCreateResearchTarget(input);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchIngestManualAction(input: unknown) {
  const r = await orchestrateIngestManualSource(input);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchIngestUrlAction(input: unknown) {
  const r = await orchestrateIngestUrlSource(input);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchExtractAction(sourceId: string) {
  const r = await orchestrateExtractClaimsForSource(sourceId);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchCompareAction(claimId: string) {
  const r = await orchestrateRunComparisonsForClaim(claimId);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchSubmitDecisionAction(input: unknown) {
  const r = await orchestrateSubmitAuthorDecision(input);
  if (r.ok) revalidatePath("/admin/research");
  return r;
}

export async function researchWorkbenchFetchClaimDetailAction(claimId: string) {
  return loadResearchClaimDetail(claimId);
}

export async function researchWorkbenchDownstreamImpactAction(researchTargetId: string) {
  return buildResearchDownstreamImpactSummary(researchTargetId);
}
