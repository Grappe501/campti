import {
  scoreEmotionalGravity,
  deriveReaderPull,
  deriveSceneLonging,
  deriveSceneMystery,
  buildGravityTimingContext,
} from "@/lib/emotional-gravity";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import {
  resolvePublicMetaSceneIdForScene,
} from "@/lib/guided-experience";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReaderImprintEntityType } from "@prisma/client";
import { derivePremiumDepthOffers } from "@/lib/premium-depth-offers";

export type ReaderNextAction = {
  id: string;
  label: string;
  href: string;
  weight: number;
  kind:
    | "continue_story"
    | "character"
    | "place"
    | "symbol"
    | "listen"
    | "membership"
    | "premium_depth";
};

function rank(actions: ReaderNextAction[], limit = 6): ReaderNextAction[] {
  return [...actions].sort((a, b) => b.weight - a.weight).slice(0, limit);
}

type MemoryBoost = {
  byKey: Map<string, number>;
  emotionalTrace: string | null;
  tension: string | null;
  strongest: { type: ReaderImprintEntityType; id: string; weight: number } | null;
};

async function loadMemoryBoost(sessionId: string | null): Promise<MemoryBoost | null> {
  if (!sessionId?.trim()) return null;
  const sid = sessionId.trim();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const [state, imprints] = await Promise.all([
    prisma.readerState.findUnique({
      where: { sessionId: sid },
      select: { emotionalTrace: true },
    }),
    prisma.readerImprint.findMany({
      where: { sessionId: sid, createdAt: { gte: since } },
      select: { entityType: true, entityId: true, weight: true },
    }),
  ]);
  const byKey = new Map<string, number>();
  let strongest: MemoryBoost["strongest"] = null;
  for (const r of imprints) {
    const k = `${r.entityType}:${r.entityId}`;
    const next = (byKey.get(k) ?? 0) + r.weight;
    byKey.set(k, next);
    if (!strongest || next > strongest.weight) {
      strongest = { type: r.entityType, id: r.entityId, weight: next };
    }
  }
  return {
    byKey,
    emotionalTrace: state?.emotionalTrace?.trim() ?? null,
    tension: null,
    strongest,
  };
}

function boostForEntity(
  mem: (MemoryBoost & { tension: string | null }) | null,
  type: ReaderImprintEntityType,
  id: string,
): number {
  if (!mem) return 0;
  return Math.min(14, mem.byKey.get(`${type}:${id}`) ?? 0);
}

function refineActionsWithMemory(
  actions: ReaderNextAction[],
  scene: {
    persons: { id: string; name: string }[];
    places: { id: string; name: string }[];
    symbols: { id: string; name: string }[];
  },
  mem: (MemoryBoost & { tension: string | null }) | null,
): ReaderNextAction[] {
  if (!mem) return actions;
  const tp = scene.persons[0];
  const tpl = scene.places[0];
  const ts = scene.symbols[0];
  return actions.map((a) => {
    if (a.kind === "continue_story") {
      if (mem.tension && mem.tension.length > 8) {
        return {
          ...a,
          label: "Stay with what is still unresolved",
          weight: a.weight + 7,
        };
      }
      if (mem.emotionalTrace) {
        return {
          ...a,
          label: "Follow the feeling you already started",
          weight: a.weight + 5,
        };
      }
    }
    if (a.kind === "character" && tp) {
      const extra = boostForEntity(mem, "character", tp.id);
      const strong =
        mem.strongest?.type === "character" && mem.strongest.id === tp.id && mem.strongest.weight >= 8;
      return {
        ...a,
        weight: a.weight + extra + (strong ? 4 : 0),
        label: strong ? `Stay with ${tp.name.split(/\s+/)[0] ?? tp.name}` : a.label,
      };
    }
    if (a.kind === "place" && tpl) {
      const extra = boostForEntity(mem, "place", tpl.id);
      const strong =
        mem.strongest?.type === "place" && mem.strongest.id === tpl.id && mem.strongest.weight >= 8;
      return {
        ...a,
        weight: a.weight + extra + (strong ? 3 : 0),
        label: strong ? `Return to ${tpl.name}` : a.label,
      };
    }
    if (a.kind === "symbol" && ts) {
      const extra = boostForEntity(mem, "symbol", ts.id);
      return {
        ...a,
        weight: a.weight + extra,
        label:
          mem.strongest?.type === "symbol" && mem.strongest.id === ts.id
            ? `Follow “${ts.name}”`
            : a.label,
      };
    }
    return a;
  });
}

async function refineActionsWithGravity(
  metaSceneId: string | null,
  actions: ReaderNextAction[],
  scene: {
    persons: { id: string; name: string }[];
    places: { id: string; name: string }[];
    symbols: { id: string; name: string }[];
  },
): Promise<ReaderNextAction[]> {
  if (!metaSceneId) return actions;
  try {
    const [gravity, longingLine, ctx] = await Promise.all([
      buildGravityTimingContext(metaSceneId),
      deriveSceneLonging(metaSceneId),
      buildNarrativeConsciousnessContext(metaSceneId, { publicOnly: true }),
    ]);
    const symbolName = ctx?.metaFields.symbolicElements?.trim().slice(0, 42);
    const topPerson = scene.persons[0];
    const topPlace = scene.places[0];
    const topSym = scene.symbols[0];

    return actions.map((a) => {
      if (a.kind === "character" && topPerson && gravity.longing > 0.42 && longingLine) {
        return {
          ...a,
          label: `Stay with ${topPerson.name} a little longer`,
          weight: a.weight + 4,
        };
      }
      if (a.kind === "place" && topPlace && gravity.mystery > 0.48) {
        return {
          ...a,
          label: `Step closer to ${topPlace.name}`,
          weight: a.weight + 3,
        };
      }
      if (a.kind === "symbol" && topSym) {
        const symLabel =
          gravity.longing > 0.5 && symbolName
            ? `Follow the thread of “${topSym.name}”`
            : `Let “${topSym.name}” keep echoing`;
        return { ...a, label: symLabel, weight: a.weight + 2 };
      }
      if (a.kind === "continue_story" && gravity.threat > 0.52 && gravity.mystery > 0.4) {
        return { ...a, weight: a.weight + 5 };
      }
      return a;
    });
  } catch {
    return actions;
  }
}

export async function deriveNextBestReaderActions(
  sceneId: string,
  sessionId?: string | null,
): Promise<ReaderNextAction[]> {
  const [scene, memory, metaId, readerState] = await Promise.all([
    prisma.scene.findFirst({
      where: { id: sceneId, visibility: VisibilityStatus.PUBLIC },
      select: {
        id: true,
        summary: true,
        emotionalTone: true,
        chapterId: true,
        publicPremiumInvitationLine: true,
        chapter: { select: { id: true, title: true } },
        persons: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
        places: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
        symbols: { where: { visibility: VisibilityStatus.PUBLIC }, select: { id: true, name: true } },
      },
    }),
    loadMemoryBoost(sessionId ?? null),
    resolvePublicMetaSceneIdForScene(sceneId),
    sessionId?.trim()
      ? prisma.readerState.findUnique({ where: { sessionId: sessionId.trim() } })
      : Promise.resolve(null),
  ]);
  if (!scene) return [];

  const premiumOffers = await derivePremiumDepthOffers(sceneId, readerState).catch(() => []);

  const metaTension = metaId
    ? (
        await prisma.metaScene.findFirst({
          where: { id: metaId },
          select: { centralConflict: true },
        })
      )?.centralConflict?.trim().slice(0, 160) ?? null
    : null;

  const memoryCtx: (MemoryBoost & { tension: string | null }) | null = memory
    ? { ...memory, tension: metaTension }
    : metaTension
      ? {
          byKey: new Map<string, number>(),
          emotionalTrace: null,
          tension: metaTension,
          strongest: null,
        }
      : null;
  let gravity = 40;
  let pull = "Stay with the thread.";
  let longing: string | null = null;
  let mystery: string | null = null;
  if (metaId) {
    gravity = await scoreEmotionalGravity(metaId);
    pull = await deriveReaderPull(metaId);
    longing = await deriveSceneLonging(metaId);
    mystery = await deriveSceneMystery(metaId);
  }

  const actions: ReaderNextAction[] = [];

  const ordered = await prisma.scene.findMany({
    where: { chapterId: scene.chapterId, visibility: VisibilityStatus.PUBLIC },
    orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
    select: { id: true },
  });
  const idx = ordered.findIndex((s) => s.id === sceneId);
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  if (next) {
    actions.push({
      id: "continue",
      label: "Continue the story",
      href: `/read/scenes/${next.id}`,
      weight: 90 + gravity * 0.15,
      kind: "continue_story",
    });
  } else {
    actions.push({
      id: "chapter",
      label: "Continue the story",
      href: `/read/chapters/${scene.chapter.id}`,
      weight: 72,
      kind: "continue_story",
    });
  }

  const topPerson = scene.persons[0];
  if (topPerson) {
    actions.push({
      id: `char-${topPerson.id}`,
      label: `Step deeper with ${topPerson.name}`,
      href: `/read/characters/${topPerson.id}`,
      weight: 62 + (longing ? 8 : 0),
      kind: "character",
    });
  }

  const topPlace = scene.places[0];
  if (topPlace) {
    actions.push({
      id: `place-${topPlace.id}`,
      label: `Enter ${topPlace.name} more fully`,
      href: `/read/places/${topPlace.id}`,
      weight: 58 + (mystery ? 6 : 0),
      kind: "place",
    });
  }

  const topSym = scene.symbols[0];
  if (topSym) {
    actions.push({
      id: `sym-${topSym.id}`,
      label: `Follow “${topSym.name}” further`,
      href: `/read/symbols#${topSym.id}`,
      weight: 52,
      kind: "symbol",
    });
  }

  const audioOr: ({ sceneId: string } | { metaSceneId: string })[] = [{ sceneId }];
  if (metaId) audioOr.push({ metaSceneId: metaId });
  const audio = await prisma.sceneAudioAsset.findFirst({
    where: {
      status: "published",
      assetType: { in: ["narration", "immersive_mix", "excerpt"] },
      OR: audioOr,
    },
    select: { id: true },
  });
  if (audio) {
    actions.push({
      id: "listen",
      label: "Listen to this moment",
      href: `#scene-audio`,
      weight: 68,
      kind: "listen",
    });
  } else {
    actions.push({
      id: "listen-teaser",
      label: "Listen to this moment",
      href: "/membership",
      weight: 28,
      kind: "listen",
    });
  }

  if (premiumOffers.length > 0) {
    const top = premiumOffers[0]!;
    const label =
      scene.publicPremiumInvitationLine?.trim() ||
      top.label;
    actions.push({
      id: "premium-depth",
      label,
      href: "/membership",
      weight: 44 + (readerState?.lastMode === "listen" ? 10 : 0) + (memoryCtx?.emotionalTrace ? 4 : 0),
      kind: "premium_depth",
    });
  }

  actions.push({
    id: "membership",
    label: "Explore deeper access",
    href: "/membership",
    weight: 18 + (pull ? 4 : 0),
    kind: "membership",
  });

  const withMemory = refineActionsWithMemory(actions, scene, memoryCtx);
  const refined = await refineActionsWithGravity(metaId, withMemory, scene);
  return rank(refined);
}

export async function deriveCharacterPull(sceneId: string): Promise<ReaderNextAction | null> {
  const actions = await deriveNextBestReaderActions(sceneId);
  return actions.find((a) => a.kind === "character") ?? null;
}

export async function derivePlacePull(sceneId: string): Promise<ReaderNextAction | null> {
  const actions = await deriveNextBestReaderActions(sceneId);
  return actions.find((a) => a.kind === "place") ?? null;
}

export async function deriveSymbolPull(sceneId: string): Promise<ReaderNextAction | null> {
  const actions = await deriveNextBestReaderActions(sceneId);
  return actions.find((a) => a.kind === "symbol") ?? null;
}

export async function deriveMembershipPull(sceneId: string): Promise<ReaderNextAction | null> {
  const actions = await deriveNextBestReaderActions(sceneId);
  return actions.find((a) => a.kind === "membership") ?? null;
}
