import type { EnneagramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMetaSceneContext } from "@/lib/perspective-engine";
import {
  buildEmbodiedPerspectiveContext,
  deriveWhatFeelsSafeOrThreatening,
  deriveWhatThisCharacterMisses,
  deriveWhatThisCharacterNeedsButCannotName,
  deriveWhatThisCharacterNoticesFirst,
  deriveWhatTriggersMemory,
  generatePerspectiveNarrative,
  summarizeEmbodiedPerspective,
} from "@/lib/perspective-engine";
import { getMetaSceneComposerData } from "@/lib/meta-scene-composer";
import { deriveHeartDeficits } from "@/lib/scene-heart";
import { buildSceneSoulContext } from "@/lib/scene-composition";
import {
  buildRelationshipContext,
  deriveEnneagramRelationshipDynamic,
  deriveLikelyConflictLoop,
  deriveLikelyRepairPath,
} from "@/lib/relationship-dynamics";
import { fragmentInterpretationPreview } from "@/lib/scene-intelligence";
import type { FragmentLike } from "@/lib/fragment-interpretation";
import { DEFAULT_SUGGESTION_STYLE, DEFAULT_WORLD_PREVIEW_STYLE, NARRATIVE_STYLE_PRESETS } from "@/lib/narrative-style";
import type { NarrativeStylePreset } from "@/lib/descriptive-validation";

function styleHint(preset: NarrativeStylePreset): string {
  return NARRATIVE_STYLE_PRESETS[preset]?.guidance ?? "";
}

/** Integrated environment prose (not a list of labels). */
export async function describeEnvironmentRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return "Meta scene not found.";
  const m = data.world.metaScene;
  const sp = data.world.settingProfile;
  const placeName = m.place?.name ?? "this place";
  const sensoryBlob = [m.sensoryField, m.environmentDescription].filter(Boolean).join("\n\n");
  const stateNotes = data.settingStates
    .slice(0, 2)
    .map((s) => [s.season, s.weather, s.notableConditions].filter(Boolean).join(" — "))
    .filter(Boolean);

  const integrated =
    sp?.physicalDescription?.trim() ||
    sensoryBlob.trim() ||
    [sp?.sounds, sp?.smells, sp?.textures, sp?.lightingConditions].filter(Boolean).join("; ");

  if (!integrated?.trim()) {
    return `${styleHint(style)} This place is not yet written into the body: no sustained physical or sensory field anchors the POV. The scene may read like a map label (“${placeName}”) rather than a lived room, trail, or weather system pressing on skin and breath.`;
  }

  const socialWeather = [sp?.socialRules, sp?.classDynamics, sp?.religiousPresence].filter(Boolean).join(" · ");

  return [
    `In story terms, ${placeName} reads as ${sp?.environmentType?.trim() ? `a ${sp.environmentType.trim()} environment` : "a situated place"}, not a neutral backdrop.`,
    integrated.slice(0, 1200),
    stateNotes.length ? `Conditions in view: ${stateNotes.join(" · ")}` : null,
    socialWeather ? `Human systems in play: ${socialWeather.slice(0, 600)}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function describeCharacterStateRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return "Meta scene not found.";
  const emb = await buildEmbodiedPerspectiveContext(
    data.world.metaScene.povPersonId,
    data.world.metaScene.placeId,
    data.world.metaScene.timePeriod,
    metaSceneId,
  );
  const sum = summarizeEmbodiedPerspective(emb);
  const povName = data.world.metaScene.povPerson?.name ?? "the POV";

  return [
    `${povName} arrives with ${sum.emotionalSalience !== "—" ? `an emotional baseline that reads as: ${sum.emotionalSalience}` : "no recorded emotional baseline — interior weather may feel unspecified"}.`,
    `Threat/care calibration (from authored + type law): ${sum.threatPerception || "—"}.`,
    `Memory pressure: ${sum.memoryActivation}.`,
    `What stays unspoken but active: ${deriveWhatThisCharacterNeedsButCannotName(emb)}`,
    styleHint(style),
  ].join("\n\n");
}

export async function describeRelationshipPressureRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "Meta scene not found.";
  const m = ctx.metaScene;
  const lines: string[] = [];
  if (ctx.relationshipNotes.length) {
    lines.push(`Dyad law (where types exist): ${ctx.relationshipNotes.join(" ")}`);
  }
  if (m.centralConflict?.trim()) {
    lines.push(`Named interpersonal stake: ${m.centralConflict.trim().slice(0, 800)}`);
  }
  if (m.characterStatesSummary?.trim()) {
    lines.push(`Ensemble posture: ${m.characterStatesSummary.trim().slice(0, 800)}`);
  }
  if (!lines.length) {
    return `${styleHint(style)} Relationship pressure is still implicit. The scene may have bodies in frame without a felt social physics — who owes whom silence, warmth, honesty, or performance remains unpriced.`;
  }
  return lines.join("\n\n");
}

export async function describeConstraintPressureRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const world = await buildMetaSceneContext(metaSceneId);
  if (!world) return "Meta scene not found.";
  const m = world.metaScene;
  const hist = m.historicalConstraints?.trim();
  const soc = m.socialConstraints?.trim();
  const sup = m.sourceSupportLevel?.trim();
  if (!hist && !soc) {
    return `${styleHint(style)} Constraints are not yet articulated. Without historical and social pressure, characters may move as if the past and the crowd do not limit them — which can flatten moral consequence.`;
  }
  return [
    hist ? `Historical pressure (authored): ${hist}` : null,
    soc ? `Social pressure (authored): ${soc}` : null,
    sup ? `Source posture (declared): ${sup} — keep speculation tagged honestly.` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function describeSymbolicLifeRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return "Meta scene not found.";
  const m = data.world.metaScene;
  const symAuthor = m.symbolicElements?.trim();
  const symScene = data.sceneSymbols.map((s) => s.name).join(", ");
  const fragSym = data.symbolicFragmentLinks.length;

  if (!symAuthor && !symScene && !fragSym) {
    return `The scene carries physical detail and emotional tension, but its symbolic life has not yet attached itself to the POV. Nothing in the room is yet acting as a vessel for fear, memory, or longing — or the author has not named that linkage. ${styleHint(style)}`;
  }

  return [
    symAuthor ? `Author-named symbols: ${symAuthor}` : null,
    symScene ? `Symbols on linked draft scene: ${symScene}` : null,
    fragSym ? `${fragSym} linked fragment(s) carry symbolic or motif roles — check whether they collide with POV interior.` : null,
    m.narrativePurpose?.trim() ? `Narrative purpose (why symbols might matter): ${m.narrativePurpose.trim().slice(0, 500)}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export type RichWorldStatePreview = {
  povSummary: string;
  environmentSummary: string;
  emotionalContext: string;
  constraintsSummary: string;
  symbolicSummary: string;
  styleNote: string;
};

export async function describeWorldStateRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<RichWorldStatePreview | null> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return null;
  const m = data.world.metaScene;
  const povName = m.povPerson?.name ?? "the POV";
  const placeName = m.place?.name ?? "this place";

  const povSummary = [
    `Point of view: ${povName}.`,
    data.profile?.worldview?.trim()
      ? `How they tend to read reality: ${data.profile.worldview.trim().slice(0, 900)}`
      : "Worldview is not recorded — the POV may feel visible but not yet psychologically organized.",
    data.relevantMemories.length
      ? `Memory weather (surfaced for this window): ${data.relevantMemories
          .map((mem) => `(${mem.reliability ?? "unset reliability"}) ${mem.description.slice(0, 200)}`)
          .join(" · ")}`
      : "Few or no memories matched this time window — longing, dread, and habit may lack a sourced echo.",
    styleHint(style),
  ].join("\n\n");

  const environmentSummary = await describeEnvironmentRichly(metaSceneId, style);

  const emotionalContext = [
    await describeCharacterStateRichly(metaSceneId, style),
    m.emotionalVoltage?.trim() ? `Declared voltage: ${m.emotionalVoltage.trim()}` : null,
    m.centralConflict?.trim() ? `Named conflict: ${m.centralConflict.trim().slice(0, 600)}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const constraintsSummary = await describeConstraintPressureRichly(metaSceneId, style);
  const symbolicSummary = await describeSymbolicLifeRichly(metaSceneId, style);

  return {
    povSummary,
    environmentSummary,
    emotionalContext,
    constraintsSummary,
    symbolicSummary,
    styleNote: NARRATIVE_STYLE_PRESETS[style]?.label ?? style,
  };
}

export async function describePerspectiveRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const world = await buildMetaSceneContext(metaSceneId);
  if (!world) return "Meta scene not found.";
  const emb = await buildEmbodiedPerspectiveContext(
    world.metaScene.povPersonId,
    world.metaScene.placeId,
    world.metaScene.timePeriod,
    metaSceneId,
  );
  const stub = await generatePerspectiveNarrative({
    personId: world.metaScene.povPersonId,
    placeId: world.metaScene.placeId,
    timePeriod: world.metaScene.timePeriod,
    sceneId: world.metaScene.sceneId,
    metaSceneId,
  });

  return [
    `First attention (embodied law): ${deriveWhatThisCharacterNoticesFirst(emb)}`,
    `Felt weather: ${stub.felt}`,
    `Cognitive frame: ${stub.thought}`,
    `Fear underside: ${stub.feared}`,
    `Affordances / desire line: ${stub.possible}`,
    `Blind spot / what is easy to misread: ${deriveWhatThisCharacterMisses(emb)}`,
    `Memory surfacing: ${deriveWhatTriggersMemory(emb)}`,
    `What is not yet named aloud: ${deriveWhatThisCharacterNeedsButCannotName(emb)}`,
    `Body-level pressure (environment + memory): ${deriveWhatFeelsSafeOrThreatening(emb)}`,
    styleHint(style),
  ].join("\n\n");
}

/** POV interpretive habits: danger, intimacy, obligation, change, silence, disruption. */
export async function describePovInterpretiveAxes(metaSceneId: string): Promise<string> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return "Meta scene not found.";
  const p = data.profile;
  if (!p) {
    return "Without a character profile, the POV’s habits of interpretation stay implicit — the scene may read as observed rather than filtered.";
  }
  return [
    `Danger: ${p.fears?.trim() ? `named fear patterns: ${p.fears.trim().slice(0, 400)}` : "fear field not authored — threat may read generic."}`,
    `Intimacy / attachment: ${p.relationalStyle?.trim() || p.attachmentPattern?.trim() || "relational style not specified"}.`,
    `Obligation / duty: ${p.moralFramework?.trim() || p.coreBeliefs?.trim() || "moral framework thin"}.`,
    `Change: ${p.internalConflicts?.trim() ? `internal conflict around change: ${p.internalConflicts.trim().slice(0, 400)}` : "—"}.`,
    `Silence: ${p.speechPatterns?.trim() ? `speech habits: ${p.speechPatterns.trim().slice(0, 300)}` : "how silence functions is not yet written."}`,
    `Disruption: ${p.stressPattern?.trim() || p.defensiveStyle?.trim() || "stress/defense not specified"}.`,
  ].join("\n\n");
}

export async function describeSceneSoulRichly(metaSceneId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const soul = await prisma.sceneSoulSuggestion.findMany({
    where: { metaSceneId },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });
  const heart = await deriveHeartDeficits(metaSceneId);
  const lines: string[] = [];
  if (soul.length) {
    lines.push(
      soul
        .map((s) => `• ${s.title}: ${s.summary.slice(0, 420)}${s.summary.length > 420 ? "…" : ""}`)
        .join("\n"),
    );
  } else {
    lines.push("No soul suggestions stored yet — generate or author interior beats explicitly.");
  }
  if (heart.deficits.length) {
    lines.push(`Heart heuristic (not a verdict): ${heart.deficits.map((d) => `(${d})`).join(" ")}`);
  }
  lines.push(styleHint(style));
  return lines.join("\n\n");
}

export async function describeFragmentRichly(fragmentId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const f = await prisma.fragment.findUnique({ where: { id: fragmentId } });
  if (!f) return "Fragment not found.";
  const prev = fragmentInterpretationPreview(f as FragmentLike);
  return [
    `Surface: ${prev.surface}`,
    `Underneath: ${prev.hidden}`,
    `Emotional weather: ${prev.emotionalUse}`,
    `How it might function in scene: ${prev.narrativeUse}`,
    `Symbolic pressure: ${prev.symbolicUse}`,
    `Readiness (heuristic score): ${prev.readiness}`,
    styleHint(style),
  ].join("\n\n");
}

export async function describeClusterRichly(clusterId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const c = await prisma.fragmentCluster.findUnique({
    where: { id: clusterId },
    include: {
      fragmentLinks: {
        include: {
          fragment: { select: { id: true, title: true, fragmentType: true, summary: true, emotionalTone: true } },
        },
      },
    },
  });
  if (!c) return "Cluster not found.";
  const titles = c.fragmentLinks.map((l) => l.fragment.title ?? l.fragment.id.slice(0, 8)).join(", ");
  const tones = c.fragmentLinks.map((l) => l.fragment.emotionalTone).filter(Boolean).join(" · ");
  return [
    c.summary?.trim() ? `Author summary: ${c.summary.trim()}` : "No cluster summary — treat this as a provisional constellation.",
    `Unifying spine (${c.clusterType}): ${c.title}.`,
    fragmentsNarrativeCurrent(c),
    titles ? `Fragments in orbit: ${titles}.` : "Empty cluster.",
    tones ? `Emotional weather across members: ${tones}.` : null,
    styleHint(style),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function fragmentsNarrativeCurrent(c: { dominantFunction: string | null; emotionalTone: string | null }): string {
  const parts = [c.dominantFunction, c.emotionalTone].filter(Boolean).join(" · ");
  return parts
    ? `Narrative current (declared): ${parts}`
    : "Narrative current is implicit — name what kind of pressure these fragments stack (memory, motif, argument with the past).";
}

export type ComposerSynthesisBundle = {
  sceneCore: string;
  characterContext: string;
  environmentContext: string;
  constraints: string;
  emotionalConflict: string;
  symbolicLayer: string;
  fragmentIntegration: string;
};

export async function buildComposerSynthesisBundle(metaSceneId: string): Promise<ComposerSynthesisBundle | null> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return null;
  const m = data.world.metaScene;
  const sceneCore = [
    m.narrativePurpose?.trim()
      ? `Purpose: ${m.narrativePurpose.trim().slice(0, 900)}`
      : "Narrative purpose not written — the scene’s job in the book is still tacit.",
    m.centralConflict?.trim() ? `Central conflict: ${m.centralConflict.trim().slice(0, 700)}` : null,
    `Time window: ${m.timePeriod ?? "unset"} · ${m.dateEstimate ?? "no date estimate"}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const characterContext = [
    await describePovInterpretiveAxes(metaSceneId),
    await describeCharacterStateRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE),
  ].join("\n\n---\n\n");

  const environmentContext = await describeEnvironmentRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  const constraints = await describeConstraintPressureRichly(metaSceneId, DEFAULT_WORLD_PREVIEW_STYLE);
  const emotionalConflict = [
    m.emotionalVoltage?.trim() ? `Voltage: ${m.emotionalVoltage.trim()}` : "Emotional voltage not labeled.",
    m.characterStatesSummary?.trim() ? `Ensemble / states: ${m.characterStatesSummary.trim().slice(0, 800)}` : null,
    `Relationship pressure: ${await describeRelationshipPressureRichly(metaSceneId)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const symbolicLayer = await describeSymbolicLifeRichly(metaSceneId, DEFAULT_SUGGESTION_STYLE);

  const roles = ["informs_scene", "drives_conflict", "provides_symbolism", "represents_memory", "other"] as const;
  const buckets = roles.map((r) => ({ r, n: (data.linkedByRole[r] ?? []).length }));
  const fragCount = buckets.reduce((a, b) => a + b.n, 0);
  const fragmentIntegration =
    fragCount === 0
      ? "No fragments linked — the scene is still ideational without archive texture."
      : `This scene is assembling ${fragCount} linked fragment(s): ${buckets
          .filter((b) => b.n > 0)
          .map((b) => `${b.r.replace(/_/g, " ")} (${b.n})`)
          .join(", ")}. Together they argue for a particular kind of scene — check whether sensory, conflict, memory, and motif layers are all represented.`;

  return {
    sceneCore,
    characterContext,
    environmentContext,
    constraints,
    emotionalConflict,
    symbolicLayer,
    fragmentIntegration,
  };
}

export async function describeCharacterMindRichly(personId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      characterProfile: true,
      characterMemories: { orderBy: { updatedAt: "desc" }, take: 8 },
      relationshipsAsA: { include: { personB: { select: { name: true } } }, take: 6 },
      relationshipsAsB: { include: { personA: { select: { name: true } } }, take: 6 },
    },
  });
  if (!person) return "Character not found.";
  const p = person.characterProfile;
  const et = p?.enneagramType as EnneagramType | undefined;

  return [
    `## How this person tends to move through the world`,
    p?.behavioralPatterns?.trim() ||
      p?.worldview?.trim() ||
      "Not yet specified — movement habits, ritual, and avoidance patterns are still tacit.",
    ``,
    `## What they protect first`,
    p?.coreBeliefs?.trim() || p?.moralFramework?.trim() || "Protection hierarchy not named — add core beliefs or moral framework.",
    ``,
    `## What destabilizes them`,
    [p?.fears, p?.shameTrigger, p?.stressPattern].filter(Boolean).join(" · ") || "Destabilizers not recorded.",
    ``,
    `## How they interpret silence, danger, need, and attachment`,
    [
      p?.relationalStyle ? `Attachment/relational: ${p.relationalStyle}` : null,
      p?.conflictStyle ? `Conflict: ${p.conflictStyle}` : null,
      p?.attachmentPattern ? `Attachment pattern: ${p.attachmentPattern}` : null,
      p?.speechPatterns ? `Speech / silence: ${p.speechPatterns}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "Interpretive habits thin — add relational and conflict notes.",
    ``,
    `## What they are likely to hide even from themselves`,
    [p?.internalConflicts, p?.contradictions, p?.defensiveStyle].filter(Boolean).join(" · ") ||
      (et ? `Enneagram ${et} — use defensive style and contradictions fields to shadow what stays unnamed.` : "Add internal conflicts or contradictions for shadow material."),
    ``,
    `## Memory weather (recent)`,
    person.characterMemories.length
      ? person.characterMemories.map((m) => `(${m.reliability ?? "?"}) ${m.description.slice(0, 220)}`).join("\n")
      : "No memories on file — interior history may feel unmoored.",
    ``,
    `## Relationship field (names only)`,
    [
      ...person.relationshipsAsA.map((r) => `→ ${r.personB.name}`),
      ...person.relationshipsAsB.map((r) => `→ ${r.personA.name}`),
    ].join("\n") || "No relationship rows — social torque may be underspecified.",
    styleHint(style),
  ]
    .filter((x) => x !== "")
    .join("\n");
}

export async function describePlaceEnvironmentRichly(placeId: string, style: NarrativeStylePreset = DEFAULT_WORLD_PREVIEW_STYLE): Promise<string> {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    include: {
      settingProfile: true,
      settingStates: { orderBy: { updatedAt: "desc" }, take: 6 },
    },
  });
  if (!place) return "Place not found.";
  const sp = place.settingProfile;

  const physical = sp?.physicalDescription?.trim() || place.description?.trim();
  const sensory = [sp?.sounds, sp?.smells, sp?.textures, sp?.lightingConditions].filter(Boolean).join("; ");
  const systems = [sp?.socialRules, sp?.classDynamics, sp?.racialDynamics, sp?.economicContext, sp?.religiousPresence]
    .filter(Boolean)
    .join(" · ");

  return [
    `## What this place feels like physically`,
    physical
      ? physical.slice(0, 1400)
      : "Physical field thin — the reader may know the name without inhabiting the body of the place.",
    sensory ? `\nSensory braid: ${sensory}` : "",
    ``,
    `## Human systems operating here`,
    systems || "Social and economic systems not written — power may feel abstract.",
    ``,
    `## Emotional or symbolic weather the place tends to carry`,
    [sp?.dominantActivities, sp?.materialsPresent, sp?.notes].filter(Boolean).join(" · ") ||
      "Symbolic weather not named — add notes on what tends to repeat here (smoke, bell, river, shame, feast).",
    place.settingStates.length
      ? `\nSeasonal / conditional notes:\n${place.settingStates.map((s) => `- ${s.season ?? "—"} / ${s.weather ?? "—"}: ${s.notableConditions ?? ""}`).join("\n")}`
      : "",
    styleHint(style),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function describeRelationshipDyadRichly(relationshipId: string, style: NarrativeStylePreset = DEFAULT_SUGGESTION_STYLE): Promise<string> {
  const r = await prisma.characterRelationship.findUnique({
    where: { id: relationshipId },
    include: {
      personA: { select: { id: true, name: true } },
      personB: { select: { id: true, name: true } },
    },
  });
  if (!r) return "Relationship not found.";
  const ctx = await buildRelationshipContext(r.personAId, r.personBId);
  const pa = ctx?.profileA ?? null;
  const pb = ctx?.profileB ?? null;

  const misread =
    "Where misread happens: under stress, each may hear accusation where the other offers care — slow the dialogue until fear is named without humiliation.";

  return [
    `## Rich dynamic summary`,
    r.relationshipSummary?.trim() ||
      "No authored summary — dyad is still implicit; add what this bond is for and what it costs.",
    ``,
    `## Likely emotional loop`,
    deriveLikelyConflictLoop(pa, pb),
    r.emotionalPattern?.trim() ? `Authored emotional pattern: ${r.emotionalPattern.trim().slice(0, 600)}` : null,
    ``,
    `## Likely rupture pattern`,
    r.conflictPattern?.trim() || "Rupture pattern not specified — add conflict pattern or type-based read below.",
    ``,
    `## Likely repair path`,
    deriveLikelyRepairPath(pa, pb),
    r.attachmentPattern?.trim() ? `Attachment notes: ${r.attachmentPattern.trim().slice(0, 500)}` : null,
    ``,
    `## How these two misread one another`,
    misread,
    r.powerDynamic?.trim() ? `Power / status: ${r.powerDynamic.trim().slice(0, 600)}` : null,
    ``,
    `## Type attraction or tension (where types exist)`,
    r.enneagramDynamic?.trim() || deriveEnneagramRelationshipDynamic(pa, pb),
    styleHint(style),
  ]
    .filter(Boolean)
    .join("\n");
}