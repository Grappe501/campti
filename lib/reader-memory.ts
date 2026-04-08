import type {
  ReaderImprintEntityType,
  ReaderImprintKind,
  ReaderState,
} from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateReturnHook as composeSceneReturnHook } from "@/lib/emotional-hooks";

export type RecordReaderImprintInput = {
  sessionId: string;
  userId?: string | null;
  entityType: ReaderImprintEntityType;
  entityId: string;
  imprintType: ReaderImprintKind;
  weight: number;
  notes?: string | null;
};

export type LoadOrCreateReaderStateInput = {
  sessionId: string;
  userId?: string | null;
};

export type UpdateReaderStateInput = {
  sessionId: string;
  userId?: string | null;
  lastSceneId?: string | null;
  lastMetaSceneId?: string | null;
  lastCharacterId?: string | null;
  lastPlaceId?: string | null;
  lastSymbolId?: string | null;
  lastMode?: ReaderState["lastMode"] | null;
  emotionalTrace?: string | null;
  returnHook?: string | null;
  continuationHeadline?: string | null;
  lastScrollKey?: string | null;
  scrollAnchorY?: number | null;
  rhythmAuto?: boolean | null;
  notes?: string | null;
};

async function loadStateBySessionOrUserId(key: string): Promise<ReaderState | null> {
  const t = key.trim();
  if (!t) return null;
  const bySession = await prisma.readerState.findUnique({ where: { sessionId: t } });
  if (bySession) return bySession;
  return prisma.readerState.findFirst({
    where: { userId: t },
    orderBy: { lastInteractionAt: "desc" },
  });
}

/**
 * Resolve reader state by session (preferred) or latest row for user.
 */
export async function loadOrCreateReaderState(
  input: LoadOrCreateReaderStateInput,
): Promise<ReaderState> {
  const sid = input.sessionId.trim();
  const existing = await prisma.readerState.findUnique({ where: { sessionId: sid } });
  if (existing) return existing;
  return prisma.readerState.create({
    data: {
      sessionId: sid,
      userId: input.userId?.trim() || null,
      lastInteractionAt: new Date(),
    },
  });
}

export async function updateReaderState(input: UpdateReaderStateInput): Promise<ReaderState> {
  const sid = input.sessionId.trim();
  const data: Parameters<typeof prisma.readerState.update>[0]["data"] = {
    lastInteractionAt: new Date(),
  };
  if (input.userId !== undefined) data.userId = input.userId?.trim() || null;
  if (input.lastSceneId !== undefined) data.lastSceneId = input.lastSceneId;
  if (input.lastMetaSceneId !== undefined) data.lastMetaSceneId = input.lastMetaSceneId;
  if (input.lastCharacterId !== undefined) data.lastCharacterId = input.lastCharacterId;
  if (input.lastPlaceId !== undefined) data.lastPlaceId = input.lastPlaceId;
  if (input.lastSymbolId !== undefined) data.lastSymbolId = input.lastSymbolId;
  if (input.lastMode !== undefined) data.lastMode = input.lastMode ?? undefined;
  if (input.emotionalTrace !== undefined) data.emotionalTrace = input.emotionalTrace;
  if (input.returnHook !== undefined) data.returnHook = input.returnHook;
  if (input.continuationHeadline !== undefined) {
    data.continuationHeadline = input.continuationHeadline;
  }
  if (input.lastScrollKey !== undefined) data.lastScrollKey = input.lastScrollKey;
  if (input.scrollAnchorY !== undefined) data.scrollAnchorY = input.scrollAnchorY;
  if (input.rhythmAuto !== undefined) data.rhythmAuto = input.rhythmAuto;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.readerState.upsert({
    where: { sessionId: sid },
    create: {
      sessionId: sid,
      userId: input.userId?.trim() || null,
      lastSceneId: input.lastSceneId ?? null,
      lastMetaSceneId: input.lastMetaSceneId ?? null,
      lastCharacterId: input.lastCharacterId ?? null,
      lastPlaceId: input.lastPlaceId ?? null,
      lastSymbolId: input.lastSymbolId ?? null,
      lastMode: input.lastMode ?? undefined,
      emotionalTrace: input.emotionalTrace ?? null,
      returnHook: input.returnHook ?? null,
      continuationHeadline: input.continuationHeadline ?? null,
      lastScrollKey: input.lastScrollKey ?? null,
      scrollAnchorY: input.scrollAnchorY ?? null,
      rhythmAuto: input.rhythmAuto ?? true,
      notes: input.notes ?? null,
      lastInteractionAt: new Date(),
    },
    update: data,
  });
}

/**
 * Persist a single imprint row (emotional attention signal).
 */
export async function recordReaderImprint(input: RecordReaderImprintInput): Promise<void> {
  const w = Math.min(5, Math.max(1, Math.round(input.weight)));
  await prisma.readerImprint.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId?.trim() || null,
      entityType: input.entityType,
      entityId: input.entityId,
      imprintType: input.imprintType,
      weight: w,
      notes: input.notes?.trim() || null,
    },
  });
}

export type AttachmentProfile = {
  topEntity?: { type: ReaderImprintEntityType; id: string; score: number };
  imprintCount: number;
  recentPeaks: number;
};

/**
 * Short phrase summarizing recent emotional attention (deterministic, DB-backed).
 */
export async function deriveEmotionalTrace(sessionIdOrUserId: string): Promise<string | null> {
  const state = await loadStateBySessionOrUserId(sessionIdOrUserId);
  if (!state) return null;
  const sid = state.sessionId;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  const rows = await prisma.readerImprint.findMany({
    where: { sessionId: sid, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { entityType: true, imprintType: true, weight: true, notes: true },
  });
  if (!rows.length) return null;

  const byType: Record<string, number> = {};
  let peakW = 0;
  for (const r of rows) {
    const k = r.entityType;
    byType[k] = (byType[k] ?? 0) + r.weight;
    if (r.imprintType === "emotional_peak") peakW += r.weight;
  }
  const top = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [kind] = top;
  const label =
    kind === "character"
      ? "a voice that keeps returning"
      : kind === "place"
        ? "ground that will not release you"
        : kind === "symbol"
          ? "an image that insists"
          : kind === "audio"
            ? "a listening presence that stayed with you"
            : "a moment still unfinished";
  const tension = peakW >= 8 ? " — something in you stayed awake." : ".";
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${tension}`;
}

async function computeFreshReturnHook(sessionId: string): Promise<string | null> {
  const state = await prisma.readerState.findUnique({ where: { sessionId } });
  if (!state?.lastSceneId) return null;
  return await composeSceneReturnHook(state.lastSceneId, state);
}

export async function deriveReturnHook(sessionIdOrUserId: string): Promise<string | null> {
  const state = await loadStateBySessionOrUserId(sessionIdOrUserId);
  if (!state) return null;
  if (state.returnHook?.trim()) return state.returnHook.trim();
  if (state.lastSceneId) {
    return computeFreshReturnHook(state.sessionId);
  }
  return null;
}

/** Recomputes trace + hook from imprints and scene (writes DB). */
export async function refreshReaderEmotionalFields(sessionId: string): Promise<void> {
  const trace = await deriveEmotionalTrace(sessionId);
  const hook = await computeFreshReturnHook(sessionId);
  await prisma.readerState.update({
    where: { sessionId },
    data: {
      emotionalTrace: trace,
      returnHook: hook,
      lastInteractionAt: new Date(),
    },
  });
}

export async function deriveAttachmentProfile(sessionId: string): Promise<AttachmentProfile> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const rows = await prisma.readerImprint.findMany({
    where: { sessionId, createdAt: { gte: since } },
    select: { entityType: true, entityId: true, weight: true, imprintType: true },
  });
  const score = new Map<string, number>();
  let peaks = 0;
  for (const r of rows) {
    const k = `${r.entityType}:${r.entityId}`;
    score.set(k, (score.get(k) ?? 0) + r.weight);
    if (r.imprintType === "emotional_peak") peaks++;
  }
  let best: { type: ReaderImprintEntityType; id: string; score: number } | undefined;
  for (const [k, s] of score) {
    const [type, id] = k.split(":") as [ReaderImprintEntityType, string];
    if (!best || s > best.score) best = { type, id, score: s };
  }
  return { topEntity: best, imprintCount: rows.length, recentPeaks: peaks };
}

export type StrongEntity = {
  type: ReaderImprintEntityType;
  id: string;
  score: number;
};

export async function deriveStrongestEntities(
  sessionId: string,
  limit = 8,
): Promise<StrongEntity[]> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const rows = await prisma.readerImprint.findMany({
    where: { sessionId, createdAt: { gte: since } },
    select: { entityType: true, entityId: true, weight: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.entityType}:${r.entityId}`;
    map.set(k, (map.get(k) ?? 0) + r.weight);
  }
  return [...map.entries()]
    .map(([k, score]) => {
      const [type, id] = k.split(":") as [ReaderImprintEntityType, string];
      return { type, id, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function deriveStrongestSymbols(
  sessionId: string,
  limit = 5,
): Promise<StrongEntity[]> {
  const all = await deriveStrongestEntities(sessionId, 40);
  return all.filter((e) => e.type === "symbol").slice(0, limit);
}

export async function deriveStrongestCharacters(
  sessionId: string,
  limit = 5,
): Promise<StrongEntity[]> {
  const all = await deriveStrongestEntities(sessionId, 40);
  return all.filter((e) => e.type === "character").slice(0, limit);
}

export async function deriveStrongestPlaces(
  sessionId: string,
  limit = 5,
): Promise<StrongEntity[]> {
  const all = await deriveStrongestEntities(sessionId, 40);
  return all.filter((e) => e.type === "place").slice(0, limit);
}

export async function deriveStrongestThreads(sessionId: string): Promise<
  { threadType: string; label: string; strength: number }[]
> {
  const persisted = await prisma.readerThread.findMany({
    where: { sessionId, isActive: true },
    orderBy: { strength: "desc" },
    take: 12,
    select: { threadType: true, label: true, strength: true },
  });
  if (persisted.length) {
    return persisted.map((t) => ({
      threadType: t.threadType,
      label: t.label,
      strength: t.strength ?? 1,
    }));
  }
  const favs = await deriveFavoriteEntities(sessionId, 6);
  return favs.map((f) => ({
    threadType: f.type,
    label: `${f.type}:${f.id}`,
    strength: f.weight,
  }));
}

export type FavoriteEntity = {
  type: ReaderImprintEntityType;
  id: string;
  weight: number;
};

export async function deriveFavoriteEntities(
  sessionId: string,
  limit = 6,
): Promise<FavoriteEntity[]> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const rows = await prisma.readerImprint.findMany({
    where: { sessionId, createdAt: { gte: since } },
    select: { entityType: true, entityId: true, weight: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.entityType}:${r.entityId}`;
    map.set(k, (map.get(k) ?? 0) + r.weight);
  }
  return [...map.entries()]
    .map(([k, weight]) => {
      const [type, id] = k.split(":") as [ReaderImprintEntityType, string];
      return { type, id, weight };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export type NeglectedThread = {
  type: ReaderImprintEntityType;
  id: string;
  label: string;
};

/**
 * Surfaces linked entities from the reader's last scene that have weak imprint signal.
 */
export async function deriveNeglectedButRelevantThreads(
  sessionId: string,
): Promise<NeglectedThread[]> {
  const state = await prisma.readerState.findUnique({
    where: { sessionId },
    select: { lastSceneId: true },
  });
  if (!state?.lastSceneId) return [];

  const scene = await prisma.scene.findFirst({
    where: { id: state.lastSceneId },
    select: {
      persons: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
      places: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
      symbols: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
    },
  });
  if (!scene) return [];

  const favs = await deriveFavoriteEntities(sessionId, 20);
  const favSet = new Set(favs.map((f) => `${f.type}:${f.id}`));

  const out: NeglectedThread[] = [];
  for (const p of scene.persons) {
    const k = `character:${p.id}`;
    if (!favSet.has(k) || (favs.find((x) => x.id === p.id && x.type === "character")?.weight ?? 0) < 4) {
      out.push({ type: "character", id: p.id, label: p.name });
    }
  }
  for (const pl of scene.places) {
    const k = `place:${pl.id}`;
    if (!favSet.has(k) || (favs.find((x) => x.id === pl.id && x.type === "place")?.weight ?? 0) < 4) {
      out.push({ type: "place", id: pl.id, label: pl.name });
    }
  }
  for (const s of scene.symbols) {
    const k = `symbol:${s.id}`;
    if (!favSet.has(k) || (favs.find((x) => x.id === s.id && x.type === "symbol")?.weight ?? 0) < 3) {
      out.push({ type: "symbol", id: s.id, label: s.name });
    }
  }
  return out.slice(0, 5);
}
