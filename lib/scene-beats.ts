import type { NarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SceneBeatRecord = {
  beatType: string;
  orderIndex: number;
  summary: string;
  emotionalCharge: string | null;
  symbolicCharge: string | null;
  pacingHint: string | null;
};

function clip(s: string | null | undefined, max: number): string {
  const t = s?.trim() ?? "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function joinHints(ctx: NarrativeConsciousnessContext): string {
  const parts = [
    ctx.metaFields.emotionalVoltage,
    ctx.metaFields.centralConflict,
    ctx.metaFields.symbolicElements,
  ]
    .map((x) => x?.trim())
    .filter(Boolean) as string[];
  return parts.join(" · ");
}

/** Full ordered beat sequence for a meta scene (derived, not generic screenplay). */
export function deriveSceneBeatSequence(
  ctx: NarrativeConsciousnessContext,
): SceneBeatRecord[] {
  return [
    deriveOpeningBeat(ctx),
    deriveIncitingBeat(ctx),
    derivePressureBeat(ctx),
    deriveRevealBeat(ctx),
    deriveSilenceBeat(ctx),
    deriveExitBeat(ctx),
  ];
}

export function deriveOpeningBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  const place = ctx.place.name;
  const sensory =
    ctx.place.setting?.physicalDescription?.trim() ||
    ctx.metaFields.environmentDescription?.trim() ||
    ctx.metaFields.sensoryField?.trim() ||
    "";
  return {
    beatType: "opening",
    orderIndex: 0,
    summary: `Arrival into ${place}: what the body notices first—${clip(sensory, 220) || "air, light, the weight of the room."}`,
    emotionalCharge: clip(ctx.metaFields.emotionalVoltage, 160),
    symbolicCharge: clip(ctx.metaFields.symbolicElements, 160),
    pacingHint: "slow_inhale; wide lens then narrow",
  };
}

export function deriveIncitingBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  const purpose = ctx.metaFields.narrativePurpose?.trim() || "the scene’s unspoken question";
  return {
    beatType: "inciting",
    orderIndex: 1,
    summary: `The moment tilts: ${clip(purpose, 240)}.`,
    emotionalCharge: clip(ctx.metaFields.centralConflict, 180),
    symbolicCharge: null,
    pacingHint: "shorten sentences; attention sharpens",
  };
}

export function derivePressureBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  const rel = ctx.relationships[0];
  const relLine = rel
    ? `${rel.otherName}: ${clip(rel.summary, 200)}`
    : clip(ctx.metaFields.socialConstraints, 220) || "social gravity presses without naming itself.";
  return {
    beatType: "pressure",
    orderIndex: 2,
    summary: relLine,
    emotionalCharge: rel?.emotional ?? clip(ctx.metaFields.characterStatesSummary, 160),
    symbolicCharge: null,
    pacingHint: "dialogue_distance; withheld_explanation",
  };
}

export function deriveRevealBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  const pass = ctx.narrativePasses.find((p) =>
    ["symbolic", "relationship_pressure", "interior"].includes(p.passType),
  );
  const inner = ctx.povPerson.profile?.internalConflicts?.trim();
  return {
    beatType: "reveal",
    orderIndex: 3,
    summary: pass
      ? `What surfaces through ${pass.passType.replace(/_/g, " ")} pressure—not as moral, as cost.`
      : inner
        ? `Interior fault line: ${clip(inner, 200)}`
        : "Something known and unspoken finally gains texture.",
    emotionalCharge: clip(ctx.povPerson.profile?.coreFear, 120),
    symbolicCharge: clip(ctx.metaFields.symbolicElements, 160),
    pacingHint: "one_image_carries_weight",
  };
}

export function deriveSilenceBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  return {
    beatType: "silence",
    orderIndex: 4,
    summary:
      "A beat held: what is not said re-shapes what was. The reader feels the gap as presence, not absence.",
    emotionalCharge: clip(ctx.metaFields.emotionalVoltage, 120),
    symbolicCharge: null,
    pacingHint: "white_space; single_sentence_paragraph",
  };
}

export function deriveExitBeat(ctx: NarrativeConsciousnessContext): SceneBeatRecord {
  const carry = ctx.metaFields.narrativePurpose?.trim() || joinHints(ctx);
  return {
    beatType: "exit",
    orderIndex: 5,
    summary: `Handoff: ${clip(carry, 260) || "the scene releases the reader into consequence, not conclusion."}`,
    emotionalCharge: clip(ctx.povPerson.profile?.coreLonging, 140),
    symbolicCharge: clip(ctx.metaFields.symbolicElements, 120),
    pacingHint: "closing_image; softer_syntax",
  };
}

/** Bridge beat using the next public scene in the same chapter when available. */
export async function deriveBridgeToNextScene(
  metaSceneId: string,
): Promise<SceneBeatRecord | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
    publicOnly: true,
  });
  if (!ctx) return null;

  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { sceneId: true },
  });
  if (!meta?.sceneId) {
    return {
      beatType: "bridge",
      orderIndex: 6,
      summary: "The thread does not break—it opens toward what follows.",
      emotionalCharge: clip(ctx.metaFields.emotionalVoltage, 100),
      symbolicCharge: null,
      pacingHint: "single_line_bridge",
    };
  }

  const scene = await prisma.scene.findUnique({
    where: { id: meta.sceneId },
    select: {
      id: true,
      summary: true,
      description: true,
      orderInChapter: true,
      sceneNumber: true,
      chapterId: true,
    },
  });
  if (!scene) {
    return {
      beatType: "bridge",
      orderIndex: 6,
      summary: "The thread does not break—it opens toward what follows.",
      emotionalCharge: clip(ctx.metaFields.emotionalVoltage, 100),
      symbolicCharge: null,
      pacingHint: "single_line_bridge",
    };
  }

  const siblings = await prisma.scene.findMany({
    where: { chapterId: scene.chapterId, visibility: VisibilityStatus.PUBLIC },
    orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
    select: { id: true, summary: true, description: true },
  });
  const idx = siblings.findIndex((s) => s.id === scene.id);
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const hint =
    next?.summary?.trim() ||
    next?.description?.trim()?.slice(0, 72) ||
    "the next passage";

  return {
    beatType: "bridge",
    orderIndex: 6,
    summary: `The thread does not break—it opens toward ${hint}.`,
    emotionalCharge: clip(ctx.metaFields.emotionalVoltage, 100),
    symbolicCharge: null,
    pacingHint: "single_line_bridge",
  };
}
