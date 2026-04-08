import type { ReaderState } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveFavoriteEntities, type FavoriteEntity } from "@/lib/reader-memory";
import { resolvePublicMetaSceneIdForScene } from "@/lib/guided-experience";

export type ReaderThreadHint = {
  href: string;
  label: string;
  weight: number;
  kind: "character" | "place" | "symbol" | "emotional" | "scene" | "spiritual";
};

function pronounStay(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.length ? `Stay with ${first}` : "Stay with this thread";
}

export async function deriveCharacterThread(
  readerState: ReaderState | null,
  favorites: FavoriteEntity[],
): Promise<ReaderThreadHint | null> {
  const char =
    favorites.find((f) => f.type === "character") ??
    (readerState?.lastCharacterId
      ? ({ type: "character" as const, id: readerState.lastCharacterId, weight: 3 })
      : null);
  if (!char) return null;
  const p = await prisma.person.findFirst({
    where: { id: char.id, visibility: VisibilityStatus.PUBLIC },
    select: { name: true },
  });
  if (!p) return null;
  return {
    href: `/read/characters/${char.id}`,
    label: pronounStay(p.name),
    weight: char.weight + 10,
    kind: "character",
  };
}

export async function deriveSymbolThread(
  readerState: ReaderState | null,
  favorites: FavoriteEntity[],
): Promise<ReaderThreadHint | null> {
  const sym =
    favorites.find((f) => f.type === "symbol") ??
    (readerState?.lastSymbolId
      ? ({ type: "symbol" as const, id: readerState.lastSymbolId, weight: 2 })
      : null);
  if (!sym) return null;
  const s = await prisma.symbol.findFirst({
    where: { id: sym.id, visibility: VisibilityStatus.PUBLIC },
    select: { name: true },
  });
  if (!s) return null;
  return {
    href: `/read/symbols#${sym.id}`,
    label: `Follow “${s.name}”`,
    weight: sym.weight + 8,
    kind: "symbol",
  };
}

export async function derivePlaceThread(
  readerState: ReaderState | null,
  favorites: FavoriteEntity[],
): Promise<ReaderThreadHint | null> {
  const pl =
    favorites.find((f) => f.type === "place") ??
    (readerState?.lastPlaceId
      ? ({ type: "place" as const, id: readerState.lastPlaceId, weight: 2 })
      : null);
  if (!pl) return null;
  const place = await prisma.place.findFirst({
    where: { id: pl.id, visibility: VisibilityStatus.PUBLIC },
    select: { name: true },
  });
  if (!place) return null;
  return {
    href: `/read/places/${pl.id}`,
    label: `Return to ${place.name}`,
    weight: pl.weight + 8,
    kind: "place",
  };
}

export async function deriveEmotionalThread(
  sessionId: string,
  readerState: ReaderState | null,
): Promise<ReaderThreadHint | null> {
  const trace = readerState?.emotionalTrace?.trim();
  if (!trace) return null;
  if (!readerState?.lastSceneId) return null;
  return {
    href: `/read/scenes/${readerState.lastSceneId}`,
    label: trace.length > 72 ? `${trace.slice(0, 72)}…` : trace,
    weight: 14,
    kind: "emotional",
  };
}

export async function deriveSceneThread(
  readerState: ReaderState | null,
): Promise<ReaderThreadHint | null> {
  if (!readerState?.lastSceneId) return null;
  const scene = await prisma.scene.findFirst({
    where: { id: readerState.lastSceneId, visibility: VisibilityStatus.PUBLIC },
    select: {
      id: true,
      summary: true,
      description: true,
      publicContinuationInvitationLine: true,
    },
  });
  if (!scene) return null;
  const label =
    scene.publicContinuationInvitationLine?.trim() ||
    (scene.summary?.trim()
      ? `Pick up the thread: ${scene.summary.trim().slice(0, 64)}${scene.summary.length > 64 ? "…" : ""}`
      : "Continue the experience where the light last changed.");
  return {
    href: `/read/scenes/${scene.id}`,
    label,
    weight: 16,
    kind: "scene",
  };
}

export async function deriveSpiritualThread(
  readerState: ReaderState | null,
): Promise<ReaderThreadHint | null> {
  const sid = readerState?.lastSceneId;
  if (!sid) return null;
  const metaId =
    readerState?.lastMetaSceneId?.trim() || (await resolvePublicMetaSceneIdForScene(sid));
  if (!metaId) return null;
  const meta = await prisma.metaScene.findFirst({
    where: { id: metaId },
    select: {
      symbolicElements: true,
      place: { select: { name: true, description: true, publicReturnPhrase: true } },
    },
  });
  const sym = meta?.symbolicElements?.trim();
  const sacred =
    meta?.place?.publicReturnPhrase?.trim() ||
    (sym && sym.length > 12
      ? `Step closer to the line: ${sym.slice(0, 80)}${sym.length > 80 ? "…" : ""}`
      : null);
  if (!sacred) return null;
  return {
    href: `/read/scenes/${sid}`,
    label: sacred.length > 90 ? `${sacred.slice(0, 90)}…` : sacred,
    weight: 11,
    kind: "spiritual",
  };
}

export type ThreadEntry = ReaderThreadHint & { rank: number };

/**
 * Single best next step in thread space (deterministic ordering).
 */
export async function deriveNextThreadEntry(
  sessionId: string,
  readerState: ReaderState | null,
): Promise<ThreadEntry | null> {
  const hints = await deriveThreadHintsForSession(sessionId);
  if (!hints.length) return null;
  const sorted = [...hints].sort((a, b) => b.weight - a.weight);
  const top = sorted[0]!;
  return { ...top, rank: 1 };
}

export async function deriveThreadHintsForSession(sessionId: string): Promise<ReaderThreadHint[]> {
  const state = await prisma.readerState.findUnique({ where: { sessionId } });
  const favs = await deriveFavoriteEntities(sessionId, 12);
  const [c, s, p, e, sceneT, spirit] = await Promise.all([
    deriveCharacterThread(state, favs),
    deriveSymbolThread(state, favs),
    derivePlaceThread(state, favs),
    deriveEmotionalThread(sessionId, state),
    deriveSceneThread(state),
    deriveSpiritualThread(state),
  ]);
  const list = [c, s, p, e, sceneT, spirit].filter(Boolean) as ReaderThreadHint[];
  const seen = new Set<string>();
  const out: ReaderThreadHint[] = [];
  for (const h of list) {
    if (seen.has(h.href)) continue;
    seen.add(h.href);
    out.push(h);
  }
  return out;
}
