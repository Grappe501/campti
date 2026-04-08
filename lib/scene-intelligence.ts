import type { Fragment, MetaScene } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { suggestClustersForMetaScene, type ClusterProposal } from "@/lib/fragment-clustering";
import {
  deriveAlternatePlacements,
  deriveEmotionalUse,
  deriveHiddenMeaning,
  deriveNarrativeUse,
  deriveSceneReadinessScore,
  deriveSurfaceMeaning,
  deriveSymbolicUse,
  type FragmentLike,
} from "@/lib/fragment-interpretation";
import {
  doesCharacterInterpretEnvironment,
  doesEnvironmentActOnCharacter,
  doesSceneFeelStatic,
  doesSymbolismExistButNotInteract,
} from "@/lib/world-dynamics";

export type SceneIntelligenceReport = {
  strengths: string[];
  missingElements: string[];
  flatness: string[];
  tensionArc: string[];
  symbolicCoverage: string;
  povStrength: string;
  environmentLiveliness: string;
  groundingQuality: string;
  fragmentSupport: string;
  continuityPressure: string;
  sceneMovement: string;
  candidateUnlinkedFragments: { id: string; title: string | null; reason: string }[];
  clusterSuggestions: ClusterProposal[];
};

function scoreTextPresence(s: string | null | undefined): number {
  const t = (s ?? "").trim();
  if (!t.length) return 0;
  return Math.min(5, Math.ceil(t.length / 120));
}

export async function evaluateMetaScene(metaSceneId: string): Promise<SceneIntelligenceReport | null> {
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    include: {
      place: { include: { settingProfile: true } },
      povPerson: { include: { characterProfile: true } },
      scene: true,
    },
  });
  if (!meta) return null;

  const links = await prisma.fragmentLink.findMany({
    where: { linkedType: "meta_scene", linkedId: metaSceneId },
    include: { fragment: true },
  });
  const linkedFragments = links.map((l) => l.fragment);
  const base = buildReport(meta, linkedFragments);

  const [clusterSuggestions, candidateUnlinkedFragments] = await Promise.all([
    suggestClustersForMetaScene(metaSceneId).catch(() => [] as ClusterProposal[]),
    suggestFragmentsForMetaScene(metaSceneId),
  ]);

  return { ...base, clusterSuggestions, candidateUnlinkedFragments };
}

function buildReport(
  meta: MetaScene & {
    place: { name: string; settingProfile: unknown | null };
    povPerson: { name: string; characterProfile: unknown | null };
  },
  linkedFragments: Fragment[],
): Omit<SceneIntelligenceReport, "clusterSuggestions" | "candidateUnlinkedFragments"> {
  const strengths: string[] = [];
  const missing: string[] = [];
  const flatness: string[] = [];

  if (meta.povPerson.characterProfile) strengths.push("POV has a character mind model — interpretation has somewhere to land.");
  else
    missing.push(
      "The POV is physically present but not yet psychologically organizing the scene. Without a character mind model, the world may stay visible without being filtered through fear, habit, or bias.",
    );

  if (meta.place.settingProfile) strengths.push("Place has a setting profile — sensory and social systems can press on bodies.");
  else
    missing.push(
      "The place is named but not yet lived in on the page — risk of generic geography unless you ground texture, rule, and weather.",
    );

  if ((meta.sensoryField ?? "").trim().length > 40) strengths.push("Sensory field is present — embodiment has hooks.");
  else
    missing.push(
      "Sensory field is thin — readers may get information without sensation; the scene can feel reported rather than inhabited.",
    );

  if ((meta.centralConflict ?? "").trim().length > 20) strengths.push("Central conflict is named — stakes have a handle.");
  else missing.push("Central conflict is missing or unclear — tension may read as mood rather than dilemma.");

  if ((meta.symbolicElements ?? "").trim().length > 20) strengths.push("Symbolic layer is noted — motif can echo.");
  else
    missing.push(
      "Symbolic layer is empty — the scene may run on plot and décor alone, without images that return or deepen meaning.",
    );

  if ((meta.emotionalVoltage ?? "").trim().length > 10) strengths.push("Emotional voltage is labeled — intensity can be calibrated.");
  else
    missing.push(
      "No emotional voltage label — readers lack a shared dial for how hot, numb, or brittle the moment should feel.",
    );

  if (linkedFragments.length >= 3) strengths.push("Several fragments linked — archive texture can argue with itself.");
  if (linkedFragments.length === 0)
    missing.push(
      "No fragments linked — the scene may float without sourced friction; consider anchoring at least one beat to archive material.",
    );

  if (doesSceneFeelStatic(meta)) {
    flatness.push(
      "The room is richly described but the dramatic pressure is quiet — risk of still life: beauty without consequence.",
    );
  }
  if (!doesEnvironmentActOnCharacter(meta) && (meta.environmentDescription ?? "").trim().length > 80) {
    flatness.push(
      "Environment reads as backdrop: detail without cost. Let heat, rule, or terrain force choices, delay, or shame.",
    );
  }
  if (!doesCharacterInterpretEnvironment(meta) && (meta.characterStatesSummary ?? "").trim().length > 40) {
    flatness.push(
      "Character state exists, but meaning-making is thin — the POV may not be translating place into threat, memory, or desire.",
    );
  }
  if (doesSymbolismExistButNotInteract(meta)) {
    flatness.push(
      "Symbols are named but not in play — nothing in the image is doing work against the conflict yet.",
    );
  }

  const tensionArc: string[] = [];
  if ((meta.historicalConstraints ?? "").trim().length) {
    tensionArc.push("Historical constraints can tighten allowable actions.");
  }
  if ((meta.socialConstraints ?? "").trim().length) {
    tensionArc.push("Social constraints can force face, silence, or risk.");
  }
  if (tensionArc.length === 0) {
    tensionArc.push("Add constraints to shape beat-by-beat pressure.");
  }

  const symbolicCoverage =
    scoreTextPresence(meta.symbolicElements) >= 3
      ? "Strong — symbolic notes are substantial enough to echo and return."
      : scoreTextPresence(meta.symbolicElements) === 0
        ? "The scene carries physical detail and emotional tension, but its symbolic life has not yet attached itself to the POV. Nothing in the room is acting as a vessel for fear, memory, or longing."
        : "Moderate — deepen or repeat symbols in action so they accumulate pressure rather than decorate.";

  const povStrength =
    meta.povPerson.characterProfile && (meta.characterStatesSummary ?? "").trim().length > 20
      ? "Strong — profile plus scene-specific state give the camera a psychology, not just an eye."
      : meta.povPerson.characterProfile
        ? "Moderate — interior scaffolding exists; push how this place rewrites the POV’s body and attention in this beat."
        : "Weak — the POV may see without organizing: add mind-model bias so interpretation competes with fact.";

  const envLive =
    doesEnvironmentActOnCharacter(meta) && doesCharacterInterpretEnvironment(meta)
      ? "High — world and psyche are in dialogue: place costs something, and the POV names the cost."
      : (meta.environmentDescription ?? "").trim().length > 60
        ? "Moderate — setting is present; convert description into force (fatigue, risk, taboo) that alters behavior."
        : "Low — ground consequence: what hurts, what is forbidden, what is tempting, here and now.";

  const grounding =
    (meta.sourceSupportLevel ?? "").trim() === "strong"
      ? "Strong declared source support — keep excerpts and claims visible to the author."
      : (meta.sourceSupportLevel ?? "").trim() === "moderate"
        ? "Moderate — inference is allowed but should wear its seams; fragment links are your honesty layer."
        : "Unset or weak — mark speculative beats explicitly so craft choices stay honest.";

  const fragSupport =
    linkedFragments.length === 0
      ? "No fragments — the scene may be pure invention unless you anchor beats to archive texture."
      : linkedFragments.length < 3
        ? "Light archive support — consider contrasting or memory fragments so the scene can argue with itself."
        : "Solid fragment count — you can layer motif, fact, and counter-fact without flattening.";

  const continuity =
    (meta.continuityDependencies ?? "").trim().length > 20
      ? "Continuity dependencies recorded — watch for knock-on effects in later chapters."
      : "Continuity dependencies thin — name what must remain true after the door closes.";

  const movement =
    (meta.narrativePurpose ?? "").trim().length > 30 && (meta.centralConflict ?? "").trim().length > 20
      ? "Purpose and conflict align — the beat knows what it is trying to move."
      : "Clarify what shifts by the final line: knowledge, risk, tenderness, shame, or silence.";

  return {
    strengths,
    missingElements: missing,
    flatness,
    tensionArc,
    symbolicCoverage,
    povStrength,
    environmentLiveliness: envLive,
    groundingQuality: grounding,
    fragmentSupport: fragSupport,
    continuityPressure: continuity,
    sceneMovement: movement,
  };
}

export async function deriveSceneMissingElements(metaSceneId: string): Promise<string[]> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.missingElements ?? [];
}

export async function deriveSceneStrengths(metaSceneId: string): Promise<string[]> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.strengths ?? [];
}

export async function deriveSceneFlatness(metaSceneId: string): Promise<string[]> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.flatness ?? [];
}

export async function deriveSceneTensionArc(metaSceneId: string): Promise<string[]> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.tensionArc ?? [];
}

export async function deriveSceneSymbolicCoverage(metaSceneId: string): Promise<string> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.symbolicCoverage ?? "—";
}

export async function deriveScenePovStrength(metaSceneId: string): Promise<string> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.povStrength ?? "—";
}

export async function deriveSceneEnvironmentLiveliness(metaSceneId: string): Promise<string> {
  const r = await evaluateMetaScene(metaSceneId);
  return r?.environmentLiveliness ?? "—";
}

export async function suggestFragmentsForMetaScene(metaSceneId: string): Promise<
  { id: string; title: string | null; reason: string }[]
> {
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    include: { povPerson: true, place: true },
  });
  if (!meta) return [];

  const linked = await prisma.fragmentLink.findMany({
    where: { linkedType: "meta_scene", linkedId: metaSceneId },
    select: { fragmentId: true },
  });
  const linkedSet = new Set(linked.map((l) => l.fragmentId));

  const povName = meta.povPerson.name;
  const placeName = meta.place.name;

  const candidates = await prisma.fragment.findMany({
    where: {
      AND: [
        { id: { notIn: [...linkedSet] } },
        {
          OR: [
            { text: { contains: povName.slice(0, 12), mode: "insensitive" } },
            { text: { contains: placeName.slice(0, 16), mode: "insensitive" } },
            { text: { contains: "smoke", mode: "insensitive" } },
            { text: { contains: "river", mode: "insensitive" } },
          ],
        },
      ],
    },
    take: 12,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, text: true },
  });

  return candidates.map((f) => {
    const reason =
      f.text.toLowerCase().includes(placeName.toLowerCase().slice(0, 8))
        ? "Mentions place — may ground without being linked yet."
        : f.text.toLowerCase().includes(povName.toLowerCase().slice(0, 6))
          ? "Touches POV name — check relevance."
          : "Thematic/sensory overlap with anchor scene.";
    return { id: f.id, title: f.title, reason };
  });
}

export type ConstructionSuggestionDraft = {
  title: string;
  suggestionType: string;
  summary: string;
  confidence: number;
  supportingFragmentIds: string[];
};

export async function suggestSceneConstruction(metaSceneId: string): Promise<ConstructionSuggestionDraft[]> {
  const report = await evaluateMetaScene(metaSceneId);
  if (!report) return [];

  const drafts: ConstructionSuggestionDraft[] = [];

  for (const m of report.missingElements) {
    drafts.push({
      title: m.slice(0, 80),
      suggestionType: "missing_element",
      summary: m,
      confidence: 3,
      supportingFragmentIds: [],
    });
  }
  for (const f of report.flatness.slice(0, 4)) {
    drafts.push({
      title: "Flatness",
      suggestionType: "tension_arc",
      summary: f,
      confidence: 3,
      supportingFragmentIds: [],
    });
  }
  if (report.symbolicCoverage.includes("has not yet attached")) {
    drafts.push({
      title: "Attach symbolic life to POV",
      suggestionType: "symbolic_layer",
      summary: report.symbolicCoverage,
      confidence: 4,
      supportingFragmentIds: [],
    });
  }
  if (report.povStrength.startsWith("Weak")) {
    drafts.push({
      title: "Deepen POV interpretation",
      suggestionType: "pov_strengthening",
      summary: report.povStrength,
      confidence: 4,
      supportingFragmentIds: [],
    });
  }

  const unlinked = report.candidateUnlinkedFragments;
  if (unlinked.length) {
    drafts.push({
      title: "Link candidate fragments",
      suggestionType: "fragment_group",
      summary: `Not yet linked: ${unlinked.length} fragment(s) may strengthen the scene.`,
      confidence: 3,
      supportingFragmentIds: unlinked.slice(0, 6).map((u) => u.id),
    });
  }

  return drafts.slice(0, 12);
}

export async function persistSceneConstructionSuggestions(metaSceneId: string): Promise<{ created: number }> {
  const drafts = await suggestSceneConstruction(metaSceneId);
  if (!drafts.length) return { created: 0 };

  await prisma.sceneConstructionSuggestion.deleteMany({
    where: { metaSceneId, status: "suggested" },
  });

  for (const d of drafts) {
    await prisma.sceneConstructionSuggestion.create({
      data: {
        metaSceneId,
        title: d.title,
        suggestionType: d.suggestionType,
        summary: d.summary,
        confidence: d.confidence,
        status: "suggested",
        supportingFragmentIds: d.supportingFragmentIds.length ? d.supportingFragmentIds : undefined,
      },
    });
  }
  return { created: drafts.length };
}

export function fragmentInterpretationPreview(f: FragmentLike): {
  surface: string;
  hidden: string;
  emotionalUse: string;
  symbolicUse: string;
  narrativeUse: string;
  readiness: number;
  alternates: ReturnType<typeof deriveAlternatePlacements>;
} {
  return {
    surface: deriveSurfaceMeaning(f),
    hidden: deriveHiddenMeaning(f),
    emotionalUse: deriveEmotionalUse(f),
    symbolicUse: deriveSymbolicUse(f),
    narrativeUse: deriveNarrativeUse(f),
    readiness: deriveSceneReadinessScore(f),
    alternates: deriveAlternatePlacements(f),
  };
}
