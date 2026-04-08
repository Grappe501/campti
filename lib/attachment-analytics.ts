import { prisma } from "@/lib/prisma";

/**
 * Internal metrics for attachment / retention (no user-facing dashboard).
 */

export type SceneLingerMetric = {
  sceneId: string;
  imprintCount: number;
  totalWeight: number;
};

export async function scenesWithHighestImprintVolume(limit = 12): Promise<SceneLingerMetric[]> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "scene" },
    _count: { entityId: true },
    _sum: { weight: true },
    orderBy: { _sum: { weight: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    sceneId: r.entityId,
    imprintCount: r._count.entityId,
    totalWeight: r._sum.weight ?? 0,
  }));
}

export async function scenesWithHighestReturnRate(limit = 12): Promise<
  { sceneId: string; returnSignals: number }[]
> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "scene", imprintType: "returned" },
    _count: { entityId: true },
    orderBy: { _count: { entityId: "desc" } },
    take: limit,
  });
  if (rows.length) {
    return rows.map((r) => ({
      sceneId: r.entityId,
      returnSignals: r._count.entityId,
    }));
  }
  const fallback = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "scene", imprintType: "revisited" },
    _count: { entityId: true },
    orderBy: { _count: { entityId: "desc" } },
    take: limit,
  });
  return fallback.map((r) => ({
    sceneId: r.entityId,
    returnSignals: r._count.entityId,
  }));
}

export async function symbolsWithStrongestImprints(limit = 12): Promise<
  { symbolId: string; score: number }[]
> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "symbol" },
    _sum: { weight: true },
    orderBy: { _sum: { weight: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    symbolId: r.entityId,
    score: r._sum.weight ?? 0,
  }));
}

export async function charactersWithStrongestAttachment(limit = 12): Promise<
  { personId: string; imprintScore: number; listenSeconds: number }[]
> {
  const [imprints, listens] = await Promise.all([
    prisma.readerImprint.groupBy({
      by: ["entityId"],
      where: { entityType: "character" },
      _sum: { weight: true },
    }),
    prisma.readerVoiceListen.groupBy({
      by: ["personId"],
      _sum: { totalListenSeconds: true },
    }),
  ]);
  const map = new Map<string, { imprint: number; listen: number }>();
  for (const r of imprints) {
    map.set(r.entityId, { imprint: r._sum.weight ?? 0, listen: 0 });
  }
  for (const r of listens) {
    const cur = map.get(r.personId) ?? { imprint: 0, listen: 0 };
    cur.listen = r._sum.totalListenSeconds ?? 0;
    map.set(r.personId, cur);
  }
  return [...map.entries()]
    .map(([personId, v]) => ({
      personId,
      imprintScore: v.imprint,
      listenSeconds: v.listen,
      combined: v.imprint * 3 + Math.min(120, v.listen / 30),
    }))
    .sort((a, b) => b.combined - a.combined)
    .slice(0, limit)
    .map(({ personId, imprintScore, listenSeconds }) => ({
      personId,
      imprintScore,
      listenSeconds,
    }));
}

export async function placesWithStrongestImprints(limit = 12): Promise<
  { placeId: string; score: number }[]
> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "place" },
    _sum: { weight: true },
    orderBy: { _sum: { weight: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    placeId: r.entityId,
    score: r._sum.weight ?? 0,
  }));
}

export type ReturnHookEffectiveness = { hook: string; count: number };

export async function returnHooksByFrequency(limit = 16): Promise<ReturnHookEffectiveness[]> {
  const rows = await prisma.readerState.groupBy({
    by: ["returnHook"],
    where: { returnHook: { not: null } },
    _count: { returnHook: true },
    orderBy: { _count: { returnHook: "desc" } },
    take: limit,
  });
  return rows
    .filter((r) => r.returnHook?.trim())
    .map((r) => ({ hook: r.returnHook!.trim(), count: r._count.returnHook }));
}

export async function premiumOfferSignals(limit = 16): Promise<
  { entityId: string; signals: number }[]
> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { imprintType: "expanded_depth" },
    _count: { entityId: true },
    orderBy: { _count: { entityId: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ entityId: r.entityId, signals: r._count.entityId }));
}

export async function strongestListenCompletions(limit = 16): Promise<
  { sceneId: string; completions: number }[]
> {
  const rows = await prisma.readerImprint.groupBy({
    by: ["entityId"],
    where: { entityType: "scene", imprintType: "completed" },
    _count: { entityId: true },
    orderBy: { _count: { entityId: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ sceneId: r.entityId, completions: r._count.entityId }));
}

/** Spec alias: linger-weighted scenes. */
export const getHighestLingerScenes = scenesWithHighestImprintVolume;
/** Spec alias: return / revisit signals. */
export const getHighestReturnScenes = scenesWithHighestReturnRate;
export const getMostImprintedCharacters = charactersWithStrongestAttachment;
export const getMostImprintedSymbols = symbolsWithStrongestImprints;
export const getMostImprintedPlaces = placesWithStrongestImprints;
export const getMostEffectiveReturnHooks = returnHooksByFrequency;
export const getMostEffectivePremiumDepthOffers = premiumOfferSignals;
