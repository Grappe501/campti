import type { Fragment } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ClusterProposal = {
  title: string;
  clusterType: string;
  summary: string;
  emotionalTone: string | null;
  dominantFunction: string | null;
  confidence: number;
  fragmentIds: string[];
  /** fragmentId -> suggested role */
  roles: Record<string, string>;
};

const STOP = new Set([
  "that",
  "this",
  "with",
  "from",
  "their",
  "there",
  "where",
  "which",
  "would",
  "could",
  "about",
  "before",
  "after",
  "through",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 4 && !STOP.has(w));
}

function scoreOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

function buildTokens(f: Pick<Fragment, "title" | "summary" | "text">): Set<string> {
  const blob = `${f.title ?? ""} ${f.summary ?? ""} ${f.text}`.slice(0, 4000);
  return new Set(tokenize(blob));
}

async function loadFragments(where: { sourceId?: string; ids?: string[] }) {
  const w = where.sourceId
    ? { sourceId: where.sourceId, parentFragmentId: null }
    : where.ids
      ? { id: { in: where.ids } }
      : { id: { in: [] as string[] } };
  return prisma.fragment.findMany({
    where: w,
    select: {
      id: true,
      title: true,
      summary: true,
      text: true,
      fragmentType: true,
      emotionalTone: true,
    },
    take: 120,
  });
}

export async function suggestClustersForSource(sourceId: string): Promise<ClusterProposal[]> {
  const frags = await loadFragments({ sourceId });
  return clusterFragmentsHeuristic(frags, { placeHint: null, themeHint: null });
}

export async function suggestClustersForMetaScene(metaSceneId: string): Promise<ClusterProposal[]> {
  const links = await prisma.fragmentLink.findMany({
    where: { linkedType: "meta_scene", linkedId: metaSceneId },
    select: { fragmentId: true },
  });
  const ids = [...new Set(links.map((l) => l.fragmentId))];
  if (ids.length < 2) return [];
  const frags = await loadFragments({ ids });
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    include: { place: { select: { name: true } }, povPerson: { select: { name: true } } },
  });
  const themeHint = meta?.symbolicElements ?? meta?.centralConflict ?? null;
  const placeHint = meta?.place?.name ?? null;
  return clusterFragmentsHeuristic(frags, { themeHint, placeHint });
}

export async function suggestFragmentClusters(): Promise<ClusterProposal[]> {
  const frags = await prisma.fragment.findMany({
    where: { parentFragmentId: null },
    select: { id: true, title: true, summary: true, text: true, fragmentType: true, emotionalTone: true },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
  return clusterFragmentsHeuristic(frags, { placeHint: null, themeHint: null });
}

export function clusterByTheme(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
): ClusterProposal[] {
  return clusterFragmentsHeuristic(fragments, { placeHint: null, themeHint: "theme: continuity, loss, land" });
}

export function clusterBySymbol(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
): ClusterProposal[] {
  const sym = fragments.filter((f) => /\b(smoke|river|fire|water|blood|stone|road)\b/i.test(f.text));
  if (sym.length < 2) return [];
  const ids = sym.slice(0, 5).map((f) => f.id);
  const roles: Record<string, string> = {};
  for (const id of ids) roles[id] = ids[0] === id ? "central" : "echo";
  return [
    {
      title: "Shared elemental images",
      clusterType: "symbol",
      summary: "Fragments echoing concrete images that may carry motif weight.",
      emotionalTone: "varies",
      dominantFunction: "symbolic",
      confidence: 3,
      fragmentIds: ids,
      roles,
    },
  ];
}

export function clusterByCharacter(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
  personName: string,
): ClusterProposal[] {
  const esc = personName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${esc}\\b`, "i");
  const hit = fragments.filter((f) => re.test(f.text) || re.test(f.title ?? ""));
  if (hit.length < 2) return [];
  const ids = hit.slice(0, 5).map((f) => f.id);
  const roles: Record<string, string> = Object.fromEntries(ids.map((id) => [id, "supporting"]));
  return [
    {
      title: `${personName} — narrative thread`,
      clusterType: "character",
      summary: `Fragments that mention or orbit ${personName}.`,
      emotionalTone: hit[0]?.emotionalTone ?? null,
      dominantFunction: "character",
      confidence: 3,
      fragmentIds: ids,
      roles,
    },
  ];
}

export function clusterByPlace(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
  placeName: string,
): ClusterProposal[] {
  return clusterByCharacter(fragments, placeName).map((c) => ({
    ...c,
    clusterType: "place",
    title: `${placeName} — place constellation`,
    dominantFunction: "place",
  }));
}

export function clusterByEmotionalCurrent(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
): ClusterProposal[] {
  const buckets = new Map<string, typeof fragments>();
  for (const f of fragments) {
    const key = (f.emotionalTone ?? "unspecified").trim().slice(0, 40) || "unspecified";
    const arr = buckets.get(key) ?? [];
    arr.push(f);
    buckets.set(key, arr);
  }
  const out: ClusterProposal[] = [];
  for (const [tone, arr] of buckets) {
    if (arr.length < 2 || tone === "unspecified") continue;
    const ids = arr.slice(0, 5).map((f) => f.id);
    const roles: Record<string, string> = Object.fromEntries(ids.map((id) => [id, "echo"]));
    out.push({
      title: `Emotional current: ${tone}`,
      clusterType: "emotional_arc",
      summary: "Fragments sharing a tonal label — check for resonance or redundancy.",
      emotionalTone: tone,
      dominantFunction: "emotion",
      confidence: 2,
      fragmentIds: ids,
      roles,
    });
  }
  return out.slice(0, 4);
}

export function clusterByConflictType(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "emotionalTone" | "fragmentType">[],
): ClusterProposal[] {
  const tension = fragments.filter((f) => /\b(but|yet|though|instead|conflict|against|fear)\b/i.test(f.text));
  if (tension.length < 2) return [];
  const ids = tension.slice(0, 5).map((f) => f.id);
  const roles: Record<string, string> = Object.fromEntries(ids.map((id) => [id, "tension"]));
  return [
    {
      title: "Friction and contrast",
      clusterType: "conflict",
      summary: "Fragments where contrast or opposition language is present.",
      emotionalTone: "tense",
      dominantFunction: "conflict",
      confidence: 3,
      fragmentIds: ids,
      roles,
    },
  ];
}

function clusterFragmentsHeuristic(
  fragments: Pick<Fragment, "id" | "title" | "summary" | "text" | "fragmentType" | "emotionalTone">[],
  ctx: { placeHint: string | null; themeHint: string | null },
): ClusterProposal[] {
  if (fragments.length < 2) return [];
  const tok = fragments.map((f) => ({ f, t: buildTokens(f) }));
  const proposals: ClusterProposal[] = [];
  const used = new Set<string>();

  for (let i = 0; i < tok.length; i++) {
    const seed = tok[i];
    if (used.has(seed.f.id)) continue;
    const group: typeof fragments = [seed.f];
    for (let j = 0; j < tok.length && group.length < 5; j++) {
      if (i === j || used.has(tok[j].f.id)) continue;
      if (scoreOverlap(seed.t, tok[j].t) >= 2) {
        group.push(tok[j].f);
      }
    }
    if (group.length >= 2) {
      for (const g of group) used.add(g.id);
      const ids = group.map((g) => g.id);
      const roles: Record<string, string> = {};
      ids.forEach((id, idx) => {
        roles[id] = idx === 0 ? "central" : "supporting";
      });
      const title =
        ctx.placeHint && group.some((g) => g.text.toLowerCase().includes(ctx.placeHint!.toLowerCase()))
          ? `${ctx.placeHint} — echo cluster`
          : `Theme cluster (${group[0].title?.slice(0, 32) ?? "fragments"})`;
      proposals.push({
        title,
        clusterType: "theme",
        summary:
          ctx.themeHint?.slice(0, 200) ??
          "Fragments share lexical overlap — possible thematic constellation.",
        emotionalTone: group.find((g) => g.emotionalTone)?.emotionalTone ?? null,
        dominantFunction: "theme",
        confidence: Math.min(5, 2 + group.length),
        fragmentIds: ids,
        roles,
      });
    }
    if (proposals.length >= 6) break;
  }

  proposals.push(...clusterBySymbol(fragments));
  proposals.push(...clusterByConflictType(fragments));

  return proposals.slice(0, 10);
}
