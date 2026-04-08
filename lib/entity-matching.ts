import { prisma } from "@/lib/prisma";
import {
  normalizeEntityLabel,
  normalizeNameForMatch,
  normalizeTitleForMatch,
  scoreForLabelMatch,
} from "@/lib/entity-normalization";

export type CandidateMatch = {
  canonicalType: string;
  canonicalId: string;
  label: string;
  score: number;
  why: string[];
  summary: Record<string, unknown>;
};

function pickProposedLabel(entity: {
  proposedName: string | null;
  proposedTitle: string | null;
  proposedData: unknown;
}): { label: string | null; kind: "name" | "title" | "data" | null } {
  if (entity.proposedTitle?.trim()) return { label: entity.proposedTitle.trim(), kind: "title" };
  if (entity.proposedName?.trim()) return { label: entity.proposedName.trim(), kind: "name" };
  if (entity.proposedData && typeof entity.proposedData === "object") {
    const o = entity.proposedData as Record<string, unknown>;
    const label =
      (typeof o.title === "string" && o.title.trim()) ||
      (typeof o.name === "string" && o.name.trim()) ||
      (typeof o.label === "string" && o.label.trim()) ||
      null;
    if (label) return { label, kind: "data" };
  }
  return { label: null, kind: null };
}

function addCandidate(
  acc: Map<string, CandidateMatch>,
  c: CandidateMatch,
): void {
  const key = `${c.canonicalType}:${c.canonicalId}`;
  const existing = acc.get(key);
  if (!existing) {
    acc.set(key, c);
    return;
  }
  existing.score = Math.max(existing.score, c.score);
  for (const w of c.why) if (!existing.why.includes(w)) existing.why.push(w);
  existing.summary = { ...existing.summary, ...c.summary };
}

export async function findCandidatePeopleMatches(params: {
  label: string;
  limit?: number;
}): Promise<CandidateMatch[]> {
  const limit = Math.min(25, Math.max(5, params.limit ?? 12));
  const needleNorm = normalizeNameForMatch(params.label);
  const needleLabelNorm = normalizeEntityLabel(params.label);

  const rows = await prisma.person.findMany({
    where: {
      OR: [
        { name: { equals: params.label, mode: "insensitive" } },
        { name: { contains: params.label, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      birthYear: true,
      deathYear: true,
      visibility: true,
      recordType: true,
    },
  });

  const acc = new Map<string, CandidateMatch>();
  for (const r of rows) {
    const hayNorm = normalizeNameForMatch(r.name);
    const hit = scoreForLabelMatch({
      normalizedNeedle: needleNorm,
      normalizedHaystack: hayNorm,
    });
    const hit2 = scoreForLabelMatch({
      normalizedNeedle: needleLabelNorm,
      normalizedHaystack: normalizeEntityLabel(r.name),
    });
    const best = hit && hit2 ? (hit.score >= hit2.score ? hit : hit2) : hit ?? hit2;
    if (!best) continue;
    addCandidate(acc, {
      canonicalType: "person",
      canonicalId: r.id,
      label: r.name,
      score: best.score,
      why: [best.why],
      summary: {
        description: r.description,
        birthYear: r.birthYear,
        deathYear: r.deathYear,
        visibility: r.visibility,
        recordType: r.recordType,
      },
    });
  }
  return [...acc.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findCandidatePlaceMatches(params: {
  label: string;
  limit?: number;
}): Promise<CandidateMatch[]> {
  const limit = Math.min(25, Math.max(5, params.limit ?? 12));
  const needleNorm = normalizeNameForMatch(params.label);

  const rows = await prisma.place.findMany({
    where: {
      OR: [
        { name: { equals: params.label, mode: "insensitive" } },
        { name: { contains: params.label, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      placeType: true,
      latitude: true,
      longitude: true,
      visibility: true,
      recordType: true,
    },
  });

  const out: CandidateMatch[] = [];
  for (const r of rows) {
    const best = scoreForLabelMatch({
      normalizedNeedle: needleNorm,
      normalizedHaystack: normalizeNameForMatch(r.name),
    });
    if (!best) continue;
    out.push({
      canonicalType: "place",
      canonicalId: r.id,
      label: r.name,
      score: best.score,
      why: [best.why],
      summary: {
        description: r.description,
        placeType: r.placeType,
        latitude: r.latitude,
        longitude: r.longitude,
        visibility: r.visibility,
        recordType: r.recordType,
      },
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findCandidateEventMatches(params: {
  label: string;
  extractedStartYear?: number | null;
  extractedEndYear?: number | null;
  limit?: number;
}): Promise<CandidateMatch[]> {
  const limit = Math.min(25, Math.max(5, params.limit ?? 12));
  const needleNorm = normalizeTitleForMatch(params.label);

  const rows = await prisma.event.findMany({
    where: {
      OR: [
        { title: { equals: params.label, mode: "insensitive" } },
        { title: { contains: params.label, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      startYear: true,
      endYear: true,
      eventType: true,
      visibility: true,
      recordType: true,
    },
  });

  const out: CandidateMatch[] = [];
  for (const r of rows) {
    const best = scoreForLabelMatch({
      normalizedNeedle: needleNorm,
      normalizedHaystack: normalizeTitleForMatch(r.title),
    });
    if (!best) continue;

    let score = best.score;
    const why = [best.why];
    if (
      params.extractedStartYear &&
      r.startYear &&
      Math.abs(params.extractedStartYear - r.startYear) <= 1
    ) {
      score += 5;
      why.push("year_overlap_start");
    }
    if (
      params.extractedEndYear &&
      r.endYear &&
      Math.abs(params.extractedEndYear - r.endYear) <= 1
    ) {
      score += 5;
      why.push("year_overlap_end");
    }

    out.push({
      canonicalType: "event",
      canonicalId: r.id,
      label: r.title,
      score: Math.min(100, score),
      why,
      summary: {
        description: r.description,
        startYear: r.startYear,
        endYear: r.endYear,
        eventType: r.eventType,
        visibility: r.visibility,
        recordType: r.recordType,
      },
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findCandidateSymbolMatches(params: {
  label: string;
  limit?: number;
}): Promise<CandidateMatch[]> {
  const limit = Math.min(25, Math.max(5, params.limit ?? 12));
  const needleNorm = normalizeNameForMatch(params.label);

  const rows = await prisma.symbol.findMany({
    where: {
      OR: [
        { name: { equals: params.label, mode: "insensitive" } },
        { name: { contains: params.label, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      meaning: true,
      category: true,
      visibility: true,
      recordType: true,
    },
  });

  const out: CandidateMatch[] = [];
  for (const r of rows) {
    const best = scoreForLabelMatch({
      normalizedNeedle: needleNorm,
      normalizedHaystack: normalizeNameForMatch(r.name),
    });
    if (!best) continue;
    out.push({
      canonicalType: "symbol",
      canonicalId: r.id,
      label: r.name,
      score: best.score,
      why: [best.why],
      summary: {
        meaning: r.meaning,
        category: r.category,
        visibility: r.visibility,
        recordType: r.recordType,
      },
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findCandidateChapterMatches(params: {
  label: string;
  limit?: number;
}): Promise<CandidateMatch[]> {
  const limit = Math.min(25, Math.max(5, params.limit ?? 12));
  const needleNorm = normalizeTitleForMatch(params.label);

  const rows = await prisma.chapter.findMany({
    where: {
      OR: [
        { title: { equals: params.label, mode: "insensitive" } },
        { title: { contains: params.label, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      chapterNumber: true,
      visibility: true,
      recordType: true,
      status: true,
    },
  });

  const out: CandidateMatch[] = [];
  for (const r of rows) {
    const best = scoreForLabelMatch({
      normalizedNeedle: needleNorm,
      normalizedHaystack: normalizeTitleForMatch(r.title),
    });
    if (!best) continue;
    out.push({
      canonicalType: "chapter",
      canonicalId: r.id,
      label: r.title,
      score: best.score,
      why: [best.why],
      summary: {
        summary: r.summary,
        chapterNumber: r.chapterNumber,
        visibility: r.visibility,
        recordType: r.recordType,
        status: r.status,
      },
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findCandidateMatchesForExtractedEntity(
  extractedEntityId: string,
): Promise<CandidateMatch[]> {
  let entity: {
    id: string;
    entityType: string;
    proposedName: string | null;
    proposedTitle: string | null;
    proposedData: unknown;
    confidence: number | null;
  } | null = null;
  try {
    entity = await prisma.extractedEntity.findUnique({
      where: { id: extractedEntityId },
      select: {
        id: true,
        entityType: true,
        proposedName: true,
        proposedTitle: true,
        proposedData: true,
        confidence: true,
      },
    });
  } catch {
    return [];
  }
  if (!entity) return [];

  const picked = pickProposedLabel({
    proposedName: entity.proposedName,
    proposedTitle: entity.proposedTitle,
    proposedData: entity.proposedData,
  });
  if (!picked.label) return [];

  const proposedObj =
    entity.proposedData && typeof entity.proposedData === "object"
      ? (entity.proposedData as Record<string, unknown>)
      : {};
  const extractedStartYear =
    typeof proposedObj.startYear === "number" ? Math.trunc(proposedObj.startYear) : null;
  const extractedEndYear =
    typeof proposedObj.endYear === "number" ? Math.trunc(proposedObj.endYear) : null;

  switch (entity.entityType) {
    case "person":
      return await findCandidatePeopleMatches({ label: picked.label });
    case "place":
      return await findCandidatePlaceMatches({ label: picked.label });
    case "event":
      return await findCandidateEventMatches({
        label: picked.label,
        extractedStartYear,
        extractedEndYear,
      });
    case "symbol":
      return await findCandidateSymbolMatches({ label: picked.label });
    case "chapter":
      return await findCandidateChapterMatches({ label: picked.label });
    default:
      return [];
  }
}

