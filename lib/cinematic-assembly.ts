import type { SceneBeatRecord } from "@/lib/scene-beats";
import type { NarrativeStylePreset } from "@/lib/descriptive-validation";
import { NARRATIVE_STYLE_PRESETS } from "@/lib/narrative-style";

export type CinematicAssemblyContext = {
  placeName: string;
  povName: string;
  beats: SceneBeatRecord[];
  /** Approved narrative/voice fragments (already public-safe when used on site). */
  anchorExcerpt: string | null;
  styleMode?: NarrativeStylePreset | string | null;
};

function styleLine(mode: string | null | undefined): string {
  if (!mode) return "";
  if (mode in NARRATIVE_STYLE_PRESETS) {
    return NARRATIVE_STYLE_PRESETS[mode as NarrativeStylePreset].guidance;
  }
  return "";
}

function para(...parts: string[]): string {
  return parts.filter((p) => p?.trim()).join("\n\n");
}

export function assembleSceneOpening(ctx: CinematicAssemblyContext): string {
  const b = ctx.beats.find((x) => x.beatType === "opening");
  const guide = styleLine(ctx.styleMode ?? null);
  return para(
    `${ctx.povName} crosses into ${ctx.placeName}.`,
    b?.summary ?? "",
    guide ? `(${guide})` : "",
  ).replace(/\(\s*\)/g, "");
}

export function assembleBodyTension(ctx: CinematicAssemblyContext): string {
  const inc = ctx.beats.find((x) => x.beatType === "inciting");
  const pr = ctx.beats.find((x) => x.beatType === "pressure");
  return para(inc?.summary ?? "", pr?.summary ?? "");
}

export function assembleSilentTurn(ctx: CinematicAssemblyContext): string {
  const s = ctx.beats.find((x) => x.beatType === "silence");
  return (
    s?.summary ??
    "The room learns a new shape in the quiet—smaller, or vaster, depending on who is afraid."
  );
}

export function assembleMemoryFlash(ctx: CinematicAssemblyContext): string {
  const line =
    ctx.anchorExcerpt?.trim().slice(0, 520) ||
    "A memory rises without permission—image first, meaning later.";
  return para("Memory threads beneath the present:", line);
}

export function assembleSymbolicBeat(ctx: CinematicAssemblyContext): string {
  const rev = ctx.beats.find((x) => x.beatType === "reveal");
  return para(rev?.summary ?? "", rev?.symbolicCharge ?? "");
}

export function assembleClosingImage(ctx: CinematicAssemblyContext): string {
  const ex = ctx.beats.find((x) => x.beatType === "exit");
  return ex?.summary ?? "The last thing noticed is small, exact, and difficult to forget.";
}

export function assembleTransitionBeat(
  ctx: CinematicAssemblyContext,
  towardLabel?: string | null,
): string {
  const bridge = ctx.beats.find((x) => x.beatType === "bridge");
  if (bridge) return bridge.summary;
  const label = towardLabel?.trim() || "what follows";
  return `The moment releases—not into relief, into ${label}.`;
}

/** Compose a full scene-shaped draft from beats + anchor. */
export function assembleFullSceneProse(ctx: CinematicAssemblyContext): string {
  return para(
    assembleSceneOpening(ctx),
    assembleBodyTension(ctx),
    assembleMemoryFlash(ctx),
    assembleSymbolicBeat(ctx),
    assembleSilentTurn(ctx),
    assembleClosingImage(ctx),
  );
}
