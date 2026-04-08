"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { FRAGMENT_DECOMPOSITION_VERSION } from "@/lib/fragment-constants";
import {
  buildFragmentSummary,
  normalizeFragmentText,
  scoreAmbiguity,
  scoreConfidence,
  splitTextIntoCandidateFragments,
  type CandidateFragmentUnit,
} from "@/lib/fragment-decomposition";
import { refineFragmentSplit } from "@/lib/fragment-refinement";
import { runFragmentDecompositionAssist } from "@/lib/fragment-ai-assist";
import {
  createChildFragmentsFromParentText,
  createFragmentsFromUnits,
  createRefinedChildFragmentsFromParent,
  countFragmentsForSource,
} from "@/lib/fragment-service";
import {
  fragmentCreateSchema,
  fragmentDecomposeChildSchema,
  fragmentDecomposeSaveSchema,
  fragmentInsightCreateSchema,
  fragmentLinkCreateSchema,
  fragmentLinkDeleteSchema,
  fragmentReviewSchema,
  fragmentUpdateSchema,
  placementCandidateDecisionSchema,
} from "@/lib/fragment-validation";
import { saveRefinedChildrenSchema } from "@/lib/scene-intelligence-validation";
import {
  deriveEmotionalUse,
  deriveHiddenMeaning,
  deriveNarrativeUse,
  deriveSceneReadinessScore,
  deriveSurfaceMeaning,
  deriveSymbolicUse,
} from "@/lib/fragment-interpretation";
import {
  getEntityHintsForDecomposition,
  type EntityHintsForDecomposition,
} from "@/lib/data-access";
import { prisma } from "@/lib/prisma";
import type { FragmentAssistResult } from "@/lib/fragment-ai-assist";

function mapHints(h: EntityHintsForDecomposition) {
  return {
    chapterTitles: h.chapterTitles,
    sceneLabels: h.sceneLabels,
    symbolNames: h.symbolNames,
    placeNames: h.placeNames,
    personNames: h.personNames,
    openQuestionTitles: h.openQuestionTitles,
  };
}

export async function createFragmentAction(formData: FormData) {
  const parsed = fragmentCreateSchema.safeParse({
    title: formData.get("title") ?? undefined,
    fragmentType: formData.get("fragmentType"),
    visibility: formData.get("visibility") ?? VisibilityStatus.PRIVATE,
    recordType: formData.get("recordType") ?? undefined,
    sourceId: formData.get("sourceId") ?? undefined,
    sourceChunkId: formData.get("sourceChunkId") ?? undefined,
    sourceTextId: formData.get("sourceTextId") ?? undefined,
    parentFragmentId: formData.get("parentFragmentId") ?? undefined,
    text: formData.get("text"),
    excerpt: formData.get("excerpt") ?? undefined,
    summary: formData.get("summary") ?? undefined,
    emotionalTone: formData.get("emotionalTone") ?? undefined,
    narrativeFunction: formData.get("narrativeFunction") ?? undefined,
    timeHint: formData.get("timeHint") ?? undefined,
    confidence: formData.get("confidence"),
    ambiguityLevel: formData.get("ambiguityLevel"),
    placementStatus: formData.get("placementStatus") ?? "unplaced",
    reviewStatus: formData.get("reviewStatus") ?? "pending",
    notes: formData.get("notes") ?? undefined,
    decompositionVersion: formData.get("decompositionVersion") ?? undefined,
    aiGenerated: formData.get("aiGenerated") === "true",
    generatedByRunId: formData.get("generatedByRunId") ?? undefined,
    sourceTraceNote: formData.get("sourceTraceNote") ?? undefined,
    primaryFragmentType: formData.get("primaryFragmentType") ?? undefined,
    secondaryFragmentTypes: formData.get("secondaryFragmentTypes") ?? undefined,
    surfaceMeaning: formData.get("surfaceMeaning") ?? undefined,
    hiddenMeaning: formData.get("hiddenMeaning") ?? undefined,
    symbolicUse: formData.get("symbolicUse") ?? undefined,
    emotionalUse: formData.get("emotionalUse") ?? undefined,
    narrativeUse: formData.get("narrativeUse") ?? undefined,
    decompositionPressure: formData.get("decompositionPressure") ?? undefined,
    sceneReadinessScore: formData.get("sceneReadinessScore"),
    clusterHint: formData.get("clusterHint") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/admin/fragments?error=validation");
  }

  const d = parsed.data;
  try {
    await prisma.fragment.create({
      data: {
        title: d.title?.length ? d.title : null,
        fragmentType: d.fragmentType,
        primaryFragmentType: d.primaryFragmentType ?? d.fragmentType,
        secondaryFragmentTypes: d.secondaryFragmentTypes ?? undefined,
        surfaceMeaning: d.surfaceMeaning?.length ? d.surfaceMeaning : null,
        hiddenMeaning: d.hiddenMeaning?.length ? d.hiddenMeaning : null,
        symbolicUse: d.symbolicUse?.length ? d.symbolicUse : null,
        emotionalUse: d.emotionalUse?.length ? d.emotionalUse : null,
        narrativeUse: d.narrativeUse?.length ? d.narrativeUse : null,
        decompositionPressure: d.decompositionPressure ?? null,
        sceneReadinessScore: d.sceneReadinessScore ?? null,
        clusterHint: d.clusterHint?.length ? d.clusterHint : null,
        visibility: d.visibility ?? VisibilityStatus.PRIVATE,
        recordType: d.recordType ?? null,
        sourceId: d.sourceId ?? null,
        sourceChunkId: d.sourceChunkId ?? null,
        sourceTextId: d.sourceTextId ?? null,
        parentFragmentId: d.parentFragmentId ?? null,
        text: d.text,
        excerpt: d.excerpt?.length ? d.excerpt : null,
        summary: d.summary?.length ? d.summary : null,
        emotionalTone: d.emotionalTone?.length ? d.emotionalTone : null,
        narrativeFunction: d.narrativeFunction?.length ? d.narrativeFunction : null,
        timeHint: d.timeHint?.length ? d.timeHint : null,
        confidence: d.confidence ?? null,
        ambiguityLevel: d.ambiguityLevel ?? null,
        placementStatus: d.placementStatus ?? "unplaced",
        reviewStatus: d.reviewStatus ?? "pending",
        notes: d.notes?.length ? d.notes : null,
        decompositionVersion: d.decompositionVersion ?? null,
        aiGenerated: d.aiGenerated ?? false,
        generatedByRunId: d.generatedByRunId ?? null,
        sourceTraceNote: d.sourceTraceNote?.length ? d.sourceTraceNote : null,
      },
    });
  } catch {
    redirect("/admin/fragments?error=db");
  }

  revalidatePath("/admin/fragments");
  revalidatePath("/admin/brain");
  redirect("/admin/fragments?saved=1");
}

export async function updateFragmentAction(formData: FormData) {
  const parsed = fragmentUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? undefined,
    fragmentType: formData.get("fragmentType") ?? undefined,
    visibility: formData.get("visibility") ?? undefined,
    recordType: formData.get("recordType") ?? undefined,
    sourceId: formData.get("sourceId") ?? undefined,
    text: formData.get("text") ?? undefined,
    excerpt: formData.get("excerpt") ?? undefined,
    summary: formData.get("summary") ?? undefined,
    emotionalTone: formData.get("emotionalTone") ?? undefined,
    narrativeFunction: formData.get("narrativeFunction") ?? undefined,
    timeHint: formData.get("timeHint") ?? undefined,
    confidence: formData.get("confidence"),
    ambiguityLevel: formData.get("ambiguityLevel"),
    placementStatus: formData.get("placementStatus") ?? undefined,
    reviewStatus: formData.get("reviewStatus") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    sourceTraceNote: formData.get("sourceTraceNote") ?? undefined,
    primaryFragmentType: formData.get("primaryFragmentType") ?? undefined,
    secondaryFragmentTypes: formData.get("secondaryFragmentTypes") ?? undefined,
    surfaceMeaning: formData.get("surfaceMeaning") ?? undefined,
    hiddenMeaning: formData.get("hiddenMeaning") ?? undefined,
    symbolicUse: formData.get("symbolicUse") ?? undefined,
    emotionalUse: formData.get("emotionalUse") ?? undefined,
    narrativeUse: formData.get("narrativeUse") ?? undefined,
    decompositionPressure: formData.get("decompositionPressure") ?? undefined,
    sceneReadinessScore: formData.get("sceneReadinessScore"),
    clusterHint: formData.get("clusterHint") ?? undefined,
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(id ? `/admin/fragments/${id}?error=validation` : "/admin/fragments?error=validation");
  }

  const d = parsed.data;
  const { id, ...rest } = d;
  const data = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>;

  if (typeof data.secondaryFragmentTypes === "string") {
    try {
      const p = JSON.parse(data.secondaryFragmentTypes) as unknown;
      data.secondaryFragmentTypes = Array.isArray(p) ? p : undefined;
    } catch {
      delete data.secondaryFragmentTypes;
    }
  }

  try {
    await prisma.fragment.update({
      where: { id },
      data: data as Prisma.FragmentUpdateInput,
    });
  } catch {
    redirect(`/admin/fragments/${id}?error=db`);
  }

  revalidatePath("/admin/fragments");
  revalidatePath(`/admin/fragments/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${id}?saved=1`);
}

export async function applyFragmentInterpretationHeuristicsAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id.length) redirect("/admin/fragments?error=validation");

  const frag = await prisma.fragment.findUnique({ where: { id } });
  if (!frag) redirect("/admin/fragments?error=not_found");

  try {
    await prisma.fragment.update({
      where: { id },
      data: {
        surfaceMeaning: deriveSurfaceMeaning(frag),
        hiddenMeaning: deriveHiddenMeaning(frag),
        emotionalUse: deriveEmotionalUse(frag),
        symbolicUse: deriveSymbolicUse(frag),
        narrativeUse: deriveNarrativeUse(frag),
        sceneReadinessScore: deriveSceneReadinessScore(frag),
      },
    });
  } catch {
    redirect(`/admin/fragments/${id}?error=db`);
  }

  revalidatePath(`/admin/fragments/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${id}?saved=interpretation`);
}

export async function decomposeFragmentRefinedAction(formData: FormData) {
  const parsed = fragmentDecomposeChildSchema.safeParse({
    parentFragmentId: formData.get("parentFragmentId"),
    text: formData.get("text"),
    force: formData.get("force"),
  });
  if (!parsed.success) {
    redirect("/admin/fragments?error=validation");
  }
  const parentId = parsed.data.parentFragmentId;
  const force = parsed.data.force ?? false;

  if (parsed.data.text?.trim()) {
    const units = refineFragmentSplit(parsed.data.text);
    const parent = await prisma.fragment.findUnique({ where: { id: parentId } });
    if (!parent?.sourceId) {
      redirect(`/admin/fragments/${parentId}?error=no_source`);
    }
    const hints = mapHints(await getEntityHintsForDecomposition());
    try {
      await createFragmentsFromUnits({
        units,
        sourceId: parent.sourceId,
        sourceChunkId: parent.sourceChunkId,
        sourceTextId: parent.sourceTextId,
        parentFragmentId: parentId,
        recordType: parent.recordType ?? undefined,
        hints,
      });
    } catch {
      redirect(`/admin/fragments/${parentId}?error=db`);
    }
    revalidatePath(`/admin/fragments/${parentId}`);
    revalidatePath("/admin/fragments");
    revalidatePath("/admin/brain");
    redirect(`/admin/fragments/${parentId}?saved=children`);
  }

  const res = await createRefinedChildFragmentsFromParent(parentId, force);
  if (!res.ok) {
    redirect(`/admin/fragments/${parentId}?error=${encodeURIComponent(res.reason)}`);
  }
  revalidatePath(`/admin/fragments/${parentId}`);
  revalidatePath("/admin/fragments");
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${parentId}?saved=children`);
}

export async function saveRefinedChildFragmentsAction(formData: FormData) {
  let unitsRaw: unknown;
  try {
    unitsRaw = JSON.parse(String(formData.get("unitsJson") ?? ""));
  } catch {
    const parentId = String(formData.get("parentFragmentId") ?? "");
    redirect(parentId ? `/admin/fragments/${parentId}?error=validation` : "/admin/fragments?error=validation");
  }

  const parsed = saveRefinedChildrenSchema.safeParse({
    parentFragmentId: formData.get("parentFragmentId"),
    units: unitsRaw,
    force: formData.get("force"),
  });
  if (!parsed.success) {
    const parentId = String(formData.get("parentFragmentId") ?? "");
    redirect(parentId ? `/admin/fragments/${parentId}?error=validation` : "/admin/fragments?error=validation");
  }

  const parent = await prisma.fragment.findUnique({ where: { id: parsed.data.parentFragmentId } });
  if (!parent?.sourceId) {
    redirect(`/admin/fragments/${parsed.data.parentFragmentId}?error=no_source`);
  }

  const existing = await prisma.fragment.count({ where: { parentFragmentId: parsed.data.parentFragmentId } });
  if (existing > 0 && !parsed.data.force) {
    redirect(`/admin/fragments/${parsed.data.parentFragmentId}?error=${encodeURIComponent("already_has_children")}`);
  }

  const hints = mapHints(await getEntityHintsForDecomposition());
  const units: CandidateFragmentUnit[] = parsed.data.units.map((u) => {
    const text = normalizeFragmentText(u.text);
    return {
      text,
      suggestedType: u.suggestedType,
      excerpt: buildFragmentSummary(text).slice(0, 220),
      confidence: scoreConfidence(u.suggestedType, text),
      ambiguityLevel: scoreAmbiguity(text),
    };
  });

  try {
    await createFragmentsFromUnits({
      units,
      sourceId: parent.sourceId,
      sourceChunkId: parent.sourceChunkId,
      sourceTextId: parent.sourceTextId,
      parentFragmentId: parsed.data.parentFragmentId,
      recordType: parent.recordType ?? undefined,
      hints,
    });
  } catch {
    redirect(`/admin/fragments/${parsed.data.parentFragmentId}?error=db`);
  }

  revalidatePath(`/admin/fragments/${parsed.data.parentFragmentId}`);
  revalidatePath("/admin/fragments");
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${parsed.data.parentFragmentId}?saved=children`);
}

export async function reviewFragmentAction(formData: FormData) {
  const parsed = fragmentReviewSchema.safeParse({
    id: formData.get("id"),
    reviewStatus: formData.get("reviewStatus"),
    placementStatus: formData.get("placementStatus") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/fragments?error=validation");
  }
  const d = parsed.data;
  try {
    await prisma.fragment.update({
      where: { id: d.id },
      data: {
        reviewStatus: d.reviewStatus,
        ...(d.placementStatus !== undefined ? { placementStatus: d.placementStatus } : {}),
        ...(d.notes !== undefined ? { notes: d.notes?.length ? d.notes : null } : {}),
      },
    });
  } catch {
    redirect(`/admin/fragments/${d.id}?error=db`);
  }
  revalidatePath("/admin/fragments");
  revalidatePath(`/admin/fragments/${d.id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${d.id}?saved=review`);
}

export async function decomposeSourceAction(formData: FormData) {
  const parsed = fragmentDecomposeSaveSchema.safeParse({
    sourceId: formData.get("sourceId"),
    mode: formData.get("mode"),
    force: formData.get("force"),
  });
  if (!parsed.success) {
    redirect("/admin/fragments?error=validation");
  }
  const { sourceId, mode, force } = parsed.data;

  const existing = await countFragmentsForSource(sourceId).catch(() => 0);
  if (existing > 0 && !force) {
    redirect(`/admin/sources/${sourceId}/decompose?error=${encodeURIComponent("already_decomposed")}`);
  }

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true, sourceChunks: { orderBy: { chunkIndex: "asc" } } },
  });
  if (!source) {
    redirect(`/admin/sources/${sourceId}/decompose?error=not_found`);
  }

  const hints = mapHints(await getEntityHintsForDecomposition());
  const recordType = source.recordType;

  try {
    if (mode === "chunks" && source.sourceChunks.length > 0) {
      for (const ch of source.sourceChunks) {
        const raw = ch.normalizedText ?? ch.rawText ?? "";
        const text = normalizeFragmentText(raw);
        if (!text.length) continue;
        const units = splitTextIntoCandidateFragments(text);
        await createFragmentsFromUnits({
          units,
          sourceId,
          sourceChunkId: ch.id,
          sourceTextId: ch.sourceTextId ?? source.sourceText?.id ?? null,
          recordType,
          hints,
        });
      }
    } else {
      const raw = source.sourceText?.normalizedText ?? source.sourceText?.rawText ?? "";
      const text = normalizeFragmentText(raw);
      if (!text.length) {
        redirect(`/admin/sources/${sourceId}/decompose?error=no_text`);
      }
      const units = splitTextIntoCandidateFragments(text);
      await createFragmentsFromUnits({
        units,
        sourceId,
        sourceTextId: source.sourceText?.id ?? null,
        recordType,
        hints,
      });
    }
  } catch {
    redirect(`/admin/sources/${sourceId}/decompose?error=db`);
  }

  revalidatePath("/admin/fragments");
  revalidatePath(`/admin/sources/${sourceId}/decompose`);
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/sources/${sourceId}/decompose?saved=1`);
}

export async function decomposeFragmentAction(formData: FormData) {
  const parsed = fragmentDecomposeChildSchema.safeParse({
    parentFragmentId: formData.get("parentFragmentId"),
    text: formData.get("text"),
    force: formData.get("force"),
  });
  if (!parsed.success) {
    redirect("/admin/fragments?error=validation");
  }
  const parentId = parsed.data.parentFragmentId;
  const force = parsed.data.force ?? false;

  if (parsed.data.text?.trim()) {
    const units = splitTextIntoCandidateFragments(parsed.data.text);
    const parent = await prisma.fragment.findUnique({ where: { id: parentId } });
    if (!parent?.sourceId) {
      redirect(`/admin/fragments/${parentId}?error=no_source`);
    }
    const hints = mapHints(await getEntityHintsForDecomposition());
    try {
      await createFragmentsFromUnits({
        units,
        sourceId: parent.sourceId,
        sourceChunkId: parent.sourceChunkId,
        sourceTextId: parent.sourceTextId,
        parentFragmentId: parentId,
        recordType: parent.recordType ?? undefined,
        hints,
      });
    } catch {
      redirect(`/admin/fragments/${parentId}?error=db`);
    }
    revalidatePath(`/admin/fragments/${parentId}`);
    revalidatePath("/admin/fragments");
    revalidatePath("/admin/brain");
    redirect(`/admin/fragments/${parentId}?saved=children`);
  }

  const res = await createChildFragmentsFromParentText(parentId, force);
  if (!res.ok) {
    redirect(`/admin/fragments/${parentId}?error=${encodeURIComponent(res.reason)}`);
  }
  revalidatePath(`/admin/fragments/${parentId}`);
  revalidatePath("/admin/fragments");
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${parentId}?saved=children`);
}

export async function acceptFragmentPlacementAction(formData: FormData) {
  const parsed = placementCandidateDecisionSchema.safeParse({
    candidateId: formData.get("candidateId"),
    status: formData.get("status") ?? "accepted",
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) redirect("/admin/fragments?error=validation");

  const cand = await prisma.fragmentPlacementCandidate.findUnique({
    where: { id: parsed.data.candidateId },
    include: { fragment: true },
  });
  if (!cand) redirect("/admin/fragments?error=not_found");

  try {
    await prisma.fragmentPlacementCandidate.update({
      where: { id: cand.id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes?.length ? parsed.data.notes : null,
      },
    });
    if (parsed.data.status === "accepted" && cand.targetId) {
      const dup = await prisma.fragmentLink.findFirst({
        where: {
          fragmentId: cand.fragmentId,
          linkedType: cand.targetType,
          linkedId: cand.targetId,
        },
      });
      if (!dup) {
        await prisma.fragmentLink.create({
          data: {
            fragmentId: cand.fragmentId,
            linkedType: cand.targetType,
            linkedId: cand.targetId,
            linkRole: "supports",
            notes: cand.rationale?.slice(0, 500) ?? null,
          },
        });
      }
      await prisma.fragment.update({
        where: { id: cand.fragmentId },
        data: { placementStatus: "linked" },
      });
    }
  } catch {
    redirect(`/admin/fragments/${cand.fragmentId}?error=db`);
  }

  revalidatePath(`/admin/fragments/${cand.fragmentId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${cand.fragmentId}?saved=placement`);
}

export async function rejectFragmentPlacementAction(formData: FormData) {
  const parsed = placementCandidateDecisionSchema.safeParse({
    candidateId: formData.get("candidateId"),
    status: "rejected",
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) redirect("/admin/fragments?error=validation");

  const cand = await prisma.fragmentPlacementCandidate.findUnique({
    where: { id: parsed.data.candidateId },
  });
  if (!cand) redirect("/admin/fragments?error=not_found");

  try {
    await prisma.fragmentPlacementCandidate.update({
      where: { id: cand.id },
      data: {
        status: "rejected",
        notes: parsed.data.notes?.length ? parsed.data.notes : null,
      },
    });
  } catch {
    redirect(`/admin/fragments/${cand.fragmentId}?error=db`);
  }

  revalidatePath(`/admin/fragments/${cand.fragmentId}`);
  redirect(`/admin/fragments/${cand.fragmentId}?saved=placement`);
}

export async function linkFragmentAction(formData: FormData) {
  const parsed = fragmentLinkCreateSchema.safeParse({
    fragmentId: formData.get("fragmentId"),
    linkedType: formData.get("linkedType"),
    linkedId: formData.get("linkedId"),
    linkRole: formData.get("linkRole") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    const fid = String(formData.get("fragmentId") ?? "");
    redirect(fid ? `/admin/fragments/${fid}?error=validation` : "/admin/fragments?error=validation");
  }
  const d = parsed.data;
  try {
    const dup = await prisma.fragmentLink.findFirst({
      where: {
        fragmentId: d.fragmentId,
        linkedType: d.linkedType,
        linkedId: d.linkedId,
      },
    });
    if (!dup) {
      await prisma.fragmentLink.create({
        data: {
          fragmentId: d.fragmentId,
          linkedType: d.linkedType,
          linkedId: d.linkedId,
          linkRole: d.linkRole ?? null,
          notes: d.notes?.length ? d.notes : null,
        },
      });
    }
    await prisma.fragment.update({
      where: { id: d.fragmentId },
      data: { placementStatus: "linked" },
    });
  } catch {
    redirect(`/admin/fragments/${d.fragmentId}?error=db`);
  }
  revalidatePath(`/admin/fragments/${d.fragmentId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${d.fragmentId}?saved=link`);
}

export async function unlinkFragmentAction(formData: FormData) {
  const parsed = fragmentLinkDeleteSchema.safeParse({
    linkId: formData.get("linkId"),
    fragmentId: formData.get("fragmentId"),
  });
  if (!parsed.success) redirect("/admin/fragments?error=validation");

  try {
    await prisma.fragmentLink.delete({ where: { id: parsed.data.linkId } });
  } catch {
    redirect(`/admin/fragments/${parsed.data.fragmentId}?error=db`);
  }
  revalidatePath(`/admin/fragments/${parsed.data.fragmentId}`);
  redirect(`/admin/fragments/${parsed.data.fragmentId}?saved=unlink`);
}

export async function addFragmentInsightAction(formData: FormData) {
  const parsed = fragmentInsightCreateSchema.safeParse({
    fragmentId: formData.get("fragmentId"),
    insightType: formData.get("insightType"),
    content: formData.get("content"),
    confidence: formData.get("confidence"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    const fid = String(formData.get("fragmentId") ?? "");
    redirect(fid ? `/admin/fragments/${fid}?error=validation` : "/admin/fragments?error=validation");
  }
  const d = parsed.data;
  try {
    await prisma.fragmentInsight.create({
      data: {
        fragmentId: d.fragmentId,
        insightType: d.insightType,
        content: d.content,
        confidence: d.confidence ?? null,
        notes: d.notes?.length ? d.notes : null,
      },
    });
  } catch {
    redirect(`/admin/fragments/${d.fragmentId}?error=db`);
  }
  revalidatePath(`/admin/fragments/${d.fragmentId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/fragments/${d.fragmentId}?saved=insight`);
}

/** Preview rule-based decomposition without persisting. */
export async function previewDecomposeSourceAction(formData: FormData) {
  const parsed = fragmentDecomposeSaveSchema.safeParse({
    sourceId: formData.get("sourceId"),
    mode: formData.get("mode"),
    force: formData.get("force"),
  });
  if (!parsed.success) return { ok: false as const, reason: "validation" as const };

  const { sourceId, mode } = parsed.data;
  try {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: { sourceText: true, sourceChunks: { orderBy: { chunkIndex: "asc" } } },
    });
    if (!source) return { ok: false as const, reason: "not_found" as const };

    type PreviewRow = {
      text: string;
      suggestedType: string;
      excerpt: string;
      chunkLabel?: string;
    };
    const rows: PreviewRow[] = [];

    if (mode === "chunks" && source.sourceChunks.length > 0) {
      for (const ch of source.sourceChunks) {
        const raw = ch.normalizedText ?? ch.rawText ?? "";
        const text = normalizeFragmentText(raw);
        if (!text.length) continue;
        const units = splitTextIntoCandidateFragments(text);
        for (const u of units) {
          rows.push({
            text: u.text,
            suggestedType: u.suggestedType,
            excerpt: u.excerpt,
            chunkLabel: ch.chunkLabel ?? `Chunk ${ch.chunkIndex}`,
          });
        }
      }
    } else {
      const raw = source.sourceText?.normalizedText ?? source.sourceText?.rawText ?? "";
      const text = normalizeFragmentText(raw);
      if (!text.length) return { ok: false as const, reason: "no_text" as const };
      const units = splitTextIntoCandidateFragments(text);
      for (const u of units) {
        rows.push({
          text: u.text,
          suggestedType: u.suggestedType,
          excerpt: u.excerpt,
        });
      }
    }

    return { ok: true as const, version: FRAGMENT_DECOMPOSITION_VERSION, units: rows };
  } catch {
    return { ok: false as const, reason: "db" as const };
  }
}

export async function deepDecomposeAssistAction(
  formData: FormData,
): Promise<FragmentAssistResult> {
  const sourceId = String(formData.get("sourceId") ?? "");
  const mode = String(formData.get("mode") ?? "full");
  if (!sourceId) return { ok: false as const, reason: "validation" as const };

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true, sourceChunks: { orderBy: { chunkIndex: "asc" } } },
  });
  if (!source) return { ok: false as const, reason: "not_found" as const };

  const hints = mapHints(await getEntityHintsForDecomposition());
  let blob = "";
  if (mode === "chunks" && source.sourceChunks.length > 0) {
    blob = source.sourceChunks
      .map((c) => c.normalizedText ?? c.rawText ?? "")
      .join("\n\n");
  } else {
    blob = source.sourceText?.normalizedText ?? source.sourceText?.rawText ?? "";
  }
  const text = normalizeFragmentText(blob);
  if (!text.length) return { ok: false as const, reason: "no_text" as const };

  const res = await runFragmentDecompositionAssist(text, hints);
  return res;
}
