import type { CharacterBrainState, CharacterBrainBundle, SceneConstraintSummary, ScalarBand } from "@/lib/brain-assembly-types";
import { assembleCharacterSceneBrainState } from "@/lib/brain-assembly-engine";
import { buildSceneConstraintSummary, getCharacterBrainBundle } from "@/lib/character-brain-bundle";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { runSceneTimeBrain } from "@/lib/scene-brain-runner";
import type { SceneTimeBrainRunnerOutput } from "@/lib/scene-brain-runner-types";
import {
  applyStage8PerceptionStructuredOverrides,
  inferSceneReadinessClass,
  parseStage8StructuredDataPatch,
} from "@/lib/scene-structured-data-patch";
import { buildSceneOutcomeEnvelope } from "@/lib/scene-outcome-envelope-engine";
import type {
  SceneConstraintSet,
  SceneFocalSceneRunnerSummary,
  SceneObjectiveMap,
  ScenePerceptionMap,
  ScenePressureItem,
  ScenePressureMap,
  SceneReadiness,
  SceneReadinessReason,
  SceneRevealBudget,
  Stage8PolicyProvenance,
} from "@/lib/scene-constraint-types";

const makeId = (prefix: string, i: number) => `${prefix}-${i}`;

function uniqueStrings(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
}

function bandFromRevealScore(score: number | null | undefined): SceneRevealBudget["band"] {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score < 38) return "tight";
  if (score < 68) return "moderate";
  return "open";
}

function bandFromNumber(value: number | null | undefined): ScalarBand | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  if (value <= 0) return "none";
  if (value <= 15) return "very_low";
  if (value <= 30) return "low";
  if (value <= 45) return "guarded";
  if (value <= 60) return "mixed";
  if (value <= 75) return "present";
  if (value <= 90) return "high";
  return "acute";
}

function extractSceneConstraintsForRunner(raw: SceneConstraintSummary | null | undefined) {
  if (!raw) return null;
  return {
    revealBudget: bandFromNumber(raw.revealBudgetScore),
    pressureTags: uniqueStrings(raw.pressureTags ?? []),
    blockedActions: uniqueStrings(raw.blockedActions ?? []),
    forcedStillness: Boolean(raw.forcedStillness),
    immediateSignals: uniqueStrings(raw.immediateSignals ?? []),
    objective: raw.objective ?? null,
    socialExposure: bandFromNumber(raw.socialExposureScore),
    violenceProximity: bandFromNumber(raw.violenceProximityScore),
  };
}

function visibilityPressureCopy(vis: string): { note: string; strength: ScenePressureItem["strength"] } {
  switch (vis) {
    case "PUBLIC":
      return {
        note: "PUBLIC scene visibility — high default exposure / scrutiny pressure on speech and action.",
        strength: "high",
      };
    case "REVIEW":
      return {
        note: "REVIEW visibility — intermediate exposure; not assumed private to the story world.",
        strength: "medium",
      };
    default:
      return {
        note: "PRIVATE visibility — lower default audience exposure; in-scene witnesses still matter.",
        strength: "low",
      };
  }
}

function visibilityLegibilityCopy(vis: string): string {
  switch (vis) {
    case "PUBLIC":
      return "Reader-facing layer is explicit (PUBLIC) — treat dialogue and revelation as broadly observable unless the draft says otherwise.";
    case "REVIEW":
      return "Visibility is REVIEW — legibility sits between private beat and published canon; tighten POV and witnesses.";
    default:
      return "PRIVATE — default read is intimate or restricted; still verify who is present in-scene.";
  }
}

type PlaceForPressure = {
  name: string;
  placeType: string;
  settingProfile: {
    environmentType: string | null;
    socialRules: string | null;
    dominantActivities: string | null;
    lightingConditions: string | null;
    sounds: string | null;
  } | null;
  environmentProfile: {
    terrainType: string | null;
    hydrologyType: string | null;
    floodRiskLevel: number;
    droughtRiskLevel: number;
    mobilityProfile: string | null;
  } | null;
};

export function assembleScenePressureMap(
  summary: SceneConstraintSummary | null,
  scene: {
    emotionalTone?: string | null;
    narrativeIntent?: string | null;
    description?: string;
    writingMode?: string;
    visibility?: string;
  },
  linkedEventTypes: string[],
  places: PlaceForPressure[],
  focalEvaluation: SceneTimeBrainRunnerOutput | null,
): ScenePressureMap {
  const vis = scene.visibility ?? "PRIVATE";
  const { note: visibilityPressureNote, strength: visStrength } = visibilityPressureCopy(vis);

  const tagSummary = uniqueStrings([
    ...(summary?.pressureTags ?? []),
    ...(scene.emotionalTone?.trim() ? [scene.emotionalTone.trim()] : []),
    `visibility:${vis}`,
  ]);

  const items: ScenePressureItem[] = [];
  let i = 0;

  items.push({
    id: makeId("p", i++),
    code: "scene_visibility",
    label: visibilityPressureNote,
    strength: visStrength,
    source: "scene_visibility",
  });

  const textBlob = `${scene.emotionalTone ?? ""} ${scene.narrativeIntent ?? ""} ${scene.description ?? ""}`.toLowerCase();
  const violence = /violence|fight|attack|blood|weapon|wound|kill|battle/i.test(textBlob);

  if (violence) {
    items.push({
      id: makeId("p", i++),
      label: "Violence or threat proximity (scene copy)",
      strength: "high",
      source: "scene_copy",
    });
  }
  if (summary?.violenceProximityScore != null && summary.violenceProximityScore >= 60) {
    items.push({
      id: makeId("p", i++),
      label: `Violence proximity (Stage 7.5 score ${summary.violenceProximityScore})`,
      strength: summary.violenceProximityScore >= 80 ? "high" : "medium",
      source: "stage7_5_summary",
    });
  }
  if (summary?.socialExposureScore != null && summary.socialExposureScore >= 60) {
    items.push({
      id: makeId("p", i++),
      label: `Social exposure / visibility pressure (${summary.socialExposureScore})`,
      strength: summary.socialExposureScore >= 75 ? "high" : "medium",
      source: "stage7_5_summary",
    });
  }

  const placeNotes: string[] = [];
  const placeRiskFlagsSet = new Set<"flood_elevated" | "drought_elevated" | "terrain_stress">();

  places.forEach((pl, pi) => {
    items.push({
      id: makeId("p", i++),
      label: `Place type: ${pl.placeType} (${pl.name})`,
      strength: "low",
      source: "linked_entity",
    });

    const sp = pl.settingProfile;
    if (sp?.environmentType?.trim()) {
      placeNotes.push(`${pl.name}: environment — ${sp.environmentType.trim()}`);
      items.push({
        id: makeId("p", i++),
        code: `place_setting_env_${pi}`,
        label: `${pl.name}: setting environment type — ${sp.environmentType.trim()}`,
        strength: "low",
        source: "place_setting",
      });
    }
    if (sp?.socialRules?.trim()) {
      placeNotes.push(`${pl.name}: social rules present (setting profile)`);
      items.push({
        id: makeId("p", i++),
        label: `${pl.name}: social pressure (setting rules)`,
        strength: "medium",
        source: "place_setting",
      });
    }
    if (sp?.dominantActivities?.trim()) {
      items.push({
        id: makeId("p", i++),
        label: `${pl.name}: dominant activities — ${sp.dominantActivities.trim().slice(0, 80)}`,
        strength: "low",
        source: "place_setting",
      });
    }

    const ep = pl.environmentProfile;
    if (ep) {
      if (ep.floodRiskLevel >= 55) {
        placeRiskFlagsSet.add("flood_elevated");
        items.push({
          id: makeId("p", i++),
          code: "place_flood_risk",
          label: `Elevated flood risk (${ep.floodRiskLevel}) — ${pl.name}`,
          strength: ep.floodRiskLevel >= 75 ? "high" : "medium",
          source: "place_environment",
        });
      }
      if (ep.droughtRiskLevel >= 55) {
        placeRiskFlagsSet.add("drought_elevated");
        items.push({
          id: makeId("p", i++),
          code: "place_drought_risk",
          label: `Elevated drought stress (${ep.droughtRiskLevel}) — ${pl.name}`,
          strength: ep.droughtRiskLevel >= 75 ? "high" : "medium",
          source: "place_environment",
        });
      }
      if (ep.terrainType?.trim() || ep.hydrologyType?.trim()) {
        items.push({
          id: makeId("p", i++),
          label: [ep.terrainType, ep.hydrologyType].filter(Boolean).join(" · ") + ` — ${pl.name}`,
          strength: "low",
          source: "place_environment",
        });
        if ((ep.terrainType ?? "").toLowerCase().includes("marsh") || (ep.hydrologyType ?? "").toLowerCase().includes("flood")) {
          placeRiskFlagsSet.add("terrain_stress");
        }
      }
    }
  });

  for (const et of linkedEventTypes.slice(0, 4)) {
    items.push({
      id: makeId("p", i++),
      label: `Linked event type: ${et}`,
      strength: "medium",
      source: "linked_entity",
    });
  }
  if (scene.writingMode === "STRUCTURED") {
    items.push({
      id: makeId("p", i++),
      label: "Structured writing mode (scaffold-forward)",
      strength: "low",
      source: "scene_copy",
    });
  }

  const focalBrainHints = focalEvaluation
    ? uniqueStrings([
        ...focalEvaluation.salientSignals.slice(0, 6),
        ...focalEvaluation.runnerTrace.slice(0, 3).map((t) => t.summary),
        focalEvaluation.primaryFear ? `Primary fear cue: ${focalEvaluation.primaryFear}` : null,
      ])
    : [];

  if (focalEvaluation) {
    for (const sig of focalEvaluation.salientSignals.slice(0, 4)) {
      items.push({
        id: makeId("p", i++),
        code: "focal_salient_signal",
        label: `Focal brain: ${sig}`,
        strength: "medium",
        source: "focal_scene_brain",
      });
    }
  }

  return {
    items,
    tagSummary,
    sceneVisibility: vis,
    visibilityPressureNote,
    placeNotes,
    focalBrainHints,
    placeRiskFlags: [...placeRiskFlagsSet],
  };
}

export function assembleScenePerceptionMap(args: {
  scene: { pov?: string | null; locationNote?: string | null; draftText?: string | null; narrativeIntent?: string | null };
  sceneVisibility: string;
  places: PlaceForPressure[];
  personNames: string[];
  placeNames: string[];
  eventTitles: string[];
  symbolNames: string[];
  openQuestionTitles: string[];
  immediateSignals: string[];
  brain: CharacterBrainState | null;
  focalEvaluation: SceneTimeBrainRunnerOutput | null;
}): ScenePerceptionMap {
  const {
    scene,
    sceneVisibility,
    places,
    personNames,
    placeNames,
    eventTitles,
    symbolNames,
    openQuestionTitles,
    immediateSignals,
    brain,
    focalEvaluation,
  } = args;

  const visibleAnchors = uniqueStrings([
    ...personNames.map((n) => `Person: ${n}`),
    ...placeNames.map((n) => `Place: ${n}`),
    ...eventTitles.map((n) => `Event: ${n}`),
    ...symbolNames.map((n) => `Symbol: ${n}`),
    ...(scene.locationNote?.trim() ? [`Location note: ${scene.locationNote.trim()}`] : []),
    ...(scene.pov?.trim() ? [`POV: ${scene.pov.trim()}`] : []),
    ...(scene.narrativeIntent?.trim() ? [`Intent: ${scene.narrativeIntent.trim()}`] : []),
    `Scene visibility: ${sceneVisibility}`,
  ]);

  const hiddenOrUnknown: string[] = [];
  if (!scene.pov?.trim()) hiddenOrUnknown.push("POV not pinned");
  if (placeNames.length === 0) hiddenOrUnknown.push("No place anchor");
  if (personNames.length === 0) hiddenOrUnknown.push("No characters linked");

  const ambiguousZones = uniqueStrings([
    ...openQuestionTitles.map((t) => `Open question: ${t}`),
    ...(scene.draftText && scene.draftText.length > 800 ? ["Long draft — beat boundaries may be ambiguous"] : []),
  ]);

  const misreadRisks = uniqueStrings([
    ...immediateSignals,
    ...(/tense|fear|shame|secret|lie|hidden/i.test(`${scene.draftText ?? ""} ${scene.narrativeIntent ?? ""}`)
      ? ["Tone suggests concealment or emotional volatility (misread-prone)"]
      : []),
  ]);

  const visibilityLegibility = visibilityLegibilityCopy(sceneVisibility);

  const placeEnvironmentCues: string[] = [];
  for (const pl of places) {
    const sp = pl.settingProfile;
    const ep = pl.environmentProfile;
    if (sp?.lightingConditions?.trim()) {
      placeEnvironmentCues.push(`${pl.name}: light — ${sp.lightingConditions.trim().slice(0, 120)}`);
    }
    if (sp?.sounds?.trim()) {
      placeEnvironmentCues.push(`${pl.name}: sound — ${sp.sounds.trim().slice(0, 120)}`);
    }
    if (ep?.terrainType?.trim()) {
      placeEnvironmentCues.push(`${pl.name}: terrain — ${ep.terrainType.trim()}`);
    }
    if (ep?.mobilityProfile?.trim()) {
      placeEnvironmentCues.push(`${pl.name}: mobility — ${ep.mobilityProfile.trim().slice(0, 120)}`);
    }
  }

  const focalBrainPerceptionHints = uniqueStrings([
    ...(brain
      ? [...brain.perception.likelyMisses.slice(0, 4), ...brain.perception.likelyMisreads.slice(0, 4)]
      : []),
    ...(focalEvaluation
      ? [
          ...focalEvaluation.salientSignals.slice(0, 4),
          focalEvaluation.primaryFear ? `Fear: ${focalEvaluation.primaryFear}` : null,
          focalEvaluation.runnerNotes.slice(0, 2),
        ].flat()
      : []),
  ]);

  const focalDominantInterpretation = focalEvaluation?.dominantInterpretation?.trim() || null;

  return {
    visibleAnchors,
    hiddenOrUnknown,
    ambiguousZones,
    misreadRisks,
    visibilityLegibility,
    placeEnvironmentCues,
    focalBrainPerceptionHints,
    focalDominantInterpretation,
  };
}

export function assembleSceneObjectiveMap(args: {
  sceneObjective: string | null;
  persons: Array<{ id: string; name: string }>;
  characterStatesByPersonId: Map<string, { motivation: string | null } | null>;
  focalPersonId: string | null;
}): SceneObjectiveMap {
  const { sceneObjective, persons, characterStatesByPersonId, focalPersonId } = args;

  const byPerson = persons.map((p) => ({
    personId: p.id,
    displayName: p.name,
    sceneObjective,
    characterMotivation: characterStatesByPersonId.get(p.id)?.motivation ?? null,
  }));

  const focal =
    focalPersonId != null ? byPerson.find((e) => e.personId === focalPersonId) ?? null : persons[0] ? byPerson[0]! : null;

  return { focal, byPerson };
}

export function assembleSceneRevealBudget(summary: SceneConstraintSummary | null): SceneRevealBudget {
  const score = summary?.revealBudgetScore ?? null;
  const factors = uniqueStrings([
    ...(summary?.revealBudgetScore != null ? [`Stage 7.5 reveal budget score: ${summary.revealBudgetScore}`] : []),
    ...(summary?.forcedStillness ? ["Forced stillness cue — disclosure may be risky"] : []),
  ]);
  return {
    score0to100: score,
    band: bandFromRevealScore(score),
    factors,
  };
}

const sceneConstraintInclude = {
  persons: { orderBy: { name: "asc" as const } },
  places: {
    include: {
      settingProfile: true,
      environmentProfile: true,
    },
  },
  events: true,
  symbols: true,
  openQuestions: true,
  sources: { select: { id: true } },
  characterStates: { orderBy: { updatedAt: "desc" as const } },
} satisfies Prisma.SceneInclude;

type SceneForConstraints = Prisma.SceneGetPayload<{ include: typeof sceneConstraintInclude }>;

function placesForPressure(scene: SceneForConstraints): PlaceForPressure[] {
  return scene.places.map((pl) => ({
    name: pl.name,
    placeType: String(pl.placeType),
    settingProfile: pl.settingProfile
      ? {
          environmentType: pl.settingProfile.environmentType,
          socialRules: pl.settingProfile.socialRules,
          dominantActivities: pl.settingProfile.dominantActivities,
          lightingConditions: pl.settingProfile.lightingConditions,
          sounds: pl.settingProfile.sounds,
        }
      : null,
    environmentProfile: pl.environmentProfile
      ? {
          terrainType: pl.environmentProfile.terrainType,
          hydrologyType: pl.environmentProfile.hydrologyType,
          floodRiskLevel: pl.environmentProfile.floodRiskLevel,
          droughtRiskLevel: pl.environmentProfile.droughtRiskLevel,
          mobilityProfile: pl.environmentProfile.mobilityProfile,
        }
      : null,
  }));
}

async function resolveUpstreamSummary(args: {
  scene: SceneForConstraints;
  worldStateId: string | null;
  focalPersonId: string | null;
}): Promise<{ summary: SceneConstraintSummary | null; usedBrainBundle: boolean; bundle: CharacterBrainBundle | null }> {
  const { scene, worldStateId, focalPersonId } = args;

  if (worldStateId && focalPersonId) {
    const bundle = await getCharacterBrainBundle(focalPersonId, worldStateId, scene.id, null);
    return { summary: bundle.sceneConstraintSummary ?? null, usedBrainBundle: true, bundle };
  }

  const focalCharacterStates = focalPersonId
    ? scene.characterStates.filter((cs) => cs.personId === focalPersonId)
    : [];

  const characterStateForPerson =
    focalPersonId && focalCharacterStates.length
      ? (worldStateId
          ? focalCharacterStates.find((cs) => cs.worldStateId === worldStateId)
          : null) ??
        focalCharacterStates.find((cs) => cs.worldStateId == null) ??
        focalCharacterStates[0] ??
        null
      : null;

  const row = characterStateForPerson
    ? {
        trustLevel: characterStateForPerson.trustLevel,
        fearLevel: characterStateForPerson.fearLevel,
        cognitiveLoad: characterStateForPerson.cognitiveLoad,
        socialConstraint: characterStateForPerson.socialConstraint,
      }
    : null;

  return {
    summary: buildSceneConstraintSummary({ scene, characterStateForPerson: row }),
    usedBrainBundle: false,
    bundle: null,
  };
}

export async function assembleSceneConstraintSet(
  sceneId: string,
  worldStateId: string | null,
  focalPersonId: string | null,
): Promise<SceneConstraintSet | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: sceneConstraintInclude,
  });

  if (!scene) return null;

  const effectiveFocal = focalPersonId ?? scene.persons[0]?.id ?? null;

  const { summary, usedBrainBundle, bundle } = await resolveUpstreamSummary({
    scene,
    worldStateId,
    focalPersonId: effectiveFocal,
  });

  let brainState: CharacterBrainState | null = null;
  let focalEvaluation: SceneTimeBrainRunnerOutput | null = null;
  let focalSceneRunner: SceneFocalSceneRunnerSummary | null = null;

  if (bundle && worldStateId && effectiveFocal) {
    brainState = assembleCharacterSceneBrainState(bundle);
    focalEvaluation = runSceneTimeBrain({
      personId: effectiveFocal,
      worldStateId,
      sceneId: scene.id,
      counterpartPersonId: null,
      bundle,
      brain: brainState,
      sceneConstraints: extractSceneConstraintsForRunner(summary),
    });
    focalSceneRunner = {
      regulationMode: focalEvaluation.regulationMode,
      speechStyle: focalEvaluation.speechWindow.style,
      primaryFear: focalEvaluation.primaryFear,
      salientSignals: focalEvaluation.salientSignals,
    };
  }

  const usedFocalSceneBrainRunner = focalEvaluation != null;

  const csRows = scene.characterStates;
  const characterStatesByPersonId = new Map<string, { motivation: string | null } | null>();
  for (const p of scene.persons) {
    const states = csRows.filter((c) => c.personId === p.id);
    const row =
      (worldStateId ? states.find((s) => s.worldStateId === worldStateId) : null) ??
      states.find((s) => s.worldStateId == null) ??
      states[0] ??
      null;
    characterStatesByPersonId.set(p.id, row ? { motivation: row.motivation } : null);
  }

  const sceneObjective =
    summary?.objective?.trim() ||
    scene.narrativeIntent?.trim() ||
    (scene.summary?.trim() ? scene.summary.trim().slice(0, 500) : null);

  const placesPayload = placesForPressure(scene);

  const pressure = assembleScenePressureMap(
    summary,
    scene,
    scene.events.map((e) => String(e.eventType)),
    placesPayload,
    focalEvaluation,
  );

  let perception = assembleScenePerceptionMap({
    scene,
    sceneVisibility: scene.visibility,
    places: placesPayload,
    personNames: scene.persons.map((p) => p.name),
    placeNames: scene.places.map((p) => p.name),
    eventTitles: scene.events.map((e) => e.title),
    symbolNames: scene.symbols.map((s) => s.name),
    openQuestionTitles: scene.openQuestions.map((q) => q.title),
    immediateSignals: summary?.immediateSignals ?? [],
    brain: brainState,
    focalEvaluation,
  });

  const stage8StructuredPatch = parseStage8StructuredDataPatch(scene.structuredDataJson);
  perception = applyStage8PerceptionStructuredOverrides(perception, stage8StructuredPatch);

  const readinessClassResolution = inferSceneReadinessClass({
    patch: stage8StructuredPatch,
    visibility: scene.visibility,
    personCount: scene.persons.length,
    placeCount: scene.places.length,
    narrativeIntent: scene.narrativeIntent,
    description: scene.description,
    historicalConfidence: scene.historicalConfidence,
    sourcesCount: scene.sources.length,
  });
  const sceneReadinessClass = readinessClassResolution.sceneClass;
  const sceneReadinessClassSource = readinessClassResolution.source;

  const stage8PolicyProvenance: Stage8PolicyProvenance = {
    effectiveClass: readinessClassResolution.sceneClass,
    classSource: readinessClassResolution.source,
    inferredClassSansAuthorOverride: readinessClassResolution.inferredWithoutAuthorClass,
    sceneClassAuthorDiffersFromInference: readinessClassResolution.authorClassOverridesInference,
    overridesApplied: {
      sceneClass: Boolean(stage8StructuredPatch.sceneClass),
      visibilityLegibility: Boolean(stage8StructuredPatch.visibilityLegibility?.trim()),
      focalPerception: Boolean(stage8StructuredPatch.focalPerceptionOverride?.trim()),
      dominantInterpretation: Boolean(stage8StructuredPatch.dominantInterpretationOverride?.trim()),
      historicalSupportRequired: stage8StructuredPatch.historicalSupportRequired !== undefined,
    },
  };

  const hasStage8AuthorSurface = Boolean(
    stage8StructuredPatch.visibilityLegibility?.trim() ||
      stage8StructuredPatch.focalPerceptionOverride?.trim() ||
      stage8StructuredPatch.dominantInterpretationOverride?.trim() ||
      stage8StructuredPatch.historicalSupportRequired !== undefined ||
      stage8StructuredPatch.sceneClass,
  );
  if (hasStage8AuthorSurface) {
    pressure.tagSummary = uniqueStrings([...pressure.tagSummary, "stage8:structuredDataJson"]);
  }

  const objectives = assembleSceneObjectiveMap({
    sceneObjective,
    persons: scene.persons,
    characterStatesByPersonId,
    focalPersonId: effectiveFocal,
  });

  const revealBudget = assembleSceneRevealBudget(summary);
  const outcomeEnvelope = buildSceneOutcomeEnvelope({
    summary,
    pressure,
    perception,
    objectives,
    revealBudget,
    sceneReadinessClass,
    focalEvaluation,
    brainState,
  });

  return {
    sceneId,
    worldStateId,
    focalPersonId: effectiveFocal,
    usedBrainBundle,
    usedFocalSceneBrainRunner,
    focalSceneRunner,
    stage8StructuredPatch,
    sceneReadinessClass,
    sceneReadinessClassSource,
    stage8PolicyProvenance,
    sourcesLinkedCount: scene.sources.length,
    historicalConfidence: scene.historicalConfidence,
    upstreamSceneConstraintSummary: summary,
    pressure,
    perception,
    objectives,
    revealBudget,
    outcomeEnvelope,
    assembledAtIso: new Date().toISOString(),
  };
}

/**
 * Full focal scene-time brain output for validation scripts (e.g. Asha vs Elaya focal on the same scene).
 * Does not persist; mirrors the runner step inside `assembleSceneConstraintSet`.
 */
export async function getFocalTimeBrainForScene(
  sceneId: string,
  worldStateId: string,
  focalPersonId: string,
): Promise<{
  brain: CharacterBrainState;
  evaluation: SceneTimeBrainRunnerOutput;
} | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: sceneConstraintInclude,
  });
  if (!scene) return null;
  const { summary, bundle } = await resolveUpstreamSummary({
    scene,
    worldStateId,
    focalPersonId,
  });
  if (!bundle) return null;
  const brain = assembleCharacterSceneBrainState(bundle);
  const evaluation = runSceneTimeBrain({
    personId: focalPersonId,
    worldStateId,
    sceneId: scene.id,
    counterpartPersonId: null,
    bundle,
    brain,
    sceneConstraints: extractSceneConstraintsForRunner(summary),
  });
  return { brain, evaluation };
}

function pushReason(bucket: SceneReadinessReason[], code: string, message: string) {
  bucket.push({ code, message });
}

export function evaluateSceneReadiness(args: {
  set: SceneConstraintSet;
  hasWorldState: boolean;
  draftTextEmpty: boolean;
}): SceneReadiness {
  const { set, hasWorldState, draftTextEmpty } = args;
  const blocking: SceneReadinessReason[] = [];
  const warnings: SceneReadinessReason[] = [];
  const info: SceneReadinessReason[] = [];
  const missingDependencies: string[] = [];
  const weakAreas: string[] = [];

  /* —— Policy: world-era + Stage 7.5 bundle —— */
  if (!hasWorldState) {
    pushReason(
      warnings,
      "world_state_missing",
      "No world state selected — Stage 7.5 brain bundle was not used; constraints are scene-local heuristics only.",
    );
    missingDependencies.push("worldStateId (for bundle-aligned legality)");
  } else if (!set.usedBrainBundle) {
    pushReason(
      warnings,
      "bundle_not_used",
      "World state is set but the brain bundle did not run (missing focal character); using heuristic constraints.",
    );
  }

  const cls = set.sceneReadinessClass;
  const patch = set.stage8StructuredPatch;

  /* —— Policy: linked anchors + cast (scene-class aware) —— */
  if (set.perception.visibleAnchors.length === 0) {
    pushReason(
      blocking,
      "no_visible_anchors",
      "Link at least one entity so the scene has visible narrative anchors.",
    );
    missingDependencies.push("linked people, places, events, or symbols");
  } else if (set.perception.hiddenOrUnknown.includes("No characters linked")) {
    pushReason(
      blocking,
      "no_characters",
      "No characters linked — focal objectives and relational legality are undefined.",
    );
    missingDependencies.push("at least one linked person");
  }

  if (set.objectives.byPerson.length === 0) {
    weakAreas.push("objectives (no linked cast)");
  }

  if (cls === "ensemble_no_focal") {
    pushReason(
      info,
      "scene_class_ensemble",
      "Ensemble-class scene — legality de-emphasizes a single focal; still ground cast and world state when possible.",
    );
  }

  /* —— Policy: draft + reveal (scene-class aware) —— */
  if (draftTextEmpty) {
    if (cls === "public_confrontation") {
      pushReason(
        warnings,
        "draft_empty_public",
        "Draft is empty — public confrontation scenes need prose before staging legality with confidence.",
      );
    } else {
      pushReason(info, "draft_empty", "Draft is empty — readiness stays partial until prose exists.");
    }
    weakAreas.push("draftText");
  }

  if (set.revealBudget.band === "tight") {
    weakAreas.push("reveal budget tight — disclosure-heavy outcomes need review");
  }

  /* —— Policy: historical sources (class + structuredDataJson) —— */
  const historicalBlocking =
    (patch.historicalSupportRequired === true || cls === "historical_anchor") && set.sourcesLinkedCount === 0;
  if (historicalBlocking) {
    pushReason(
      blocking,
      "historical_sources_missing",
      "Historical support required — link at least one source before treating this scene as historically grounded.",
    );
    missingDependencies.push("linked sources");
  }

  /* —— Policy: travel / movement —— */
  if (cls === "travel_movement" && set.perception.hiddenOrUnknown.includes("No place anchor")) {
    pushReason(
      warnings,
      "travel_missing_place",
      "Travel/movement class — link a place (or tighten location note) so movement legality can anchor.",
    );
  }

  /* —— Policy: intimate disclosure —— */
  if (cls === "intimate_disclosure" && set.perception.hiddenOrUnknown.includes("POV not pinned")) {
    pushReason(
      warnings,
      "intimate_pov_unpinned",
      "Intimate disclosure class — pinning POV reduces misread risk for consent and revelation.",
    );
  }

  /* —— Policy: scene visibility (record-level) —— */
  if (set.pressure.sceneVisibility === "PUBLIC") {
    pushReason(
      info,
      "scene_visibility_public",
      "Scene record visibility is PUBLIC — default narrative exposure / scrutiny pressure is elevated.",
    );
  } else if (set.pressure.sceneVisibility === "REVIEW") {
    pushReason(
      info,
      "scene_visibility_review",
      "Scene visibility is REVIEW — treat legibility as provisional until status is decided.",
    );
  }

  /* —— Policy: place environment stress —— */
  if (set.pressure.placeRiskFlags.length > 0) {
    pushReason(
      warnings,
      "place_environment_stress",
      `Linked place environment signals: ${set.pressure.placeRiskFlags.join(", ")} — check stakes and mobility in draft.`,
    );
  }

  /* —— Policy: focal scene-time brain —— */
  if (set.usedFocalSceneBrainRunner && set.focalSceneRunner) {
    const { regulationMode, speechStyle } = set.focalSceneRunner;
    if (regulationMode === "frozen" || regulationMode === "overloaded" || regulationMode === "flooded") {
      pushReason(
        warnings,
        "focal_regulation_stress",
        `Focal character regulation mode is “${regulationMode}” — scene may resist stable blocking beats.`,
      );
    } else if (regulationMode === "guarded") {
      pushReason(
        info,
        "focal_regulation_guarded",
        "Focal regulation is guarded — speech/action windows are narrowed.",
      );
    }
    if (speechStyle === "silent") {
      pushReason(info, "focal_speech_silent", "Focal speech window reads as largely silent — dialogue legality is constrained.");
    }
  }

  const policy = { blocking, warnings, info };

  let level: SceneReadiness["level"] = "ready";
  if (policy.blocking.length > 0) {
    level = "blocked";
  } else if (
    policy.warnings.length > 0 ||
    weakAreas.length >= 2 ||
    policy.info.length > 0
  ) {
    level = "partial";
  }

  return {
    level,
    policy,
    missingDependencies,
    weakAreas,
  };
}
