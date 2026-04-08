import { prisma } from "@/lib/prisma";
import { composeStructuredScenePass } from "@/lib/scene-composition";
import {
  describeConstraintPressureRichly,
  describeEnvironmentRichly,
  describeRelationshipPressureRichly,
  describeSymbolicLifeRichly,
  describePerspectiveRichly,
} from "@/lib/descriptive-synthesis";
import { DEFAULT_SUGGESTION_STYLE, DEFAULT_WORLD_PREVIEW_STYLE } from "@/lib/narrative-style";

export type StructuredNarrativePass = {
  openingPerception: string;
  bodilyFeeling: string;
  emotionalUndercurrent: string;
  environmentalPressure: string;
  relationshipPressure: string;
  symbolicActivation: string;
  unspokenCurrent: string;
  likelyEscalation: string;
};

export type FullStructuredNarrative = StructuredNarrativePass & {
  metaSceneId: string;
  povPersonName: string | null;
  placeName: string | null;
  sourceSupport: string | null;
};

async function basePass(metaSceneId: string): Promise<{
  structured: NonNullable<Awaited<ReturnType<typeof composeStructuredScenePass>>>;
  meta: { title: string };
} | null> {
  const structured = await composeStructuredScenePass(metaSceneId);
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { title: true, povPerson: { select: { name: true } }, place: { select: { name: true } }, sourceSupportLevel: true },
  });
  if (!structured || !meta) return null;
  return { structured, meta };
}

export async function generateSceneOpeningPass(metaSceneId: string): Promise<string | null> {
  const b = await basePass(metaSceneId);
  if (!b) return null;
  return [
    "## Opening perception",
    b.structured.openingPerception,
    "",
    "## Bodily feeling",
    b.structured.bodilyFeeling,
  ].join("\n");
}

export async function generateSceneInteriorPass(metaSceneId: string): Promise<string | null> {
  const b = await basePass(metaSceneId);
  if (!b) return null;
  return ["## Emotional undercurrent", b.structured.dominantEmotion, "", "## Hidden pressure", b.structured.hiddenEmotion].join("\n");
}

export async function generateSceneEnvironmentPass(metaSceneId: string): Promise<string | null> {
  const text = await describeEnvironmentRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  return ["## Environmental pressure", text].join("\n\n");
}

export async function generateSceneRelationshipPressurePass(metaSceneId: string): Promise<string | null> {
  const text = await describeRelationshipPressureRichly(metaSceneId, DEFAULT_SUGGESTION_STYLE);
  return ["## Relationship pressure", text].join("\n\n");
}

export async function generateSceneSymbolicPass(metaSceneId: string): Promise<string | null> {
  const text = await describeSymbolicLifeRichly(metaSceneId, DEFAULT_SUGGESTION_STYLE);
  return ["## Symbolic activation", text].join("\n\n");
}

export async function generateSceneEmbodiedPass(metaSceneId: string): Promise<string | null> {
  const text = await describePerspectiveRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  return ["## Embodied perspective", text].join("\n\n");
}

export async function generateFullStructuredNarrativePass(metaSceneId: string): Promise<FullStructuredNarrative | null> {
  const structured = await composeStructuredScenePass(metaSceneId);
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: {
      title: true,
      povPerson: { select: { name: true } },
      place: { select: { name: true } },
      sourceSupportLevel: true,
      narrativePurpose: true,
      centralConflict: true,
    },
  });
  if (!structured || !meta) return null;

  const [env, rel, sym, cons] = await Promise.all([
    describeEnvironmentRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE),
    describeRelationshipPressureRichly(metaSceneId, DEFAULT_SUGGESTION_STYLE),
    describeSymbolicLifeRichly(metaSceneId, DEFAULT_SUGGESTION_STYLE),
    describeConstraintPressureRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE),
  ]);

  return {
    metaSceneId,
    povPersonName: meta.povPerson?.name ?? null,
    placeName: meta.place?.name ?? null,
    sourceSupport: meta.sourceSupportLevel?.trim() ?? null,
    openingPerception: structured.openingPerception,
    bodilyFeeling: structured.bodilyFeeling,
    emotionalUndercurrent: [structured.dominantEmotion, structured.hiddenEmotion].filter(Boolean).join(" · "),
    environmentalPressure: [env, cons].filter(Boolean).join("\n\n"),
    relationshipPressure: rel,
    symbolicActivation: [sym, structured.narrativeCoherenceNotes?.trim()].filter(Boolean).join("\n\n— Narrative bindings —\n\n"),
    unspokenCurrent: structured.misinterpretation,
    likelyEscalation: [structured.tensionEscalation, structured.emotionalBeatProgression].filter(Boolean).join(" → "),
  };
}

/** Serialize full structured pass to stored markdown-like blocks (not final novel prose). */
export function formatFullStructuredNarrativePass(n: FullStructuredNarrative): string {
  return [
    `# Structured scene pass`,
    `Title: ${n.metaSceneId} · POV: ${n.povPersonName ?? "—"} · Place: ${n.placeName ?? "—"}`,
    n.sourceSupport ? `Source support (declared): ${n.sourceSupport}` : null,
    "",
    "## Opening Perception",
    n.openingPerception,
    "",
    "## Bodily Feeling",
    n.bodilyFeeling,
    "",
    "## Emotional Undercurrent",
    n.emotionalUndercurrent,
    "",
    "## Environmental Pressure",
    n.environmentalPressure,
    "",
    "## Relationship Pressure",
    n.relationshipPressure,
    "",
    "## Symbolic Activation",
    n.symbolicActivation,
    "",
    "## Unspoken Current",
    n.unspokenCurrent,
    "",
    "## Likely Escalation",
    n.likelyEscalation,
  ]
    .filter(Boolean)
    .join("\n");
}
