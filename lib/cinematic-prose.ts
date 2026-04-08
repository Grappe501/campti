import {
  buildNarrativeConsciousnessContext,
  type NarrativeConsciousnessContext,
} from "@/lib/narrative-consciousness";
import { prisma } from "@/lib/prisma";
import {
  deriveSceneBeatSequence,
  type SceneBeatRecord,
} from "@/lib/scene-beats";
import {
  assembleClosingImage,
  assembleFullSceneProse,
  assembleSceneOpening,
  assembleTransitionBeat,
  assembleMemoryFlash,
  assembleSymbolicBeat,
  type CinematicAssemblyContext,
} from "@/lib/cinematic-assembly";
import type { NarrativeStylePreset } from "@/lib/descriptive-validation";
import { scoreCinematicPass } from "@/lib/cinematic-quality";

export type CinematicProseOptions = {
  styleMode?: NarrativeStylePreset | string | null;
  /** When true, consciousness context includes non-public relationship targets (admin generation). */
  adminContext?: boolean;
};

export type CinematicProseResult = {
  content: string;
  summary: string;
  confidence: number;
  beats: SceneBeatRecord[];
};

async function loadSymbolAndBindingLines(metaSceneId: string, sceneId: string | null) {
  const lines: string[] = [];
  const bindings = await prisma.narrativeBinding.findMany({
    where: {
      OR: [
        { sourceType: "meta_scene", sourceId: metaSceneId },
        { targetType: "meta_scene", targetId: metaSceneId },
      ],
    },
    take: 24,
    select: { relationship: true, notes: true, strength: true },
  });
  for (const b of bindings) {
    const bit = [b.relationship, b.notes].filter(Boolean).join(" — ");
    if (bit) lines.push(bit);
  }
  if (sceneId) {
    const syms = await prisma.symbol.findMany({
      where: { scenes: { some: { id: sceneId } } },
      take: 8,
      select: { name: true, meaning: true, meaningPrimary: true, emotionalTone: true },
    });
    for (const s of syms) {
      const m = s.meaningPrimary?.trim() || s.meaning?.trim();
      if (m) lines.push(`${s.name}: ${m}`);
      else if (s.emotionalTone?.trim()) lines.push(`${s.name} (${s.emotionalTone})`);
    }
  }
  return lines;
}

async function anchorExcerptFromPasses(ctx: NarrativeConsciousnessContext): Promise<string | null> {
  const richest =
    ctx.narrativePasses.find((p) => p.passType === "full_structured") ||
    ctx.narrativePasses.find((p) => p.passType === "embodied") ||
    ctx.narrativePasses[0];
  const voice = ctx.voicePasses.find((p) =>
    ["pov_render", "character_voice"].includes(p.passType),
  );
  const chunk = voice?.content?.trim() || richest?.content?.trim();
  return chunk ? chunk.slice(0, 900) : null;
}

function buildAssemblyCtx(
  ctx: NarrativeConsciousnessContext,
  beats: SceneBeatRecord[],
  anchor: string | null,
  styleMode?: string | null,
): CinematicAssemblyContext {
  return {
    placeName: ctx.place.name,
    povName: ctx.povPerson.name,
    beats,
    anchorExcerpt: anchor,
    styleMode: styleMode ?? undefined,
  };
}

async function baseResult(
  metaSceneId: string,
  options: CinematicProseOptions | undefined,
  build: (ctx: NarrativeConsciousnessContext, asm: CinematicAssemblyContext) => string,
  summaryLine: string,
): Promise<CinematicProseResult | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
    publicOnly: options?.adminContext ? false : true,
  });
  if (!ctx) return null;
  const beats = deriveSceneBeatSequence(ctx);
  const bindingLines = await loadSymbolAndBindingLines(metaSceneId, ctx.sceneId);
  const anchor = (await anchorExcerptFromPasses(ctx)) || bindingLines.join("\n") || null;
  const asm = buildAssemblyCtx(ctx, beats, anchor, options?.styleMode ?? null);
  const content = build(ctx, asm);
  const scored = scoreCinematicPass({ content, passType: "cinematic" });
  return {
    content: content.trim(),
    summary: summaryLine.slice(0, 400),
    confidence: scored.overall,
    beats,
  };
}

export async function generateCinematicOpening(
  metaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  return baseResult(metaSceneId, options, (_, asm) => assembleSceneOpening(asm), "Cinematic opening");
}

export async function generateCinematicScenePass(
  metaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  return baseResult(
    metaSceneId,
    options,
    (_, asm) => assembleFullSceneProse(asm),
    "Full cinematic scene pass",
  );
}

export async function generateCinematicExcerpt(
  metaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  return baseResult(
    metaSceneId,
    options,
    (_, asm) =>
      [assembleSceneOpening(asm), assembleSymbolicBeat(asm), assembleClosingImage(asm)].join(
        "\n\n",
      ),
    "Cinematic excerpt",
  );
}

export async function generateCinematicTransition(
  fromMetaSceneId: string,
  toMetaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  const fromCtx = await buildNarrativeConsciousnessContext(fromMetaSceneId, {
    publicOnly: options?.adminContext ? false : true,
  });
  const toMeta = await prisma.metaScene.findUnique({
    where: { id: toMetaSceneId },
    select: { title: true, place: { select: { name: true } } },
  });
  if (!fromCtx || !toMeta) return null;
  const beats = deriveSceneBeatSequence(fromCtx);
  const anchor = await anchorExcerptFromPasses(fromCtx);
  const asm = buildAssemblyCtx(fromCtx, beats, anchor, options?.styleMode ?? null);
  const toward = `${toMeta.title} · ${toMeta.place.name}`;
  const content = [
    assembleClosingImage(asm),
    assembleTransitionBeat(asm, toward),
  ].join("\n\n");
  const scored = scoreCinematicPass({ content, passType: "transition" });
  return {
    content: content.trim(),
    summary: `Transition toward ${toward}`.slice(0, 400),
    confidence: scored.overall,
    beats,
  };
}

export async function generateAudioReadyNarration(
  metaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  return baseResult(
    metaSceneId,
    { ...options, styleMode: options?.styleMode ?? "audio_clean" },
    (_, asm) => {
      const base = assembleFullSceneProse(asm);
      return base
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .join("\n\n[brief pause]\n\n");
    },
    "Audio-ready narration script",
  );
}

export async function generatePremiumExtendedPass(
  metaSceneId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  const base = await generateCinematicScenePass(metaSceneId, {
    ...options,
    styleMode: options?.styleMode ?? "symbolic_dense",
  });
  if (!base) return null;
  const extra = await baseResult(
    metaSceneId,
    options,
    (_, asm) => assembleMemoryFlash(asm),
    "",
  );
  const merged = extra
    ? `${base.content}\n\n—\n\n${extra.content}`
    : base.content;
  const scored = scoreCinematicPass({ content: merged, passType: "premium_extended" });
  return {
    content: merged.trim(),
    summary: "Premium extended cinematic pass",
    confidence: scored.overall,
    beats: base.beats,
  };
}

export async function generateAlternatePovPass(
  metaSceneId: string,
  personId: string,
  options?: CinematicProseOptions,
): Promise<CinematicProseResult | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
    publicOnly: options?.adminContext ? false : true,
  });
  const other = await prisma.person.findUnique({
    where: { id: personId },
    select: {
      name: true,
      description: true,
      characterProfile: {
        select: {
          emotionalBaseline: true,
          attentionBias: true,
          memoryBias: true,
          coreFear: true,
          coreLonging: true,
        },
      },
    },
  });
  if (!ctx || !other) return null;

  const beats = deriveSceneBeatSequence(ctx);
  const lens = [
    other.characterProfile?.emotionalBaseline,
    other.characterProfile?.attentionBias,
    other.description,
  ]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join("\n");

  const asm: CinematicAssemblyContext = {
    placeName: ctx.place.name,
    povName: other.name,
    beats,
    anchorExcerpt: lens.slice(0, 800) || null,
    styleMode: options?.styleMode ?? "immersive_literary",
  };

  const content = [
    `${other.name} does not own the room the same way ${ctx.povPerson.name} does; the same air reads differently.`,
    assembleSceneOpening(asm),
    assembleBodyTensionFromCtx(ctx, other.name),
    assembleClosingImage(asm),
  ].join("\n\n");

  const scored = scoreCinematicPass({ content, passType: "alternate_pov" });
  return {
    content: content.trim(),
    summary: `Alternate lens: ${other.name}`,
    confidence: scored.overall,
    beats,
  };
}

function assembleBodyTensionFromCtx(ctx: NarrativeConsciousnessContext, witnessName: string): string {
  const rel = ctx.relationships.find(
    (r) => r.otherName.toLowerCase() === witnessName.toLowerCase(),
  );
  if (rel) return `${witnessName} reads the moment through: ${rel.summary.slice(0, 520)}`;
  return `${witnessName} measures what is spoken against what is guarded.`;
}
