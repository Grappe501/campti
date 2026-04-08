import type { WritingMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SceneAssistContext = {
  scene: {
    id: string;
    description: string;
    writingMode: WritingMode;
    historicalAnchor: string | null;
    locationNote: string | null;
    pov: string | null;
    narrativeIntent: string | null;
    emotionalTone: string | null;
    continuitySummary: string | null;
    sourceTraceSummary: string | null;
    structuredDataJson: unknown;
    draftText: string | null;
  };
  chapter: {
    id: string;
    title: string;
    chapterNumber: number | null;
    timePeriod: string | null;
    pov: string | null;
    historicalAnchor: string | null;
  };
  linked: {
    people: Array<{ id: string; name: string; description: string | null; birthYear: number | null; deathYear: number | null }>;
    places: Array<{ id: string; name: string; description: string | null; placeType: string | null }>;
    events: Array<{ id: string; title: string; description: string | null; startYear: number | null; endYear: number | null; eventType: string | null }>;
    symbols: Array<{ id: string; name: string; meaning: string | null; category: string | null }>;
    sources: Array<{ id: string; title: string; recordType: string; sourceType: string; sourceYear: number | null; authorOrOrigin: string | null }>;
    openQuestions: Array<{ id: string; title: string; description: string | null; status: string; priority: number | null }>;
    continuityNotes: Array<{ id: string; title: string; description: string | null; severity: string; status: string }>;
  };
  claims: Array<{
    id: string;
    description: string;
    confidence: number | null;
    needsReview: boolean;
    quoteExcerpt: string | null;
    source: { id: string; title: string };
  }>;
  provenance: { sourceCount: number; claimCount: number; confidenceAvg: number | null };
  grounding: { score: number; reasons: string[] };
};

export async function buildSceneAssistContext(sceneId: string): Promise<SceneAssistContext> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      chapter: true,
      persons: { select: { id: true, name: true, description: true, birthYear: true, deathYear: true } },
      places: { select: { id: true, name: true, description: true, placeType: true } },
      events: { select: { id: true, title: true, description: true, startYear: true, endYear: true, eventType: true } },
      symbols: { select: { id: true, name: true, meaning: true, category: true } },
      sources: { select: { id: true, title: true, recordType: true, sourceType: true, sourceYear: true, authorOrOrigin: true } },
      openQuestions: { select: { id: true, title: true, description: true, status: true, priority: true } },
      continuityNotes: { select: { id: true, title: true, description: true, severity: true, status: true } },
    },
  });
  if (!scene) throw new Error("scene_not_found");

  const claims = await collectRelevantClaimsForScene({
    sourceIds: scene.sources.map((s) => s.id),
  });

  const provenance = {
    sourceCount: scene.sources.length,
    claimCount: claims.length,
    confidenceAvg:
      claims.length === 0
        ? null
        : Math.round((claims.reduce((a, c) => a + (c.confidence ?? 0), 0) / claims.length) * 10) / 10,
  };

  const grounding = calculateSceneGroundingScore({
    linkedSourcesCount: provenance.sourceCount,
    linkedPeopleCount: scene.persons.length,
    linkedPlacesCount: scene.places.length,
    linkedEventsCount: scene.events.length,
    claimCount: provenance.claimCount,
    draftText: scene.draftText,
  });

  return {
    scene: {
      id: scene.id,
      description: scene.description,
      writingMode: scene.writingMode,
      historicalAnchor: scene.historicalAnchor ?? null,
      locationNote: scene.locationNote ?? null,
      pov: scene.pov ?? null,
      narrativeIntent: scene.narrativeIntent ?? null,
      emotionalTone: scene.emotionalTone ?? null,
      continuitySummary: scene.continuitySummary ?? null,
      sourceTraceSummary: scene.sourceTraceSummary ?? null,
      structuredDataJson: (scene.structuredDataJson as unknown) ?? null,
      draftText: scene.draftText ?? null,
    },
    chapter: {
      id: scene.chapter.id,
      title: scene.chapter.title,
      chapterNumber: scene.chapter.chapterNumber ?? null,
      timePeriod: scene.chapter.timePeriod ?? null,
      pov: scene.chapter.pov ?? null,
      historicalAnchor: scene.chapter.historicalAnchor ?? null,
    },
    linked: {
      people: scene.persons,
      places: scene.places.map((p) => ({ ...p, placeType: (p.placeType as unknown as string | null) ?? null })),
      events: scene.events.map((e) => ({ ...e, eventType: (e.eventType as unknown as string | null) ?? null })),
      symbols: scene.symbols.map((s) => ({ ...s, category: (s.category as unknown as string | null) ?? null })),
      sources: scene.sources.map((s) => ({
        ...s,
        recordType: String(s.recordType),
        sourceType: String(s.sourceType),
      })),
      openQuestions: scene.openQuestions.map((q) => ({
        ...q,
        status: String(q.status),
      })),
      continuityNotes: scene.continuityNotes.map((n) => ({
        ...n,
        severity: String(n.severity),
        status: String(n.status),
      })),
    },
    claims,
    provenance,
    grounding,
  };
}

export async function buildSceneGroundingSnapshot(sceneId: string) {
  const ctx = await buildSceneAssistContext(sceneId);
  return {
    sceneId: ctx.scene.id,
    writingMode: ctx.scene.writingMode,
    provenance: ctx.provenance,
    grounding: ctx.grounding,
    linked: {
      peopleCount: ctx.linked.people.length,
      placesCount: ctx.linked.places.length,
      eventsCount: ctx.linked.events.length,
      sourcesCount: ctx.linked.sources.length,
      claimsCount: ctx.claims.length,
    },
  };
}

export function calculateSceneGroundingScore(input: {
  linkedSourcesCount: number;
  linkedPeopleCount: number;
  linkedPlacesCount: number;
  linkedEventsCount: number;
  claimCount: number;
  draftText: string | null;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (input.linkedSourcesCount > 0) {
    score += 25;
  } else {
    reasons.push("No linked sources");
  }

  if (input.claimCount > 0) score += Math.min(25, Math.round(input.claimCount / 4) * 5);
  else reasons.push("No claims available from linked sources");

  const entityAnchors = input.linkedPeopleCount + input.linkedPlacesCount + input.linkedEventsCount;
  if (entityAnchors > 0) score += Math.min(25, entityAnchors * 5);
  else reasons.push("No linked people/places/events");

  const hasDraft = (input.draftText ?? "").trim().length > 0;
  if (hasDraft) score += 10;
  else reasons.push("No draft text yet");

  // Reserve 15 points for author-facing “trace” fields / scaffold presence (kept conservative here).
  score += 15;

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export async function collectRelevantClaimsForScene(input: { sourceIds: string[] }) {
  if (!input.sourceIds.length) return [];
  return prisma.claim.findMany({
    where: { sourceId: { in: input.sourceIds } },
    orderBy: { updatedAt: "desc" },
    take: 160,
    select: {
      id: true,
      description: true,
      confidence: true,
      needsReview: true,
      quoteExcerpt: true,
      source: { select: { id: true, title: true } },
    },
  });
}

