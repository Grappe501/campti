"use server";

import { revalidatePath } from "next/cache";

import {
  SceneResearchCompareActionSchema,
  SceneResearchDecisionActionSchema,
  SceneResearchExtractActionSchema,
  SceneResearchManualIngestActionSchema,
  SceneResearchTabCreateTargetActionSchema,
  SceneResearchUrlIngestActionSchema,
} from "@/lib/domain/scene-research-tab-validation";
import { prisma } from "@/lib/prisma";
import { assertResearchTargetLinkedToSceneContext } from "@/lib/services/scene-research-tab-loader-service";
import {
  orchestrateCreateResearchTarget,
  orchestrateExtractClaimsForSource,
  orchestrateIngestManualSource,
  orchestrateIngestUrlSource,
  orchestrateRunComparisonsForClaim,
  orchestrateSubmitAuthorDecision,
} from "@/lib/services/research-workbench-orchestration-service";

// TODO(auth): trusted admin surface — same posture as research workbench actions.

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; code: string; message: string };
type Result<T> = Ok<T> | Fail;

async function assertSourceLinkedToScene(sceneId: string, sourceId: string): Promise<boolean> {
  const s = await prisma.authorResearchSource.findUnique({
    where: { id: sourceId },
    select: { researchTargetId: true },
  });
  if (!s) return false;
  return assertResearchTargetLinkedToSceneContext(sceneId, s.researchTargetId);
}

async function assertClaimLinkedToScene(sceneId: string, claimId: string): Promise<boolean> {
  const c = await prisma.authorResearchClaim.findUnique({
    where: { id: claimId },
    select: { researchTargetId: true },
  });
  if (!c) return false;
  return assertResearchTargetLinkedToSceneContext(sceneId, c.researchTargetId);
}

export async function sceneResearchCreateTargetAction(input: unknown): Promise<Result<{ targetId: string }>> {
  const parsed = SceneResearchTabCreateTargetActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, anchorSceneId: _anchor, ...targetBody } = parsed.data;
  const r = await orchestrateCreateResearchTarget(targetBody);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}

export async function sceneResearchIngestManualAction(input: unknown): Promise<Result<{ sourceId: string; ingestMethod: string }>> {
  const parsed = SceneResearchManualIngestActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, ...ingest } = parsed.data;
  const ok = await assertResearchTargetLinkedToSceneContext(sceneId, ingest.researchTargetId);
  if (!ok) return { ok: false, code: "scope", message: "Research target is not linked to this scene graph." };
  const r = await orchestrateIngestManualSource(ingest);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}

export async function sceneResearchIngestUrlAction(input: unknown): Promise<Result<{ sourceId: string; ingestMethod: string }>> {
  const parsed = SceneResearchUrlIngestActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, ...ingest } = parsed.data;
  const ok = await assertResearchTargetLinkedToSceneContext(sceneId, ingest.researchTargetId);
  if (!ok) return { ok: false, code: "scope", message: "Research target is not linked to this scene graph." };
  const r = await orchestrateIngestUrlSource(ingest);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}

export async function sceneResearchExtractAction(input: unknown): Promise<Result<{ evidenceId: string; claimIds: string[] }>> {
  const parsed = SceneResearchExtractActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, sourceId } = parsed.data;
  const ok = await assertSourceLinkedToScene(sceneId, sourceId);
  if (!ok) return { ok: false, code: "scope", message: "Source is not under a research target linked to this scene." };
  const r = await orchestrateExtractClaimsForSource(sourceId);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}

export async function sceneResearchCompareAction(input: unknown): Promise<Result<{ comparisonCount: number }>> {
  const parsed = SceneResearchCompareActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, claimId } = parsed.data;
  const ok = await assertClaimLinkedToScene(sceneId, claimId);
  if (!ok) return { ok: false, code: "scope", message: "Claim is not under a research target linked to this scene." };
  const r = await orchestrateRunComparisonsForClaim(claimId);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}

export async function sceneResearchSubmitDecisionAction(input: unknown): Promise<Result<{ decisionId: string; canonRecordId: string | null }>> {
  const parsed = SceneResearchDecisionActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { sceneId, ...decision } = parsed.data;
  const ok = await assertClaimLinkedToScene(sceneId, decision.claimId);
  if (!ok) return { ok: false, code: "scope", message: "Claim is not under a research target linked to this scene." };
  const r = await orchestrateSubmitAuthorDecision(decision);
  if (!r.ok) return r;
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath("/admin/research");
  return r;
}
