import {
  buildNarrativeConsciousnessContext,
  deriveBodilyExperience,
  deriveDelayedMeaning,
  deriveEmotionalUndercurrent,
  derivePovPerceptualField,
  deriveSceneMysteryPressure,
  deriveUnspokenThoughtStream,
} from "@/lib/narrative-consciousness";
import { prisma } from "@/lib/prisma";
import { VisibilityStatus } from "@prisma/client";

function uniqueStrings(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.replace(/\s+/g, " ").trim();
    if (s.length < 12) continue;
    const key = s.slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Immersive, non-academic prompts grounded in consciousness state. */
export async function deriveGuidedPrompts(metaSceneId: string): Promise<string[]> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return [];

  const prompts: string[] = [];

  const perceptual = derivePovPerceptualField(ctx);
  if (perceptual) {
    prompts.push("Notice what the room is doing to them—not only what they do in the room.");
  }

  const under = deriveEmotionalUndercurrent(ctx);
  if (under) {
    prompts.push("This moment may carry more feeling than anyone names aloud.");
  }

  if (ctx.metaFields.symbolicElements?.trim()) {
    prompts.push("The symbol here is not decorative; watch what it does to the body.");
  }

  const mystery = deriveSceneMysteryPressure(ctx);
  if (mystery) {
    prompts.push("Let what is uncertain stay uncertain a little longer.");
  }

  const delayed = deriveDelayedMeaning(ctx);
  if (delayed) {
    prompts.push("Some meanings arrive late—after sound, after light.");
  }

  return uniqueStrings(prompts, 5);
}

export async function deriveDeepReadingPrompts(metaSceneId: string): Promise<string[]> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return [];
  const body = deriveBodilyExperience(ctx);
  const thought = deriveUnspokenThoughtStream(ctx);
  return uniqueStrings(
    [
      body ? "Stay with physical truth before interpretation." : "",
      thought ? "Listen for what is avoided as much as what is said." : "",
      "Return to a single sentence and read it as if it cost something.",
    ],
    4,
  );
}

export async function deriveSymbolAttentionPrompts(metaSceneId: string): Promise<string[]> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return [];
  const sym = ctx.metaFields.symbolicElements?.trim();

  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { id: true, sceneId: true, placeId: true, povPersonId: true },
  });
  const dnaLines: string[] = [];
  if (meta) {
    const or: { targetType: string; targetId: string }[] = [
      { targetType: "meta_scene", targetId: meta.id },
      { targetType: "person", targetId: meta.povPersonId },
      { targetType: "place", targetId: meta.placeId },
    ];
    if (meta.sceneId) or.push({ targetType: "scene", targetId: meta.sceneId });
    const bindings = await prisma.narrativeBinding.findMany({
      where: { OR: or, sourceType: "symbol" },
      take: 24,
      orderBy: { updatedAt: "desc" },
      select: { sourceId: true },
    });
    const ids = [...new Set(bindings.map((b) => b.sourceId))];
    if (ids.length) {
      const symbols = await prisma.symbol.findMany({
        where: { id: { in: ids }, visibility: VisibilityStatus.PUBLIC },
        select: {
          name: true,
          meaningPrimary: true,
          meaning: true,
          emotionalTone: true,
        },
        take: 8,
      });
      for (const s of symbols) {
        const core = (s.meaningPrimary ?? s.meaning ?? "").trim();
        const tone = s.emotionalTone?.trim();
        if (core) {
          dnaLines.push(
            tone
              ? `${s.name} carries ${tone.toLowerCase()} weight here: ${core.slice(0, 160)}${core.length > 160 ? "…" : ""}`
              : `${s.name}: ${core.slice(0, 180)}${core.length > 180 ? "…" : ""}`,
          );
        } else if (s.name) {
          dnaLines.push(`Let ${s.name} earn pressure through gesture and return—not explanation.`);
        }
      }
    }
  }

  const base =
    sym != null && sym.length > 0
      ? [
          "Track how this image changes temperature as the scene moves.",
          "Ask what the symbol protects, not only what it means.",
          sym.length > 40 ? `Hold this motif lightly: ${sym.slice(0, 120)}…` : sym,
        ]
      : ["Watch for images that repeat—repetition is a kind of insistence."];

  return uniqueStrings([...dnaLines, ...base], 6);
}

export async function deriveRelationshipAttentionPrompts(metaSceneId: string): Promise<string[]> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return [];
  if (!ctx.relationships.length) {
    return ["Even solitude here is social—notice who is absent."];
  }
  const r = ctx.relationships[0];
  return uniqueStrings(
    [
      `Between ${ctx.povPerson.name} and ${r.otherName}: watch pull and distance, not roles.`,
      r.tension ? `Tension lives in what is unsaid: ${r.tension.slice(0, 140)}` : "",
      r.emotional ? `Feeling moves like this: ${r.emotional.slice(0, 140)}` : "",
    ],
    4,
  );
}

/** Resolve meta scene id for a published scene when linked. */
export async function resolvePublicMetaSceneIdForScene(sceneId: string): Promise<string | null> {
  const meta = await prisma.metaScene.findFirst({
    where: { sceneId },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return meta?.id ?? null;
}
