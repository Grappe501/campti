import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type { DecisionPressureBreakdown, DecisionTraceResponse } from "@/lib/domain/decision-trace";
import type { CharacterInnerVoiceResponse } from "@/lib/domain/inner-voice";
import {
  SIMULATION_RUN_CONTRACT_VERSION,
  type SimulationComparisonSummary,
  type SimulationDiff,
  type SimulationPressureDelta,
} from "@/lib/domain/simulation-run";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j]! + 1,
        dp[j - 1]! + 1,
        prev + cost
      );
      prev = tmp;
    }
  }
  return dp[n]!;
}

function textChangeBucket(a: string, b: string): "none" | "light" | "heavy" {
  const aa = a.trim();
  const bb = b.trim();
  if (aa === bb) return "none";
  const max = Math.max(aa.length, bb.length, 1);
  const r = levenshtein(aa, bb) / max;
  if (r < 0.08) return "none";
  if (r < 0.38) return "light";
  return "heavy";
}

export function comparePressureBreakdownPair(
  left: DecisionPressureBreakdown,
  right: DecisionPressureBreakdown
): Pick<
  SimulationDiff["pressures"],
  | "motiveActiveOrderChanged"
  | "motiveActiveDeltas"
  | "fearDriverDeltas"
  | "triggerPressureDeltas"
> {
  return {
    motiveActiveOrderChanged: motiveOrderChanged(left.motiveActive, right.motiveActive),
    motiveActiveDeltas: deltaList(left.motiveActive, right.motiveActive),
    fearDriverDeltas: deltaList(left.fearDrivers, right.fearDrivers),
    triggerPressureDeltas: deltaList(left.triggerPressures ?? [], right.triggerPressures ?? []),
  };
}

function deltaList(
  prior: { label: string; weight: number }[],
  next: { label: string; weight: number }[]
): SimulationPressureDelta[] {
  const map = new Map<string, { prior: number; next: number }>();
  for (const p of prior) {
    map.set(p.label, { prior: p.weight, next: p.weight });
  }
  for (const n of next) {
    const cur = map.get(n.label);
    if (cur) {
      cur.next = n.weight;
    } else {
      map.set(n.label, { prior: 0, next: n.weight });
    }
  }
  for (const p of prior) {
    if (!next.some((x) => x.label === p.label)) {
      map.set(p.label, { prior: p.weight, next: 0 });
    }
  }
  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      priorWeight: v.prior,
      nextWeight: v.next,
    }))
    .filter((x) => x.priorWeight !== x.nextWeight)
    .slice(0, 24);
}

function motiveOrderChanged(
  a: { label: string }[],
  b: { label: string }[]
): boolean {
  const la = a.map((x) => x.label).join("\0");
  const lb = b.map((x) => x.label).join("\0");
  return la !== lb;
}

function symmetricActiveMotiveDelta(prior: string[], next: string[]): string[] {
  const ps = new Set(prior);
  const ns = new Set(next);
  const out: string[] = [];
  for (const x of prior) {
    if (!ns.has(x)) out.push(`− ${x.slice(0, 120)}`);
  }
  for (const x of next) {
    if (!ps.has(x)) out.push(`+ ${x.slice(0, 120)}`);
  }
  return out.slice(0, 20);
}

export function buildSimulationDiff(input: {
  baseFrame: CharacterCognitionFrame;
  nextFrame: CharacterCognitionFrame;
  pressureBase: DecisionPressureBreakdown;
  pressureNext: DecisionPressureBreakdown;
  decisionBase?: DecisionTraceResponse | null;
  decisionNext?: DecisionTraceResponse | null;
  innerVoiceBase?: CharacterInnerVoiceResponse | null;
  innerVoiceNext?: CharacterInnerVoiceResponse | null;
}): SimulationDiff {
  const bf = input.baseFrame;
  const nf = input.nextFrame;

  const fearPrior = bf.fearStack[0]?.label ?? null;
  const fearNext = nf.fearStack[0]?.label ?? null;
  const obPrior = bf.obligationStack[0]?.label ?? null;
  const obNext = nf.obligationStack[0]?.label ?? null;

  const embKeys: string[] = [];
  const embScalars: Record<string, { prior: number; next: number }> = {};
  const pairs: [keyof typeof bf.characterPhysicalState, string][] = [
    ["fatigueLevel", "fatigueLevel"],
    ["painLevel", "painLevel"],
    ["hungerLevel", "hungerLevel"],
    ["illnessLevel", "illnessLevel"],
    ["sensoryDisruptionLevel", "sensoryDisruptionLevel"],
  ];
  for (const [k, name] of pairs) {
    const p = bf.characterPhysicalState[k] as number;
    const n = nf.characterPhysicalState[k] as number;
    if (p !== n) {
      embKeys.push(name);
      embScalars[name] = { prior: p, next: n };
    }
  }

  const visPrior = bf.worldDesireEnvironment.visibilityRiskForDesire;
  const visNext = nf.worldDesireEnvironment.visibilityRiskForDesire;
  const punPrior = bf.worldDesireEnvironment.punishmentSeverityForForbiddenDesire;
  const punNext = nf.worldDesireEnvironment.punishmentSeverityForForbiddenDesire;
  const tabPrior = bf.worldDesireEnvironment.eroticTabooSeverity;
  const tabNext = nf.worldDesireEnvironment.eroticTabooSeverity;

  let decisionTrace: SimulationDiff["decisionTrace"] = null;
  if (input.decisionBase || input.decisionNext) {
    const db = input.decisionBase;
    const dn = input.decisionNext;
    decisionTrace = {
      statedMotiveChanged: (db?.statedMotive ?? "") !== (dn?.statedMotive ?? ""),
      underlyingMotiveChanged: (db?.underlyingMotive ?? "") !== (dn?.underlyingMotive ?? ""),
      whyThisWonLevenshteinBucket: textChangeBucket(
        db?.whyThisWon ?? "",
        dn?.whyThisWon ?? ""
      ),
      selectedActionLabelChanged: (db?.selectedAction ?? "") !== (dn?.selectedAction ?? ""),
      contradictionSummaryBucket: textChangeBucket(
        db?.contradictionSummary ?? "",
        dn?.contradictionSummary ?? ""
      ),
      triggerPressureDeltasFromTrace: deltaList(
        db?.triggerPressures ?? [],
        dn?.triggerPressures ?? []
      ),
    };
  }

  let innerVoice: SimulationDiff["innerVoice"] = null;
  if (input.innerVoiceBase || input.innerVoiceNext) {
    const ib = input.innerVoiceBase;
    const ine = input.innerVoiceNext;
    const textureNotes: string[] = [];
    if ((ib?.contradiction ?? "").trim() !== (ine?.contradiction ?? "").trim()) {
      textureNotes.push("contradiction framing shifted");
    }
    if ((ib?.surfaceThought ?? "").trim() !== (ine?.surfaceThought ?? "").trim()) {
      textureNotes.push("surface thought texture shifted");
    }
    innerVoice = {
      modeContractChanged: false,
      textureSummaryShift: textureNotes,
    };
  }

  return {
    contractVersion: SIMULATION_RUN_CONTRACT_VERSION,
    cognition: {
      fearStackHeadlineShift: { prior: fearPrior, next: fearNext },
      obligationHeadlineShift: { prior: obPrior, next: obNext },
      identityConflictChanged: bf.identityConflict.trim() !== nf.identityConflict.trim(),
      activeMotiveAddedOrRemoved: symmetricActiveMotiveDelta(
        bf.activeMotives,
        nf.activeMotives
      ),
    },
    pressures: {
      motiveActiveOrderChanged: motiveOrderChanged(
        input.pressureBase.motiveActive,
        input.pressureNext.motiveActive
      ),
      motiveActiveDeltas: deltaList(
        input.pressureBase.motiveActive,
        input.pressureNext.motiveActive
      ),
      fearDriverDeltas: deltaList(
        input.pressureBase.fearDrivers,
        input.pressureNext.fearDrivers
      ),
      triggerPressureDeltas: deltaList(
        input.pressureBase.triggerPressures ?? [],
        input.pressureNext.triggerPressures ?? []
      ),
    },
    embodiment: {
      changedKeys: embKeys,
      scalars: embScalars,
    },
    desireWorld: {
      visibilityRiskDelta: visPrior !== visNext ? visNext - visPrior : null,
      punishmentDelta: punPrior !== punNext ? punNext - punPrior : null,
      tabooDelta: tabPrior !== tabNext ? tabNext - tabPrior : null,
    },
    decisionTrace,
    innerVoice,
  };
}

export function buildSimulationComparisonSummary(
  diff: SimulationDiff,
  effectiveOverrideKeys: string[]
): SimulationComparisonSummary {
  const bulletWhyShifted: string[] = [];
  if (diff.cognition.fearStackHeadlineShift.prior !== diff.cognition.fearStackHeadlineShift.next) {
    bulletWhyShifted.push("Top fear pressure headline moved between base and rerun.");
  }
  if (diff.pressures.motiveActiveOrderChanged) {
    bulletWhyShifted.push("Ranked motive pressures re-ordered.");
  }
  if (diff.pressures.triggerPressureDeltas.length > 0) {
    bulletWhyShifted.push("Scene-time trigger pressures shifted (deterministic breakdown).");
  }
  if (diff.desireWorld.visibilityRiskDelta != null && diff.desireWorld.visibilityRiskDelta !== 0) {
    bulletWhyShifted.push("World visibility risk for desire shifted.");
  }
  if (diff.embodiment.changedKeys.length > 0) {
    bulletWhyShifted.push(`Embodiment load changed: ${diff.embodiment.changedKeys.join(", ")}.`);
  }
  if (diff.decisionTrace?.whyThisWonLevenshteinBucket === "heavy") {
    bulletWhyShifted.push("Decision trace \"why this won\" narrative moved substantially.");
  }
  if (diff.decisionTrace && diff.decisionTrace.triggerPressureDeltasFromTrace.length > 0) {
    bulletWhyShifted.push("Authoring decision-trace trigger pressure lines shifted (LLM layer).");
  }
  if (diff.decisionTrace?.contradictionSummaryBucket === "heavy") {
    bulletWhyShifted.push("Contradiction summary in decision trace moved substantially.");
  }

  const dominantOverrideEffects = effectiveOverrideKeys.slice(0, 12).map((k) => {
    if (k.startsWith("embodiment.")) return `${k} → embodiment / urgency`;
    if (k.startsWith("world.") || k.startsWith("snapshot.")) return `${k} → fear / obligation stacks`;
    if (k.startsWith("attachment.")) return `${k} → desire shaping`;
    if (k.startsWith("relationship.")) return `${k} → relationship context overlay`;
    return `${k} → cognition context`;
  });

  return {
    headline: "Exploratory rerun: compare diff blocks for what moved; canonical scene data unchanged.",
    bulletWhyShifted,
    dominantOverrideEffects,
  };
}
