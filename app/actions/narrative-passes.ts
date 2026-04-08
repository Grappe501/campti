"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { describePerspectiveRichly, describeWorldStateRichly } from "@/lib/descriptive-synthesis";
import {
  formatFullStructuredNarrativePass,
  generateFullStructuredNarrativePass,
  generateSceneEmbodiedPass,
  generateSceneEnvironmentPass,
  generateSceneInteriorPass,
  generateSceneOpeningPass,
  generateSceneRelationshipPressurePass,
  generateSceneSymbolicPass,
} from "@/lib/embodied-narrative-generation";
import {
  enhanceWorldStateDescription,
  enhancePerspectiveDescription,
  enhanceFragmentInterpretation,
  enhanceRelationshipNarrative,
  enhanceClusterSummary,
} from "@/lib/descriptive-ai";
import { describeClusterRichly, describeFragmentRichly, describeRelationshipDyadRichly } from "@/lib/descriptive-synthesis";
import {
  deletePassSchema,
  enhanceMetaSceneSchema,
  generatePassActionSchema,
  narrativePassStatusSchema,
  updatePassStatusSchema,
} from "@/lib/descriptive-validation";
import { DEFAULT_WORLD_PREVIEW_STYLE } from "@/lib/narrative-style";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

async function resolveMetaFromPass(passId: string): Promise<string | null> {
  const row = await prisma.metaSceneNarrativePass.findUnique({
    where: { id: passId },
    select: { metaSceneId: true },
  });
  return row?.metaSceneId ?? null;
}

export async function generateMetaSceneNarrativePassAction(formData: FormData) {
  const parsed = generatePassActionSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
    passType: formData.get("passType"),
    styleMode: formData.get("styleMode"),
  });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const { metaSceneId, passType, styleMode } = parsed.data;

  let content: string | null = null;
  let summary: string | null = null;

  switch (passType) {
    case "opening":
      content = await generateSceneOpeningPass(metaSceneId);
      break;
    case "interior":
      content = await generateSceneInteriorPass(metaSceneId);
      break;
    case "environment":
      content = await generateSceneEnvironmentPass(metaSceneId);
      break;
    case "relationship_pressure":
      content = await generateSceneRelationshipPressurePass(metaSceneId);
      break;
    case "symbolic":
      content = await generateSceneSymbolicPass(metaSceneId);
      break;
    case "embodied":
      content = await generateSceneEmbodiedPass(metaSceneId);
      break;
    case "full_structured": {
      const full = await generateFullStructuredNarrativePass(metaSceneId);
      content = full ? formatFullStructuredNarrativePass(full) : null;
      summary = full ? `${full.povPersonName ?? "POV"} · ${full.placeName ?? "place"}` : null;
      break;
    }
    default:
      redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=validation`);
  }

  if (!content?.trim()) redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);

  try {
    await prisma.metaSceneNarrativePass.create({
      data: {
        metaSceneId,
        passType,
        styleMode: styleMode ?? null,
        content,
        summary,
        confidence: 3,
        status: "generated",
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }

  revalidatePath(`/admin/meta-scenes/${metaSceneId}/compose`);
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=pass`);
}

export async function updateNarrativePassStatusAction(formData: FormData) {
  const parsed = updatePassStatusSchema.safeParse({
    passId: formData.get("passId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const d = parsed.data;
  const metaHint = str(formData.get("metaSceneId"));
  const metaId = (await resolveMetaFromPass(d.passId)) ?? metaHint ?? null;

  try {
    await prisma.metaSceneNarrativePass.update({
      where: { id: d.passId },
      data: {
        status: d.status,
        notes: d.notes?.length ? d.notes : null,
      },
    });
  } catch {
    redirect(metaId ? `/admin/meta-scenes/${metaId}/compose?error=db` : "/admin/brain?error=db");
  }
  if (metaId) revalidatePath(`/admin/meta-scenes/${metaId}/compose`);
  revalidatePath("/admin/brain");
  redirect(metaId ? `/admin/meta-scenes/${metaId}/compose?saved=passstatus` : "/admin/brain");
}

export async function deleteNarrativePassAction(formData: FormData) {
  const parsed = deletePassSchema.safeParse({ passId: formData.get("passId") });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const metaId = (await resolveMetaFromPass(parsed.data.passId)) ?? str(formData.get("metaSceneId"));
  try {
    await prisma.metaSceneNarrativePass.delete({ where: { id: parsed.data.passId } });
  } catch {
    redirect(metaId ? `/admin/meta-scenes/${metaId}/compose?error=db` : "/admin/brain?error=db");
  }
  if (metaId) revalidatePath(`/admin/meta-scenes/${metaId}/compose`);
  revalidatePath("/admin/brain");
  redirect(metaId ? `/admin/meta-scenes/${metaId}/compose?saved=passdel` : "/admin/brain");
}

/** Deterministic template synthesis — saves to MetaScene cache fields (author fields untouched). */
export async function generateDescriptivePreviewAction(formData: FormData) {
  const parsed = enhanceMetaSceneSchema.safeParse({ metaSceneId: formData.get("metaSceneId") });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const { metaSceneId } = parsed.data;

  const rich = await describeWorldStateRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  const persp = await describePerspectiveRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  if (!rich) redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);

  const generatedWorldSummary = [
    rich.povSummary,
    rich.environmentSummary,
    rich.emotionalContext,
    rich.constraintsSummary,
    rich.symbolicSummary,
  ].join("\n\n---\n\n");

  try {
    await prisma.metaScene.update({
      where: { id: metaSceneId },
      data: {
        generatedWorldSummary,
        generatedPerspectiveSummary: persp,
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }
  revalidatePath(`/admin/meta-scenes/${metaSceneId}/compose`);
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=preview`);
}

export async function enhanceMetaSceneWithAIAction(formData: FormData) {
  const parsed = enhanceMetaSceneSchema.safeParse({ metaSceneId: formData.get("metaSceneId") });
  if (!parsed.success) redirect("/admin/meta-scenes?error=validation");
  const { metaSceneId } = parsed.data;

  const [w, p] = await Promise.all([
    enhanceWorldStateDescription(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE),
    enhancePerspectiveDescription(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE),
  ]);

  if (!w.ok && !p.ok) {
    const msg = w.skipped || p.skipped ? "no_openai" : "ai_failed";
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=${msg}`);
  }

  try {
    await prisma.metaScene.update({
      where: { id: metaSceneId },
      data: {
        ...(w.ok ? { generatedWorldSummary: w.text } : {}),
        ...(p.ok ? { generatedPerspectiveSummary: p.text } : {}),
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }
  revalidatePath(`/admin/meta-scenes/${metaSceneId}/compose`);
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=aienhance`);
}

export async function generateFragmentInterpretationCacheAction(formData: FormData) {
  const id = str(formData.get("fragmentId"));
  if (!id) redirect("/admin/fragments?error=validation");
  const text = await describeFragmentRichly(id);
  try {
    await prisma.fragment.update({ where: { id }, data: { generatedInterpretationSummary: text } });
  } catch {
    redirect(`/admin/fragments/${id}?error=db`);
  }
  revalidatePath(`/admin/fragments/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${id}?saved=synthesis`);
}

export async function enhanceFragmentInterpretationCacheAction(formData: FormData) {
  const id = str(formData.get("fragmentId"));
  if (!id) redirect("/admin/fragments?error=validation");
  const r = await enhanceFragmentInterpretation(id);
  if (!r.ok) redirect(`/admin/fragments/${id}?error=${r.skipped ? "no_openai" : "ai"}`);
  try {
    await prisma.fragment.update({ where: { id }, data: { generatedInterpretationSummary: r.text } });
  } catch {
    redirect(`/admin/fragments/${id}?error=db`);
  }
  revalidatePath(`/admin/fragments/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${id}?saved=synthesisai`);
}

export async function generateRelationshipDynamicCacheAction(formData: FormData) {
  const id = str(formData.get("relationshipId"));
  if (!id) redirect("/admin/relationships?error=validation");
  const text = await describeRelationshipDyadRichly(id);
  try {
    await prisma.characterRelationship.update({ where: { id }, data: { generatedDynamicSummary: text } });
  } catch {
    redirect(`/admin/relationships/${id}?error=db`);
  }
  revalidatePath(`/admin/relationships/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/relationships/${id}?saved=synthesis`);
}

export async function enhanceRelationshipDynamicCacheAction(formData: FormData) {
  const id = str(formData.get("relationshipId"));
  if (!id) redirect("/admin/relationships?error=validation");
  const r = await enhanceRelationshipNarrative(id);
  if (!r.ok) redirect(`/admin/relationships/${id}?error=${r.skipped ? "no_openai" : "ai"}`);
  try {
    await prisma.characterRelationship.update({ where: { id }, data: { generatedDynamicSummary: r.text } });
  } catch {
    redirect(`/admin/relationships/${id}?error=db`);
  }
  revalidatePath(`/admin/relationships/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/relationships/${id}?saved=synthesisai`);
}

export async function generateClusterSynthesisCacheAction(formData: FormData) {
  const id = str(formData.get("clusterId"));
  if (!id) redirect("/admin/clusters?error=validation");
  const text = await describeClusterRichly(id);
  try {
    await prisma.fragmentCluster.update({ where: { id }, data: { generatedClusterSynthesis: text } });
  } catch {
    redirect(`/admin/clusters/${id}?error=db`);
  }
  revalidatePath(`/admin/clusters/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/clusters/${id}?saved=synthesis`);
}

export async function enhanceClusterSummaryCacheAction(formData: FormData) {
  const id = str(formData.get("clusterId"));
  if (!id) redirect("/admin/clusters?error=validation");
  const r = await enhanceClusterSummary(id);
  if (!r.ok) redirect(`/admin/clusters/${id}?error=${r.skipped ? "no_openai" : "ai"}`);
  try {
    await prisma.fragmentCluster.update({ where: { id }, data: { generatedClusterSynthesis: r.text } });
  } catch {
    redirect(`/admin/clusters/${id}?error=db`);
  }
  revalidatePath(`/admin/clusters/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/clusters/${id}?saved=clustersynth`);
}
