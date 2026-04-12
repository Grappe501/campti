import type { CounterpartContext, ScalarBand } from "@/lib/brain-assembly-types";
import type {
  RunnerTraceLine,
  SceneActionWindow,
  SceneSpeechWindow,
  SceneTimeBrainRunnerInput,
  SceneTimeBrainRunnerOutput,
} from "@/lib/scene-brain-runner-types";

function unique(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function bandRank(band: ScalarBand | null | undefined): number {
  switch (band) {
    case "none":
      return 0;
    case "very_low":
      return 1;
    case "low":
      return 2;
    case "guarded":
      return 3;
    case "mixed":
      return 4;
    case "present":
      return 5;
    case "high":
      return 6;
    case "acute":
      return 7;
    default:
      return 0;
  }
}

function firstOrFallback(items: string[], fallback: string): string {
  return items[0] ?? fallback;
}

function effectiveCounterpart(input: SceneTimeBrainRunnerInput): CounterpartContext | null {
  const ctx = input.bundle.counterpartContext ?? null;
  if (!ctx) return null;
  if (input.counterpartPersonId && input.counterpartPersonId !== ctx.counterpartPersonId) return null;
  return ctx;
}

function buildSalientSignals(input: SceneTimeBrainRunnerInput, ctx: CounterpartContext | null): string[] {
  const sceneSignals = input.sceneConstraints?.immediateSignals ?? [];
  const dangerSignals = input.brain.meaning.dangerFrame.slice(0, 3);
  const sensorySignals = input.brain.perception.sensoryBiases.slice(0, 2);
  const relationSignals = ctx
    ? unique([
        `counterpart in frame: ${ctx.displayName}`,
        ctx.dyad?.readsAsUnsafe ? `relational caution toward ${ctx.displayName}` : null,
        ctx.dyad?.readsAsSafe ? `possible safety with ${ctx.displayName}` : null,
        ...input.brain.relationalSafety.unsafePeople
          .filter((n) => n !== ctx.displayName)
          .slice(0, 2)
          .map((name) => `unsafe presence: ${name}`),
      ])
    : input.brain.relationalSafety.unsafePeople.slice(0, 2).map((name) => `unsafe presence: ${name}`);
  const taskSignal = input.sceneConstraints?.objective ? [`scene objective: ${input.sceneConstraints.objective}`] : [];

  return unique([...sceneSignals, ...dangerSignals, ...sensorySignals, ...relationSignals, ...taskSignal]).slice(0, 6);
}

function buildDominantInterpretation(
  input: SceneTimeBrainRunnerInput,
  salientSignals: string[],
  ctx: CounterpartContext | null,
): string {
  const firstDanger = input.brain.meaning.dangerFrame[0];
  const firstMisread = input.brain.perception.likelyMisreads[0];
  const objective = input.sceneConstraints?.objective;

  if (ctx) {
    const n = ctx.displayName;
    if (bandRank(input.brain.regulation.freezeRisk) >= 7) {
      return firstOrFallback(
        [firstDanger, firstMisread, `with ${n} present`, salientSignals[0]].filter(Boolean) as string[],
        `Immediate risk dominates interpretation while ${n} is in frame.`,
      );
    }
    const dyadDisc = input.brain.relationalSafety.dyadDisclosure;
    if (dyadDisc?.witnessSensitivity === "high" && dyadDisc.namingVsHinting === "naming_costly") {
      return firstOrFallback(
        [
          `Witness density and naming risk make implication the safer read with ${n} in frame.`,
          firstMisread,
          objective ? `Still threaded through: ${objective}.` : null,
        ].filter(Boolean) as string[],
        `Interpretation routes around overt naming; visibility prices confession with ${n} present.`,
      );
    }
    if (dyadDisc?.witnessSensitivity === "high") {
      return firstOrFallback(
        [
          `Who might witness or overhear competes with how close ${n} feels in this moment.`,
          firstMisread,
          objective ? `Objective still pulls: ${objective}.` : null,
        ].filter(Boolean) as string[],
        `Interpretation keeps circling audience and legibility while ${n} is in frame.`,
      );
    }
    if (ctx.dyad?.readsAsUnsafe) {
      return firstOrFallback(
        [
          `The exchange is read as high-stakes with ${n} watching.`,
          firstMisread,
          objective ? `Still threaded through: ${objective}.` : null,
        ].filter(Boolean) as string[],
        `Interpretation tilts toward danger and scrutiny involving ${n}.`,
      );
    }
    if (ctx.dyad?.readsAsSafe) {
      return firstOrFallback(
        [
          objective ? `Working toward ${objective} with ${n} as a plausible source of cover.` : null,
          `The moment softens toward ${n} as relatively safe compared with others.`,
          input.brain.meaning.hopeFrame[0],
        ].filter(Boolean) as string[],
        `Interpretation anchors partly on what ${n} might allow.`,
      );
    }
    return firstOrFallback(
      [
        `The moment is anchored on what ${n} is likely to mean right now.`,
        objective ? `Objective remains: ${objective}.` : null,
        firstMisread,
      ].filter(Boolean) as string[],
      `Interpretation is counterpart-specific rather than ambient.`,
    );
  }

  if (bandRank(input.brain.regulation.freezeRisk) >= 7) {
    return firstOrFallback(
      [firstDanger, firstMisread, salientSignals[0]].filter(Boolean) as string[],
      "Immediate risk dominates interpretation.",
    );
  }

  if (bandRank(input.brain.relationalSafety.disclosureCost) >= 6) {
    return firstOrFallback(
      [
        firstMisread,
        firstDanger ? `Speech feels dangerous because of ${firstDanger}.` : null,
        objective ? `The moment is read through the need to ${objective}.` : null,
      ].filter(Boolean) as string[],
      "The moment is interpreted through guarded self-protection.",
    );
  }

  return firstOrFallback(
    [
      objective ? `The moment is interpreted through the need to ${objective}.` : null,
      salientSignals[0],
      input.brain.meaning.explanatoryFrame[0],
      input.brain.meaning.hopeFrame[0] ? `Safety may be possible through ${input.brain.meaning.hopeFrame[0]}.` : null,
    ].filter(Boolean) as string[],
    "The moment is interpreted cautiously with partial situational awareness.",
  );
}

function deriveRegulationMode(input: SceneTimeBrainRunnerInput): SceneTimeBrainRunnerOutput["regulationMode"] {
  if (bandRank(input.brain.regulation.freezeRisk) >= 7 || input.sceneConstraints?.forcedStillness) {
    return "frozen";
  }

  if (bandRank(input.brain.regulation.floodRisk) >= 7) {
    return "flooded";
  }

  if (bandRank(input.brain.regulation.overloadRisk) >= 6 || bandRank(input.sceneConstraints?.violenceProximity) >= 6) {
    return "overloaded";
  }

  if (
    bandRank(input.brain.relationalSafety.disclosureCost) >= 4 ||
    bandRank(input.sceneConstraints?.socialExposure) >= 4 ||
    bandRank(input.brain.decision.speechBandwidth) <= 3
  ) {
    return "guarded";
  }

  return "stable";
}

function deriveSpeechWindow(input: SceneTimeBrainRunnerInput, ctx: CounterpartContext | null): SceneSpeechWindow {
  const disclosureRank = bandRank(input.brain.relationalSafety.disclosureCost);
  const speechRank = bandRank(input.brain.decision.speechBandwidth);
  const revealRank = bandRank(input.sceneConstraints?.revealBudget);
  const n = ctx?.displayName;

  const safeTopics = unique([
    ...(ctx?.dyad?.readsAsSafe && n ? [`honest signal with ${n} when the window opens`] : []),
    ...(n ? [`calibrate tone toward ${n}`] : []),
    ...input.brain.relationalSafety.safePeople.map((name) => `speak carefully with ${name}`),
    ...(input.sceneConstraints?.objective ? [`speak only toward objective: ${input.sceneConstraints.objective}`] : []),
    ...input.brain.regulation.likelySelfManagement.map((pattern) => `self-management script: ${pattern}`),
  ]).slice(0, 5);

  const unsafeTopics = unique([
    ...(ctx?.dyad?.readsAsUnsafe && n ? [`unfiltered disclosure to ${n}`] : []),
    ...input.brain.relationalSafety.unsafePeople.map((name) => `unguarded disclosure around ${name}`),
    ...input.brain.meaning.shameFrame.slice(0, 3),
    ...(input.sceneConstraints?.pressureTags ?? []).map((tag) => `pressure-tagged speech: ${tag}`),
  ]).slice(0, 5);

  const dyadDisc = input.brain.relationalSafety.dyadDisclosure;
  const blockers = unique([
    ...(n && ctx?.dyad?.readsAsUnsafe ? [`${n} feels high-stakes`] : []),
    ...(dyadDisc?.witnessSensitivity === "high"
      ? ["dyad: witness-sensitive — public legibility is costly"]
      : dyadDisc?.witnessSensitivity === "moderate"
        ? ["dyad: moderate witness pressure on plain speech"]
        : []),
    ...(dyadDisc?.namingVsHinting === "naming_costly" ? ["dyad: direct naming is relationally expensive"] : []),
    ...(dyadDisc?.namingVsHinting === "hint_favored" ? ["dyad: implication channel favored over plain naming"] : []),
    ...(dyadDisc?.reciprocityExpectation === "high"
      ? ["dyad: reciprocity expectation tightens what can be offered safely"]
      : []),
    disclosureRank >= 6 ? "disclosure cost is high" : null,
    revealRank >= 6 ? "scene reveal budget is tight" : null,
    speechRank <= 2 ? "speech bandwidth is very narrow" : null,
    input.sceneConstraints?.forcedStillness ? "forced stillness in scene" : null,
  ]);

  const canSpeak = !(speechRank <= 1 || input.sceneConstraints?.forcedStillness);

  let style: SceneSpeechWindow["style"] = "open";
  if (!canSpeak) style = "silent";
  else if (disclosureRank >= 6 || revealRank >= 6) style = "guarded";
  else if (input.brain.relationalSafety.safePeople.length > 0) style = "selective";

  return {
    canSpeak,
    style,
    safeTopics,
    unsafeTopics,
    blockers,
  };
}

function deriveActionWindow(
  input: SceneTimeBrainRunnerInput,
  regulationMode: SceneTimeBrainRunnerOutput["regulationMode"],
  ctx: CounterpartContext | null,
): SceneActionWindow {
  const blocked = unique([
    ...input.brain.decision.forbiddenActions,
    ...(input.sceneConstraints?.blockedActions ?? []),
    input.sceneConstraints?.forcedStillness ? "leave or move quickly" : null,
  ]);

  const costly = unique([
    bandRank(input.brain.decision.defianceCost) >= 6 ? "open defiance" : null,
    bandRank(input.sceneConstraints?.socialExposure) >= 6 ? "public contradiction" : null,
    bandRank(input.sceneConstraints?.violenceProximity) >= 6 ? "sudden escalation" : null,
    ...input.brain.meaning.dangerFrame.slice(0, 2).map((danger) => `action under danger: ${danger}`),
  ]);

  const available = unique([
    ...input.brain.decision.availableActions,
    ...(regulationMode === "frozen" ? ["go still"] : []),
    ...(regulationMode === "guarded" ? ["speak narrowly"] : []),
    ...(input.sceneConstraints?.objective ? [`move toward objective: ${input.sceneConstraints.objective}`] : []),
  ]).filter((item) => !blocked.includes(item));

  const safestAction =
    available.find((item) => !costly.includes(item) && !/disclose|defiance|contradiction|escalation/i.test(item)) ??
    available[0] ??
    null;

  const highestRiskTemptingAction =
    available.find((item) => /disclose|defiance|contradiction|escalation/i.test(item)) ??
    costly[0] ??
    null;

  const mostLikelyAction =
    regulationMode === "frozen"
      ? "go still"
      : available.includes("withhold")
        ? "withhold"
        : available.includes("disclose selectively")
          ? "disclose selectively"
          : safestAction;

  const baseNotes = unique([
    safestAction ? `Safest action favors ${safestAction}.` : null,
    mostLikelyAction && mostLikelyAction !== safestAction ? `Most likely action diverges toward ${mostLikelyAction}.` : null,
    highestRiskTemptingAction ? `Risk temptation remains around ${highestRiskTemptingAction}.` : null,
    ctx
      ? mostLikelyAction && safestAction && mostLikelyAction !== safestAction
        ? `Counterpart ${ctx.displayName} sits in the pull between self-protection and visible move choice.`
        : `Counterpart ${ctx.displayName} is in the background of this choice.`
      : null,
  ]);

  return {
    available,
    blocked,
    costly,
    ranked: {
      safestAction,
      mostLikelyAction,
      highestRiskTemptingAction,
      tensionNotes: baseNotes,
    },
  };
}

function derivePrimaryFear(input: SceneTimeBrainRunnerInput, ctx: CounterpartContext | null): string {
  if (ctx?.dyad?.readsAsUnsafe) {
    return firstOrFallback(
      [
        `being seen badly by ${ctx.displayName}`,
        input.brain.meaning.shameFrame[0],
        input.brain.meaning.dangerFrame[0],
      ].filter(Boolean) as string[],
      `Loss of standing with ${ctx.displayName}.`,
    );
  }
  if (ctx && bandRank(input.brain.relationalSafety.disclosureCost) >= 6) {
    return firstOrFallback(
      [`costly honesty toward ${ctx.displayName}`, input.brain.meaning.shameFrame[0], input.brain.meaning.dangerFrame[0]].filter(
        Boolean,
      ) as string[],
      "Loss of safety or control.",
    );
  }
  return firstOrFallback(
    [
      input.brain.meaning.dangerFrame[0],
      input.brain.relationalSafety.unsafePeople[0] ? `unsafe person: ${input.brain.relationalSafety.unsafePeople[0]}` : null,
      input.brain.meaning.shameFrame[0],
      input.sceneConstraints?.pressureTags?.[0] ? `scene pressure: ${input.sceneConstraints.pressureTags[0]}` : null,
    ].filter(Boolean) as string[],
    "Loss of safety or control.",
  );
}

function chooseMostLikelyMove(
  input: SceneTimeBrainRunnerInput,
  regulationMode: SceneTimeBrainRunnerOutput["regulationMode"],
  speechWindow: SceneSpeechWindow,
  actionWindow: SceneActionWindow,
): string | null {
  if (regulationMode === "frozen") return "go still";
  if (!speechWindow.canSpeak) return input.brain.decision.mostLikelyMove ?? actionWindow.ranked.mostLikelyAction ?? "withhold";
  if (speechWindow.style === "guarded") return "withhold";
  if (speechWindow.style === "selective") return "disclose selectively";
  return actionWindow.ranked.mostLikelyAction ?? actionWindow.available[0] ?? input.brain.decision.mostLikelyMove;
}

function buildCounterpartTraceLines(
  input: SceneTimeBrainRunnerInput,
  ctx: CounterpartContext,
  speechWindow: SceneSpeechWindow,
): RunnerTraceLine[] {
  const name = ctx.displayName;
  const d = ctx.dyad;
  const socialR = bandRank(input.sceneConstraints?.socialExposure);
  const discR = bandRank(input.brain.relationalSafety.disclosureCost);
  const maskR = bandRank(input.brain.relationalSafety.likelyMaskingNeed);

  return [
    {
      label: "watched_by_counterpart",
      summary:
        socialR >= 5
          ? `${name}'s presence reads as highly visible; being seen is part of the threat model.`
          : `Attention keeps tracking what ${name} might notice or infer in real time.`,
      drivers: unique([
        d ? `dyad fear ${d.fearLevel}, trust ${d.trustLevel}` : "no dyad row — inferring from scene + global relational bands",
        socialR >= 4 ? `social exposure: ${input.sceneConstraints?.socialExposure}` : null,
      ]),
    },
    {
      label: "safety_from_counterpart",
      summary: d?.readsAsSafe
        ? `${name} is treated as one of the few plausible sources of cover in this exchange.`
        : `${name} is not leaned on as a safe harbor in this read.`,
      drivers: unique([
        d ? `trust ${d.trustLevel}, fear ${d.fearLevel}` : "dyad absent — safety not numerically pinned",
        input.brain.relationalSafety.safePeople.includes(name) ? "listed among safe people" : null,
      ]),
    },
    {
      label: "judgment_from_counterpart",
      summary: d?.readsAsUnsafe
        ? `Fear of judgment or leverage from ${name} tightens self-monitoring.`
        : `Judgment risk from ${name} reads as moderate rather than acute.`,
      drivers: unique([
        d ? `shame leverage ${d.shameLeverage}, fear ${d.fearLevel}` : null,
        input.brain.meaning.shameFrame[0] ?? null,
      ]),
    },
    {
      label: "disclose_pull_counterpart",
      summary:
        d?.readsAsSafe && discR >= 5
          ? `Want toward honest disclosure to ${name} fights disclosure cost and scene budget.`
          : d?.readsAsUnsafe
            ? `Honest disclosure toward ${name} feels costly or dangerous.`
            : `Disclosure toward ${name} is moderated by scene stakes and bandwidth.`,
      drivers: unique([
        `disclosure cost: ${input.brain.relationalSafety.disclosureCost}`,
        input.brain.relationalSafety.dyadDisclosure
          ? `dyad disclosure: witness ${input.brain.relationalSafety.dyadDisclosure.witnessSensitivity}, naming ${input.brain.relationalSafety.dyadDisclosure.namingVsHinting}, reciprocity ${input.brain.relationalSafety.dyadDisclosure.reciprocityExpectation}`
          : null,
        `speech style: ${speechWindow.style}`,
      ]),
    },
    {
      label: "mask_from_counterpart",
      summary:
        maskR >= 5 || d?.readsAsUnsafe
          ? `Need to manage impression or conceal vulnerability in front of ${name}.`
          : `Masking toward ${name} is present but not extreme.`,
      drivers: unique([
        maskR >= 4 ? `masking need: ${input.brain.relationalSafety.likelyMaskingNeed}` : null,
        d ? `dyad reads unsafe: ${d.readsAsUnsafe}` : null,
      ]),
    },
  ];
}

function buildRunnerTrace(
  input: SceneTimeBrainRunnerInput,
  salientSignals: string[],
  dominantInterpretation: string,
  regulationMode: SceneTimeBrainRunnerOutput["regulationMode"],
  speechWindow: SceneSpeechWindow,
  actionWindow: SceneActionWindow,
  ctx: CounterpartContext | null,
): RunnerTraceLine[] {
  const core: RunnerTraceLine[] = [
    {
      label: "salience",
      summary: `Attention narrows around ${firstOrFallback(salientSignals, "limited cues")}.`,
      drivers: unique([
        ...(input.sceneConstraints?.immediateSignals ?? []).slice(0, 2),
        input.brain.meaning.dangerFrame[0],
        ctx
          ? `counterpart: ${ctx.displayName}`
          : input.brain.relationalSafety.unsafePeople[0]
            ? `unsafe presence: ${input.brain.relationalSafety.unsafePeople[0]}`
            : null,
      ]),
    },
    {
      label: "interpretation",
      summary: dominantInterpretation,
      drivers: unique([
        input.brain.perception.likelyMisreads[0],
        input.brain.meaning.explanatoryFrame[0],
        input.sceneConstraints?.objective ? `objective: ${input.sceneConstraints.objective}` : null,
      ]),
    },
    {
      label: "regulation",
      summary: `Regulation resolves as ${regulationMode}.`,
      drivers: unique([
        bandRank(input.brain.regulation.freezeRisk) >= 6 ? `freeze risk: ${input.brain.regulation.freezeRisk}` : null,
        bandRank(input.brain.regulation.floodRisk) >= 6 ? `flood risk: ${input.brain.regulation.floodRisk}` : null,
        bandRank(input.brain.regulation.overloadRisk) >= 5 ? `overload risk: ${input.brain.regulation.overloadRisk}` : null,
        input.sceneConstraints?.forcedStillness ? "forced stillness" : null,
        bandRank(input.sceneConstraints?.violenceProximity) >= 5 ? `violence proximity: ${input.sceneConstraints?.violenceProximity}` : null,
      ]),
    },
    {
      label: "speech",
      summary: speechWindow.canSpeak ? `Speech remains ${speechWindow.style}.` : "Speech collapses toward silence.",
      drivers: unique([
        bandRank(input.brain.relationalSafety.disclosureCost) >= 5
          ? `disclosure cost: ${input.brain.relationalSafety.disclosureCost}`
          : null,
        bandRank(input.sceneConstraints?.revealBudget) >= 5 ? `reveal budget: ${input.sceneConstraints?.revealBudget}` : null,
        bandRank(input.brain.decision.speechBandwidth) <= 3 ? `speech bandwidth: ${input.brain.decision.speechBandwidth}` : null,
        ...speechWindow.blockers.slice(0, 2),
      ]),
    },
    {
      label: "action",
      summary: `Action window centers on ${actionWindow.ranked.mostLikelyAction ?? "no clear move"}.`,
      drivers: unique([
        actionWindow.ranked.safestAction ? `safest: ${actionWindow.ranked.safestAction}` : null,
        actionWindow.ranked.highestRiskTemptingAction ? `tempting risk: ${actionWindow.ranked.highestRiskTemptingAction}` : null,
        ...actionWindow.blocked.slice(0, 2),
      ]),
    },
    {
      label: "tension",
      summary:
        actionWindow.ranked.safestAction && actionWindow.ranked.highestRiskTemptingAction
          ? `Inner tension splits between ${actionWindow.ranked.safestAction} and ${actionWindow.ranked.highestRiskTemptingAction}.`
          : "Action tension remains limited in this moment.",
      drivers: actionWindow.ranked.tensionNotes,
    },
  ];

  return ctx ? [...core, ...buildCounterpartTraceLines(input, ctx, speechWindow)] : core;
}

function buildRunnerNotes(
  input: SceneTimeBrainRunnerInput,
  regulationMode: SceneTimeBrainRunnerOutput["regulationMode"],
  ctx: CounterpartContext | null,
): string[] {
  return unique([
    "Stage 7.5b derived runner only: no persistence, no prose, no branching loop.",
    input.sceneId ? "Scene-linked evaluation executed." : "No sceneId supplied; runner used broad immediate cues only.",
    `Regulation mode resolved as ${regulationMode}.`,
    input.sceneConstraints?.objective ? `Objective in scope: ${input.sceneConstraints.objective}.` : null,
    input.sceneConstraints?.forcedStillness ? "Forced stillness modified action and speech windows." : null,
    ctx
      ? `Counterpart focus: ${ctx.displayName}${ctx.dyad ? " (dyad loaded)" : " (name only, no dyad row)"}${
          ctx.resolutionSource ? ` [${ctx.resolutionSource}]` : ""
        }.`
      : null,
  ]);
}

export function runSceneTimeBrain(input: SceneTimeBrainRunnerInput): SceneTimeBrainRunnerOutput {
  const ctx = effectiveCounterpart(input);
  const salientSignals = buildSalientSignals(input, ctx);
  const dominantInterpretation = buildDominantInterpretation(input, salientSignals, ctx);
  const regulationMode = deriveRegulationMode(input);
  const speechWindow = deriveSpeechWindow(input, ctx);
  const actionWindow = deriveActionWindow(input, regulationMode, ctx);
  const primaryFear = derivePrimaryFear(input, ctx);
  const mostLikelyMove = chooseMostLikelyMove(input, regulationMode, speechWindow, actionWindow);
  const runnerTrace = buildRunnerTrace(
    input,
    salientSignals,
    dominantInterpretation,
    regulationMode,
    speechWindow,
    actionWindow,
    ctx,
  );
  const runnerNotes = buildRunnerNotes(input, regulationMode, ctx);

  return {
    personId: input.personId,
    worldStateId: input.worldStateId,
    sceneId: input.sceneId ?? null,
    counterpartSummary: ctx
      ? {
          counterpartPersonId: ctx.counterpartPersonId,
          displayName: ctx.displayName,
          dyadLoaded: Boolean(ctx.dyad),
          resolutionSource: ctx.resolutionSource,
        }
      : null,
    salientSignals,
    dominantInterpretation,
    regulationMode,
    speechWindow,
    actionWindow,
    mostLikelyMove,
    primaryFear,
    runnerTrace,
    runnerNotes,
  };
}
