import { RecordType, VisibilityStatus } from "@prisma/client";
import { FRAGMENT_DECOMPOSITION_VERSION } from "@/lib/fragment-constants";
import {
  buildFragmentSummary,
  deriveFragmentInsights,
  normalizeFragmentText,
  splitTextIntoCandidateFragments,
  suggestFragmentPlacements,
  type CandidateFragmentUnit,
  type EntityHints,
} from "@/lib/fragment-decomposition";
import { deriveDecompositionPressure } from "@/lib/fragment-density";
import { refineFragmentSplit } from "@/lib/fragment-refinement";
import { prisma } from "@/lib/prisma";

export type CreateFragmentsFromUnitsInput = {
  units: CandidateFragmentUnit[];
  sourceId: string;
  sourceChunkId?: string | null;
  sourceTextId?: string | null;
  parentFragmentId?: string | null;
  recordType?: RecordType | null;
  hints?: EntityHints;
};

export async function createFragmentsFromUnits(input: CreateFragmentsFromUnitsInput) {
  const {
    units,
    sourceId,
    sourceChunkId,
    sourceTextId,
    parentFragmentId,
    recordType,
    hints,
  } = input;

  const createdIds: string[] = [];

  for (const u of units) {
    const text = normalizeFragmentText(u.text);
    if (!text.length) continue;

    const summary = buildFragmentSummary(text);
    const placements = suggestFragmentPlacements(u.suggestedType, text, hints);
    const insights = deriveFragmentInsights(text);
    const decompositionPressure = deriveDecompositionPressure({
      text,
      summary,
      decompositionPressure: null,
    });

    const frag = await prisma.fragment.create({
      data: {
        title: summary.slice(0, 120) || null,
        fragmentType: u.suggestedType,
        primaryFragmentType: u.suggestedType,
        visibility: VisibilityStatus.PRIVATE,
        recordType: recordType ?? null,
        sourceId,
        sourceChunkId: sourceChunkId ?? undefined,
        sourceTextId: sourceTextId ?? undefined,
        parentFragmentId: parentFragmentId ?? undefined,
        text,
        excerpt: u.excerpt,
        summary: summary || null,
        confidence: u.confidence,
        ambiguityLevel: u.ambiguityLevel,
        placementStatus: "unplaced",
        reviewStatus: "pending",
        decompositionPressure,
        decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
        aiGenerated: false,
        placementCandidates: {
          create: placements.map((p) => ({
            targetType: p.targetType,
            targetId: p.targetId ?? null,
            targetLabel: p.targetLabel ?? null,
            confidence: p.confidence ?? null,
            rationale: p.rationale ?? null,
            status: "suggested",
          })),
        },
        insights: {
          create: insights.map((i) => ({
            insightType: i.insightType,
            content: i.content,
            confidence: i.confidence,
            notes: i.notes,
          })),
        },
      },
    });
    createdIds.push(frag.id);
  }

  return { createdIds, count: createdIds.length };
}

export async function countFragmentsForSource(sourceId: string) {
  return prisma.fragment.count({ where: { sourceId, parentFragmentId: null } });
}

export async function createRefinedChildFragmentsFromParent(parentId: string, force: boolean) {
  const parent = await prisma.fragment.findUnique({ where: { id: parentId } });
  if (!parent) return { ok: false as const, reason: "not_found" };
  if (!parent.sourceId) return { ok: false as const, reason: "parent_needs_source" };

  const existing = await prisma.fragment.count({ where: { parentFragmentId: parentId } });
  if (existing > 0 && !force) {
    return { ok: false as const, reason: "already_has_children" };
  }

  const units = refineFragmentSplit(parent.text);
  if (units.length <= 1) {
    return { ok: false as const, reason: "nothing_to_split" };
  }

  const hints: EntityHints | undefined = undefined;
  const res = await createFragmentsFromUnits({
    units,
    sourceId: parent.sourceId,
    sourceChunkId: parent.sourceChunkId,
    sourceTextId: parent.sourceTextId,
    parentFragmentId: parentId,
    recordType: parent.recordType ?? undefined,
    hints,
  });

  await prisma.fragment.update({
    where: { id: parentId },
    data: { placementStatus: parent.placementStatus ?? "candidate" },
  });

  return { ok: true as const, ...res };
}

export async function createChildFragmentsFromParentText(
  parentId: string,
  force: boolean,
) {
  const parent = await prisma.fragment.findUnique({ where: { id: parentId } });
  if (!parent) return { ok: false as const, reason: "not_found" };
  if (!parent.sourceId) return { ok: false as const, reason: "parent_needs_source" };

  const existing = await prisma.fragment.count({ where: { parentFragmentId: parentId } });
  if (existing > 0 && !force) {
    return { ok: false as const, reason: "already_has_children" };
  }

  const units = splitTextIntoCandidateFragments(parent.text);
  if (units.length <= 1) {
    return { ok: false as const, reason: "nothing_to_split" };
  }

  const hints: EntityHints | undefined = undefined;
  const res = await createFragmentsFromUnits({
    units,
    sourceId: parent.sourceId,
    sourceChunkId: parent.sourceChunkId,
    sourceTextId: parent.sourceTextId,
    parentFragmentId: parentId,
    recordType: parent.recordType ?? undefined,
    hints,
  });

  await prisma.fragment.update({
    where: { id: parentId },
    data: { placementStatus: parent.placementStatus ?? "candidate" },
  });

  return { ok: true as const, ...res };
}
