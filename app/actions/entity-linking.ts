"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findCandidateMatchesForExtractedEntity } from "@/lib/entity-matching";
import {
  linkExtractedToCanonicalWithoutMerge,
  mergeExtractedIntoCanonical,
  promoteExtractedAsNewCanonical,
} from "@/lib/entity-merge";
import {
  extractedEntityIdSchema as extractedIdSchema,
  linkActionSchema,
  searchCanonicalSchema,
} from "@/lib/linking-validation";
import { searchCanonicalRecords } from "@/lib/data-access";

export async function quickLinkBestCandidateAction(formData: FormData) {
  const parsed = extractedIdSchema.safeParse({
    extractedEntityId: formData.get("extractedEntityId"),
  });
  if (!parsed.success) redirect("/admin/extracted?error=validation");

  const id = parsed.data.extractedEntityId;
  const candidates = await findCandidateMatchesForExtractedEntity(id);
  const best = candidates[0];
  const second = candidates[1];

  const strongEnough = best && best.score >= 90;
  const clearlyBest = best && (!second || best.score - second.score >= 10);

  if (!strongEnough || !clearlyBest) {
    redirect(`/admin/extracted?error=${encodeURIComponent("no_clear_match")}`);
  }

  const res = await linkExtractedToCanonicalWithoutMerge({
    extractedEntityId: id,
    canonicalType: best.canonicalType,
    canonicalId: best.canonicalId,
    notes: `Quick link (best candidate score ${best.score}).`,
    reviewedByNote: "Quick link from queue",
    createAlias: true,
  });
  if (!res.ok) redirect(`/admin/extracted?error=${encodeURIComponent(res.reason)}`);

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${id}`);
  redirect(`/admin/extracted/${id}?saved=quick_link`);
}

export async function findCandidateMatchesAction(formData: FormData) {
  const parsed = extractedIdSchema.safeParse({
    extractedEntityId: formData.get("extractedEntityId"),
  });
  if (!parsed.success) return { ok: false as const, reason: "validation" };
  const candidates = await findCandidateMatchesForExtractedEntity(parsed.data.extractedEntityId);
  return { ok: true as const, candidates };
}

export async function searchCanonicalRecordsAction(formData: FormData) {
  const parsed = searchCanonicalSchema.safeParse({
    type: formData.get("type"),
    query: formData.get("query"),
  });
  if (!parsed.success) return { ok: false as const, reason: "validation", results: [] as unknown[] };
  const results = await searchCanonicalRecords(parsed.data.type, parsed.data.query);
  return { ok: true as const, results };
}

export async function linkExtractedToCanonicalAction(formData: FormData) {
  const parsed = linkActionSchema.safeParse({
    extractedEntityId: formData.get("extractedEntityId"),
    canonicalType: formData.get("canonicalType"),
    canonicalId: formData.get("canonicalId"),
    notes: formData.get("notes"),
    reviewedByNote: formData.get("reviewedByNote"),
    createAlias: formData.get("createAlias"),
  });
  if (!parsed.success) {
    const id = String(formData.get("extractedEntityId") ?? "");
    redirect(id ? `/admin/extracted/${id}?error=validation` : "/admin/extracted?error=validation");
  }

  try {
    const res = await linkExtractedToCanonicalWithoutMerge({
      extractedEntityId: parsed.data.extractedEntityId,
      canonicalType: parsed.data.canonicalType,
      canonicalId: parsed.data.canonicalId,
      notes: parsed.data.notes,
      reviewedByNote: parsed.data.reviewedByNote,
      createAlias: parsed.data.createAlias,
    });
    if (!res.ok) {
      redirect(`/admin/extracted/${parsed.data.extractedEntityId}?error=${encodeURIComponent(res.reason)}`);
    }
  } catch {
    redirect(`/admin/extracted/${parsed.data.extractedEntityId}?error=db`);
  }

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${parsed.data.extractedEntityId}`);
  redirect(`/admin/extracted/${parsed.data.extractedEntityId}?saved=link_only`);
}

export async function mergeExtractedIntoCanonicalAction(formData: FormData) {
  const parsed = linkActionSchema.safeParse({
    extractedEntityId: formData.get("extractedEntityId"),
    canonicalType: formData.get("canonicalType"),
    canonicalId: formData.get("canonicalId"),
    notes: formData.get("notes"),
    reviewedByNote: formData.get("reviewedByNote"),
    createAlias: formData.get("createAlias"),
  });
  if (!parsed.success) {
    const id = String(formData.get("extractedEntityId") ?? "");
    redirect(id ? `/admin/extracted/${id}/merge?error=validation` : "/admin/extracted?error=validation");
  }

  try {
    const res = await mergeExtractedIntoCanonical({
      extractedEntityId: parsed.data.extractedEntityId,
      canonicalType: parsed.data.canonicalType,
      canonicalId: parsed.data.canonicalId,
      notes: parsed.data.notes,
      reviewedByNote: parsed.data.reviewedByNote,
      createAlias: parsed.data.createAlias,
      allowCreateContinuityHelpers: false,
    });
    if (!res.ok) {
      redirect(`/admin/extracted/${parsed.data.extractedEntityId}/merge?error=${encodeURIComponent(res.reason)}`);
    }
  } catch {
    redirect(`/admin/extracted/${parsed.data.extractedEntityId}/merge?error=db`);
  }

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${parsed.data.extractedEntityId}`);
  redirect(`/admin/extracted/${parsed.data.extractedEntityId}?saved=merged`);
}

export async function promoteExtractedNewAction(formData: FormData) {
  const extractedEntityId = String(formData.get("extractedEntityId") ?? "").trim();
  if (!extractedEntityId) redirect("/admin/extracted?error=validation");

  try {
    const res = await promoteExtractedAsNewCanonical({ extractedEntityId });
    if (!res.ok) redirect(`/admin/extracted/${extractedEntityId}?error=${encodeURIComponent(res.reason)}`);
  } catch {
    redirect(`/admin/extracted/${extractedEntityId}?error=db`);
  }

  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${extractedEntityId}`);
  redirect(`/admin/extracted/${extractedEntityId}?promoted=1`);
}

export async function rejectExtractedEntityAction(formData: FormData) {
  const extractedEntityId = String(formData.get("extractedEntityId") ?? "").trim();
  if (!extractedEntityId) redirect("/admin/extracted?error=validation");
  const note = String(formData.get("reviewedByNote") ?? "").trim();
  try {
    await prisma.extractedEntity.update({
      where: { id: extractedEntityId },
      data: {
        reviewStatus: "rejected",
        mergeDecision: "rejected",
        matchMethod: "manual_selected",
        reviewedByNote: note.length ? note : null,
        mergeSnapshot: { action: "rejected" },
      },
    });
  } catch {
    redirect(`/admin/extracted/${extractedEntityId}?error=db`);
  }
  revalidatePath("/admin/extracted");
  revalidatePath(`/admin/extracted/${extractedEntityId}`);
  redirect(`/admin/extracted/${extractedEntityId}?saved=rejected`);
}

