import type {
  BrainAssemblyListItem,
  CharacterBrainBundle,
  CharacterBrainState,
  DecisionEnvelope,
  DyadDisclosureBlend,
  MeaningEnvelope,
  PerceptionEnvelope,
  RegulationEnvelope,
  RelationalSafetyEnvelope,
  ScalarBand,
  SceneConstraintSummary,
} from "./brain-assembly-types";

function preferBand(...bands: Array<ScalarBand | null | undefined>): ScalarBand {
  const rank: ScalarBand[] = [
    "none",
    "very_low",
    "low",
    "guarded",
    "mixed",
    "present",
    "high",
    "acute",
  ];

  return (
    bands
      .filter((b): b is ScalarBand => Boolean(b))
      .sort((a, b) => rank.indexOf(b) - rank.indexOf(a))[0] ?? "none"
  );
}

const INTIMACY_RANK: ScalarBand[] = [
  "none",
  "very_low",
  "low",
  "guarded",
  "mixed",
  "present",
  "high",
  "acute",
];

/** Lower index = tighter permission to lean into intimacy / plain naming. */
function tighterIntimacy(a: ScalarBand, b: ScalarBand): ScalarBand {
  return INTIMACY_RANK.indexOf(a) <= INTIMACY_RANK.indexOf(b) ? a : b;
}

function looserIntimacy(a: ScalarBand, b: ScalarBand): ScalarBand {
  return INTIMACY_RANK.indexOf(a) >= INTIMACY_RANK.indexOf(b) ? a : b;
}

function intimacyFromMaskingAndDyad(
  maskingNeed: ScalarBand | null | undefined,
  dyad: DyadDisclosureBlend | null | undefined,
): ScalarBand {
  let intimacy: ScalarBand = maskingNeed === "acute" ? "very_low" : "guarded";
  if (!dyad) return intimacy;

  if (dyad.witnessSensitivity === "high") intimacy = tighterIntimacy(intimacy, "low");
  else if (dyad.witnessSensitivity === "moderate") intimacy = tighterIntimacy(intimacy, "guarded");

  if (dyad.namingVsHinting === "naming_costly") intimacy = tighterIntimacy(intimacy, "very_low");
  else if (
    dyad.namingVsHinting === "hint_favored" &&
    dyad.witnessSensitivity === "low" &&
    dyad.reciprocityExpectation === "high"
  ) {
    intimacy = looserIntimacy(intimacy, "mixed");
  }

  if (dyad.reciprocityExpectation === "low") intimacy = tighterIntimacy(intimacy, "guarded");

  return intimacy;
}

function unique(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function normalizeList(items?: Array<string | BrainAssemblyListItem> | null): string[] {
  if (!items?.length) return [];
  return unique(
    items.map((item) => (typeof item === "string" ? item : item.label)).filter(Boolean),
  );
}

function sceneConstraintPerceptionAugment(summary: SceneConstraintSummary | null | undefined): {
  likelyMisses: string[];
  likelyMisreads: string[];
  sensoryBiases: string[];
} {
  if (!summary) return { likelyMisses: [], likelyMisreads: [], sensoryBiases: [] };
  const likelyMisses: string[] = [];
  const likelyMisreads: string[] = [];
  const sensoryBiases: string[] = [];

  if (summary.forcedStillness) {
    likelyMisses.push("exit / repositioning may be unavailable (scene stillness)");
  }
  for (const a of summary.blockedActions ?? []) {
    if (a.trim()) likelyMisses.push(`action unavailable in this beat: ${a.trim()}`);
  }
  if (summary.violenceProximityScore != null && summary.violenceProximityScore >= 55) {
    likelyMisreads.push(
      `violence proximity (${summary.violenceProximityScore}) — survival scan may crowd out subtle social reads`,
    );
  }
  if (summary.socialExposureScore != null && summary.socialExposureScore >= 55) {
    likelyMisreads.push(
      `social exposure (${summary.socialExposureScore}) — witness / face-cost may dominate interpretation`,
    );
  }
  if (summary.revealBudgetScore != null && summary.revealBudgetScore >= 62) {
    likelyMisreads.push(`tight reveal budget (${summary.revealBudgetScore}) — costly to be plain or legible`);
  }
  for (const t of summary.pressureTags ?? []) {
    if (t.trim()) likelyMisreads.push(`scene pressure: ${t.trim()}`);
  }
  for (const s of summary.immediateSignals ?? []) {
    if (s.trim()) sensoryBiases.push(s.trim());
  }
  return { likelyMisses, likelyMisreads, sensoryBiases };
}

function buildPerception(bundle: CharacterBrainBundle): PerceptionEnvelope {
  const sceneAug = sceneConstraintPerceptionAugment(bundle.sceneConstraintSummary);
  return {
    noticeBandwidth: bundle.intelligence?.noticeBandwidth ?? "guarded",
    likelyMisses: unique([
      ...normalizeList(bundle.environment?.movementLimits),
      ...(bundle.continuity?.learnedRules ?? []).map((rule) => `outside learned rule: ${rule}`),
      ...sceneAug.likelyMisses,
    ]),
    likelyMisreads: unique([
      ...(bundle.continuity?.traumaTriggers ?? []).map((t) => `trigger-colored read: ${t}`),
      ...(bundle.pressure?.dangerSources ?? []).map((d) => `threat-first interpretation: ${d}`),
      ...sceneAug.likelyMisreads,
    ]),
    sensoryBiases: unique([...normalizeList(bundle.environment?.sensoryBiases), ...sceneAug.sensoryBiases]),
    reactionSpeed: bundle.intelligence?.reactionSpeed ?? "mixed",
  };
}

function eraSimulationMeaningLines(era: NonNullable<CharacterBrainBundle["worldEraContext"]>): {
  explanatory: string[];
  danger: string[];
} {
  const explanatory: string[] = [];
  const danger: string[] = [];
  const w = era.effectivePressureWeights;
  if (w) {
    explanatory.push(
      `Effective world-pressure mix (era-tilted): governance ${w.governanceWeight}% · economic ${w.economicWeight}% · demographic ${w.demographicWeight}% · family ${w.familyWeight}%`,
    );
  }
  const k = era.knobs;
  if (k.autonomyBaseline <= 38) {
    explanatory.push(
      `Low autonomy baseline (${k.autonomyBaseline}) — formal rules and social leverage tend to feel inescapable.`,
    );
    danger.push(`low autonomy climate (${k.autonomyBaseline}) — sanction risk feels omnipresent`);
  } else if (k.autonomyBaseline >= 72) {
    explanatory.push(
      `Higher autonomy baseline (${k.autonomyBaseline}) — more room to maneuver before punishment feels certain.`,
    );
  }
  if (k.economicPressure >= 58) {
    explanatory.push(`Strong material / economic pressure (${k.economicPressure}) — work and scarcity shape what feels plausible.`);
    danger.push(`economic squeeze salient (${k.economicPressure})`);
  }
  if (k.collectiveCohesion >= 58) {
    explanatory.push(`High collective cohesion (${k.collectiveCohesion}) — belonging, shame, and group legibility run hot.`);
    danger.push(`group / witness pressure (${k.collectiveCohesion})`);
  }
  if (k.relationalInterdependence >= 58) {
    explanatory.push(
      `High relational interdependence (${k.relationalInterdependence}) — kin and dyad stakes constrain what can be said.`,
    );
    danger.push(`relational obligation load (${k.relationalInterdependence})`);
  }
  if (k.systemicExtraction >= 58) {
    explanatory.push(`Systemic extraction / coercion climate (${k.systemicExtraction}) — control and surplus-taking saturate threat models.`);
    danger.push(`coercion / extraction climate (${k.systemicExtraction})`);
  }
  return { explanatory, danger };
}

function buildMeaning(bundle: CharacterBrainBundle): MeaningEnvelope {
  const era = bundle.worldEraContext;
  const eraSim = era ? eraSimulationMeaningLines(era) : { explanatory: [] as string[], danger: [] as string[] };
  const eraExplanatory = unique([
    ...(era?.meaningOfWork ? [`meaning of work (era): ${era.meaningOfWork}`] : []),
    ...(era?.powerSummary ? [`power / leverage (era): ${era.powerSummary}`] : []),
    ...((era?.coreEconomicDrivers ?? []).map((d) => `economic driver (era): ${d}`)),
    ...(era?.evidenceRationale ? [`knob accountability (era): ${era.evidenceRationale}`] : []),
    ...eraSim.explanatory,
  ]);
  const sceneIntent = bundle.sceneConstraintSummary?.objective?.trim()
    ? [`scene beat objective: ${bundle.sceneConstraintSummary.objective.trim().slice(0, 600)}`]
    : [];
  return {
    explanatoryFrame: unique([
      ...(bundle.intelligence?.cognitiveStyle ?? []),
      ...sceneIntent,
      ...eraExplanatory,
      ...(bundle.continuity?.consequenceMemory ?? []),
    ]),
    idiomPressure: unique(bundle.continuity?.learnedRules ?? []),
    dangerFrame: unique([
      ...(bundle.pressure?.dangerSources ?? []),
      ...normalizeList(bundle.environment?.immediateRisks),
      ...eraSim.danger,
    ]),
    shameFrame: unique((bundle.continuity?.learnedRules ?? []).map((r) => `violation risk: ${r}`)),
    hopeFrame: unique(bundle.relationships?.safePeople ?? []),
  };
}

function buildRegulation(bundle: CharacterBrainBundle): RegulationEnvelope {
  return {
    baselineRegulation: preferBand(bundle.health?.mentalLoad, bundle.health?.emotionalLoad, "guarded"),
    overloadRisk: preferBand(bundle.health?.mentalLoad, bundle.pressure?.survivalMode),
    freezeRisk: preferBand(bundle.pressure?.survivalMode, bundle.health?.emotionalLoad),
    floodRisk: preferBand(bundle.health?.emotionalLoad, bundle.health?.mentalLoad),
    likelySelfManagement: unique(bundle.health?.likelySelfManagement ?? []),
  };
}

function buildRelationalSafety(bundle: CharacterBrainBundle): RelationalSafetyEnvelope {
  const dyad = bundle.relationships?.dyadDisclosure ?? undefined;
  const maskingNeed = bundle.relationships?.maskingNeed ?? "mixed";
  const disclosureCost =
    bundle.relationships?.disclosureCost ?? bundle.pressure?.speechRestriction ?? "guarded";

  return {
    safePeople: unique(bundle.relationships?.safePeople ?? []),
    unsafePeople: unique(bundle.relationships?.unsafePeople ?? []),
    disclosureCost,
    intimacyPermission: intimacyFromMaskingAndDyad(maskingNeed, dyad ?? null),
    likelyMaskingNeed: maskingNeed,
    ...(dyad ? { dyadDisclosure: dyad } : {}),
  };
}

function buildDecision(
  bundle: CharacterBrainBundle,
  regulation: RegulationEnvelope,
  relationalSafety: RelationalSafetyEnvelope,
): DecisionEnvelope {
  const scene = bundle.sceneConstraintSummary;
  const forbiddenActions = unique([
    ...normalizeList(bundle.environment?.movementLimits).map((m) => `cannot safely do: ${m}`),
    ...(bundle.continuity?.learnedRules ?? []).map((r) => `forbidden by learned rule: ${r}`),
    ...(scene?.blockedActions ?? [])
      .filter((a) => a.trim())
      .map((a) => `blocked in this beat: ${a.trim()}`),
    ...(scene?.forcedStillness ? ["cannot reposition / exit (forced stillness)"] : []),
  ]);

  const availableActions = unique([
    "observe",
    "withhold",
    "test safety",
    ...(relationalSafety.safePeople.length ? ["disclose selectively"] : []),
    ...(regulation.freezeRisk === "acute" ? ["shut down / go still"] : []),
    ...(scene?.violenceProximityScore != null && scene.violenceProximityScore >= 58
      ? ["minimize profile / seek cover"]
      : []),
    ...(scene?.socialExposureScore != null && scene.socialExposureScore >= 62
      ? ["perform composure / manage visibility"]
      : []),
    ...(scene?.forcedStillness ? ["endure / wait"] : []),
    ...(bundle.worldEraContext && bundle.worldEraContext.knobs.relationalInterdependence >= 62
      ? ["appeal to kin or house obligation (risk-aware)"]
      : []),
  ]);

  let mostLikelyMove: string | null =
    regulation.freezeRisk === "acute"
      ? "shut down / go still"
      : relationalSafety.disclosureCost === "acute"
        ? "withhold"
        : relationalSafety.safePeople.length
          ? "disclose selectively"
          : "observe";

  if (scene?.forcedStillness && regulation.freezeRisk !== "acute") {
    mostLikelyMove = "endure / wait (movement constrained)";
  } else if (scene?.violenceProximityScore != null && scene.violenceProximityScore >= 68) {
    mostLikelyMove = "minimize profile / seek cover";
  }

  return {
    availableActions,
    forbiddenActions,
    speechBandwidth: bundle.pressure?.speechRestriction ?? "guarded",
    defianceCost: bundle.pressure?.defianceCost ?? "mixed",
    mostLikelyMove,
  };
}

export function assembleCharacterBrainState(bundle: CharacterBrainBundle): CharacterBrainState {
  const perception = buildPerception(bundle);
  const meaning = buildMeaning(bundle);
  const regulation = buildRegulation(bundle);
  const relationalSafety = buildRelationalSafety(bundle);
  const decision = buildDecision(bundle, regulation, relationalSafety);

  return {
    personId: bundle.personId,
    worldStateId: bundle.worldStateId,
    sceneId: bundle.sceneId ?? null,
    perception,
    meaning,
    regulation,
    relationalSafety,
    decision,
    assemblyNotes: unique([
      "Stage 7 derived assembly only: no persistence, no runner.",
      bundle.sceneId ? "Scene-aware bundle requested." : "World-state-only bundle requested.",
      bundle.sceneConstraintSummary
        ? "Scene constraint summary merged into perception + decision (signals, blocked actions, stillness)."
        : "No scene constraint layer (world-only or scene not loaded).",
      bundle.sourceSummary?.intelligenceLoaded ? "Loaded intelligence bundle." : "Intelligence bundle missing or partial.",
      bundle.sourceSummary?.pressureLoaded ? "Loaded pressure bundle." : "Pressure bundle missing or partial.",
      bundle.sourceSummary?.relationshipsLoaded ? "Loaded relationship bundle." : "Relationship bundle missing or partial.",
      bundle.sourceSummary?.continuityLoaded ? "Loaded continuity bundle." : "Continuity bundle missing or partial.",
      bundle.sourceSummary?.healthLoaded ? "Loaded health bundle." : "Health bundle missing or partial.",
      bundle.sourceSummary?.environmentLoaded ? "Loaded environment bundle." : "Environment bundle missing or partial.",
      bundle.sourceSummary?.eraProfileLoaded
        ? "Loaded world-state era profile (drivers / knobs / effective pressure mix when bundle exists)."
        : "World-state era profile missing (optional).",
      bundle.worldEraContext?.effectivePressureWeights
        ? "Era-tilted effective pressure weights applied to explanatory + danger framing."
        : null,
    ]),
  };
}

export function assembleCharacterSceneBrainState(bundle: CharacterBrainBundle): CharacterBrainState {
  return assembleCharacterBrainState(bundle);
}
