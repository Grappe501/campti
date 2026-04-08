import type { ReaderState } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EmotionalPullContext = {
  kind: "resume" | "scene" | "character" | "place" | "symbol";
  sceneId?: string | null;
  metaSceneId?: string | null;
  povPersonId?: string | null;
  placeId?: string | null;
  symbolId?: string | null;
  characterId?: string | null;
  /** Optional tension / mystery hints */
  centralConflict?: string | null;
  emotionalVoltage?: string | null;
  symbolName?: string | null;
  placeName?: string | null;
  characterName?: string | null;
};

function pick<T>(seed: string, options: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length]!;
}

function clauseWithName(name: string, templates: string[]): string {
  const n = name.trim();
  const t = pick(n, templates);
  return t.replace(/\{name\}/g, n);
}

/**
 * Composes a one-line emotional hook from structured context (no static copy-paste of full stories).
 */
export function generateEmotionalPullLine(ctx: EmotionalPullContext): string {
  const seed =
    ctx.sceneId ||
    ctx.characterId ||
    ctx.placeId ||
    ctx.symbolId ||
    ctx.metaSceneId ||
    "campti";

  if (ctx.kind === "character" && ctx.characterName) {
    return clauseWithName(ctx.characterName, [
      "Something in {name}’s silence is still asking to be met.",
      "You left before {name} finished what they were holding back.",
      "{name} is still there—on the other side of your attention.",
    ]);
  }
  if (ctx.kind === "place" && ctx.placeName) {
    return clauseWithName(ctx.placeName, [
      "The air at {name} remembers you differently than the map does.",
      "{name} has not gone quiet since you stepped away.",
      "There is weather at {name} that has not finished passing through you.",
    ]);
  }
  if (ctx.kind === "symbol" && ctx.symbolName) {
    return clauseWithName(ctx.symbolName, [
      "“{name}” is still moving through the rooms you have not opened.",
      "The thread of “{name}” tightens the longer you pretend it is only decoration.",
      "Something shaped like “{name}” is waiting in what you skipped.",
    ]);
  }

  const tension = (ctx.centralConflict ?? ctx.emotionalVoltage ?? "").trim();
  if (tension.length > 12) {
    const slice = tension.slice(0, 96);
    return pick(seed, [
      `The unfinished sentence here: ${slice}${tension.length > 96 ? "…" : ""}`,
      `What stayed alive in this moment: ${slice.slice(0, 88)}${tension.length > 88 ? "…" : ""}`,
    ]);
  }

  return pick(seed, [
    "The scene has kept its breath in the place you stopped.",
    "Something leaned toward you—and has not leaned back yet.",
    "You can still feel the next sentence forming under the last one you read.",
    "The story assumes you will return; it left the door ajar on purpose.",
  ]);
}

/** Context-based hook (no DB); pairs with scene/character loaders when ids are unknown. */
export function generateReturnHookFromContext(ctx: EmotionalPullContext): string {
  return generateEmotionalPullLine(ctx);
}

export async function generateReturnHook(
  sceneId: string,
  readerState: ReaderState | null,
): Promise<string> {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, visibility: VisibilityStatus.PUBLIC },
    select: {
      id: true,
      summary: true,
      emotionalTone: true,
      narrativeIntent: true,
      publicReturnHookOverride: true,
    },
  });
  if (scene?.publicReturnHookOverride?.trim()) {
    return scene.publicReturnHookOverride.trim();
  }
  const meta = readerState?.lastMetaSceneId
    ? await prisma.metaScene.findFirst({
        where: { id: readerState.lastMetaSceneId },
        select: {
          centralConflict: true,
          emotionalVoltage: true,
          symbolicElements: true,
        },
      })
    : await prisma.metaScene.findFirst({
        where: { sceneId },
        select: {
          centralConflict: true,
          emotionalVoltage: true,
          symbolicElements: true,
        },
      });

  return generateEmotionalPullLine({
    kind: "scene",
    sceneId,
    metaSceneId: readerState?.lastMetaSceneId ?? null,
    centralConflict: meta?.centralConflict ?? scene?.narrativeIntent,
    emotionalVoltage: meta?.emotionalVoltage ?? scene?.emotionalTone,
    symbolName: meta?.symbolicElements?.trim().slice(0, 48) || null,
  });
}

export async function generateCharacterHook(
  characterId: string,
  readerState: ReaderState | null,
): Promise<string> {
  const person = await prisma.person.findFirst({
    where: { id: characterId, visibility: VisibilityStatus.PUBLIC },
    select: { name: true, description: true },
  });
  if (!person) {
    return generateEmotionalPullLine({ kind: "character", characterId });
  }
  const mem =
    readerState?.lastCharacterId === characterId
      ? " You were already leaning their direction."
      : "";
  return (
    generateEmotionalPullLine({
      kind: "character",
      characterId,
      characterName: person.name,
    }) + mem
  );
}

export async function generateSymbolHook(symbolId: string): Promise<string> {
  const sym = await prisma.symbol.findFirst({
    where: { id: symbolId, visibility: VisibilityStatus.PUBLIC },
    select: { name: true, emotionalTone: true, meaningPrimary: true },
  });
  if (!sym) {
    return generateEmotionalPullLine({ kind: "symbol", symbolId });
  }
  return generateEmotionalPullLine({
    kind: "symbol",
    symbolId,
    symbolName: sym.name,
    emotionalVoltage: sym.emotionalTone,
  });
}

export type SacredHookContext = {
  placeName: string;
  placeDescription?: string | null;
};

/** Grounded in place language — smoke, water, threshold, sacred land. */
export function generateSacredPlaceHook(ctx: SacredHookContext): string {
  const n = ctx.placeName.trim();
  const blob = `${n} ${ctx.placeDescription ?? ""}`.toLowerCase();
  if (/grave|cemetery|burial/.test(blob)) {
    return pick(n, [
      "There is more in the graveyard than a boundary.",
      "The dead do not stay where we left them.",
      "You left before the silence spoke.",
    ]);
  }
  if (/lake|water|river/.test(blob)) {
    return pick(n, [
      "The lake remembers what the child could not say.",
      "Still water still asks its questions.",
      "Return to the waterline—something there is unfinished.",
    ]);
  }
  if (/church|chapel|sanctuary/.test(blob)) {
    return pick(n, [
      "The chapel keeps a draft of your attention.",
      "Light falls differently when you step back inside.",
    ]);
  }
  if (/fire|smoke|flame/.test(blob)) {
    return pick(n, [
      "The fire is still waiting.",
      "Smoke is a kind of handwriting; you began to read it.",
    ]);
  }
  return pick(n, [
    `${n} has kept its weather for you.`,
    `The ground at ${n} has not forgotten your footsteps.`,
  ]);
}

export async function generatePlaceHook(placeId: string): Promise<string> {
  const place = await prisma.place.findFirst({
    where: { id: placeId, visibility: VisibilityStatus.PUBLIC },
    select: { name: true, description: true, publicReturnPhrase: true, placeType: true },
  });
  if (!place) {
    return generateEmotionalPullLine({ kind: "place", placeId });
  }
  if (place.publicReturnPhrase?.trim()) {
    return place.publicReturnPhrase.trim();
  }
  const hay = `${place.name} ${place.description ?? ""}`.toLowerCase();
  if (/(chapel|church|grave|cemetery|burial|lake|fire|fig)/.test(hay)) {
    return generateSacredPlaceHook({
      placeName: place.name,
      placeDescription: place.description,
    });
  }
  return generateEmotionalPullLine({
    kind: "place",
    placeId,
    placeName: place.name,
  });
}

export type GriefHookContext = {
  characterName?: string | null;
  griefPattern?: string | null;
};

export function generateGriefHook(ctx: GriefHookContext): string {
  const g = (ctx.griefPattern ?? "").trim();
  if (g.length > 24) {
    const s = g.slice(0, 92);
    return pick(g, [
      `Something swallowed sits behind: ${s}${g.length > 92 ? "…" : ""}`,
      `Grief here wears a quiet face: ${s.slice(0, 80)}${g.length > 80 ? "…" : ""}`,
    ]);
  }
  const n = ctx.characterName?.trim() ?? "this person";
  return pick(n, [
    "Some grief does not announce itself—it waits in the hands.",
    `What ${n} carries has not finished moving through the room.`,
    "Masculine grief often goes nameless; listen for what it avoids.",
  ]);
}

export type MemoryHookContext = {
  fragment?: string | null;
  placeName?: string | null;
};

export function generateMemoryHook(ctx: MemoryHookContext): string {
  const f = ctx.fragment?.trim();
  if (f && f.length > 20) {
    const s = f.slice(0, 88);
    return pick(f, [
      `A buried memory tugs at the edge: ${s}${f.length > 88 ? "…" : ""}`,
      `You almost named it once: ${s.slice(0, 80)}${f.length > 80 ? "…" : ""}`,
    ]);
  }
  const p = ctx.placeName?.trim();
  if (p) {
    return pick(p, [
      `Memory returns along the path toward ${p}.`,
      `${p} is where the past keeps its weather.`,
    ]);
  }
  return pick("memory", [
    "Something you almost remembered is still nearby.",
    "Return to the moment before the name arrived.",
  ]);
}

export type CovenantHookContext = {
  placeName?: string | null;
  bondPhrase?: string | null;
};

export function generateCovenantHook(ctx: CovenantHookContext): string {
  const b = ctx.bondPhrase?.trim();
  if (b && b.length > 16) {
    const s = b.slice(0, 96);
    return pick(b, [
      `A bond still holds: ${s}${b.length > 96 ? "…" : ""}`,
      `The covenant here is not rhetorical: ${s.slice(0, 88)}${b.length > 88 ? "…" : ""}`,
    ]);
  }
  const p = ctx.placeName?.trim() ?? "this land";
  return pick(p, [
    `The land remembers promises spoken in passing.`,
    `What was sworn near ${p} does not dissolve when you leave.`,
    "Bridges are covenants; you can still feel the timber flex.",
  ]);
}

export const generateSceneReturnHook = generateReturnHook;
export const generateCharacterReturnHook = generateCharacterHook;
export const generateSymbolReturnHook = generateSymbolHook;
export const generatePlaceReturnHook = generatePlaceHook;
