/**
 * Phase 3 / Chunk 3 — Narrative Pressure Engine (bounded, deterministic).
 *
 * Pressure is an influence system only:
 * - no direct event forcing
 * - no author override path
 * - no branch governance logic
 * - no prose generation
 */
import type { ChapterFunction } from "@/lib/domain/chapter-movement-progression";
import type { ArcLifecycleState, ArcType } from "@/lib/domain/narrative-arc";
import {
  NARRATIVE_PRESSURE_CONTRACT_VERSION,
  type NarrativePressure,
  type NarrativePressureCategory,
  type NarrativePressureExpressionMode,
  type NarrativePressureInfluenceHint,
  type NarrativePressureInput,
  type NarrativePressureOutputSurface,
  type NarrativePressureSourceAuthority,
  type NarrativePressureSourceSignal,
  type NarrativePressureTargetScope,
} from "@/lib/domain/narrative-pressure";
import { assertMemoryBoundary, type NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

type CategoryAccumulator = {
  category: NarrativePressureCategory;
  sources: NarrativePressureSourceSignal[];
  blockedConditions: string[];
  reinforcingConditions: string[];
};

const CATEGORY_TARGET_SCOPE: Record<NarrativePressureCategory, NarrativePressureTargetScope> = {
  disclosure: "response_tendency_weighting",
  conflict: "tension_emphasis",
  intimacy: "response_tendency_weighting",
  separation: "opportunity_surfacing",
  scarcity: "scene_candidate_weighting",
  authority: "scene_candidate_weighting",
  shame: "memory_activation_weighting",
  grief: "memory_activation_weighting",
  obligation: "scene_candidate_weighting",
  spiritual: "opportunity_surfacing",
  escape: "opportunity_surfacing",
  reconciliation: "response_tendency_weighting",
};

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampInfluence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-20, Math.min(20, Math.round(value)));
}

function categorySet(...values: NarrativePressureCategory[]): Set<NarrativePressureCategory> {
  return new Set(values);
}

function categoriesForArcType(type: ArcType): Set<NarrativePressureCategory> {
  switch (type) {
    case "marriage_fracture":
      return categorySet("conflict", "separation", "shame", "reconciliation");
    case "forbidden_courtship":
      return categorySet("intimacy", "authority", "disclosure", "conflict");
    case "inheritance_struggle":
      return categorySet("obligation", "authority", "conflict", "scarcity");
    case "family_survival":
      return categorySet("scarcity", "obligation", "conflict");
    case "spiritual_crisis":
      return categorySet("spiritual", "grief", "reconciliation");
    case "revenge_justice":
      return categorySet("conflict", "authority", "shame");
    case "reconciliation_attempt":
      return categorySet("reconciliation", "intimacy", "disclosure");
    case "political_survival":
      return categorySet("authority", "scarcity", "escape");
    case "displacement":
      return categorySet("separation", "escape", "scarcity", "grief");
    case "succession":
      return categorySet("authority", "obligation", "conflict");
  }
}

function arcLifecycleFactor(state: ArcLifecycleState): number {
  switch (state) {
    case "active":
      return 1;
    case "escalating":
      return 1.2;
    case "crisis":
      return 1.35;
    case "turning":
      return 1.15;
    case "resolving":
      return 0.85;
    case "resolved":
      return 0.55;
    case "transformed":
      return 0.45;
    case "seeded":
      return 0.7;
    case "dormant":
    case "failed":
      return 0.25;
  }
}

function categoriesForChapterFunction(fn: ChapterFunction): Set<NarrativePressureCategory> {
  switch (fn) {
    case "setup":
      return categorySet("obligation", "authority");
    case "deepening":
      return categorySet("intimacy", "disclosure");
    case "fracture":
      return categorySet("conflict", "separation", "shame");
    case "convergence":
      return categorySet("authority", "obligation", "conflict");
    case "revelation":
      return categorySet("disclosure", "shame", "grief");
    case "reversal":
      return categorySet("conflict", "escape", "authority");
    case "aftermath":
      return categorySet("grief", "obligation", "reconciliation");
    case "pursuit":
      return categorySet("escape", "conflict", "scarcity");
    case "threshold":
      return categorySet("obligation", "authority", "spiritual");
    case "loss":
      return categorySet("grief", "separation", "scarcity");
    case "recommitment":
      return categorySet("reconciliation", "obligation", "intimacy");
  }
}

function severityContribution(severity: "low" | "moderate" | "high"): number {
  if (severity === "high") return 18;
  if (severity === "moderate") return 11;
  return 6;
}

function authorityRank(authority: NarrativePressureSourceAuthority): number {
  switch (authority) {
    case "structural_arc":
      return 5;
    case "structural_chapter":
      return 4;
    case "structural_world":
      return 3;
    case "structural_consequence":
      return 2;
    case "shaping_default_bounded":
      return 1;
  }
}

function expressionModesForIntensity(intensity: number): NarrativePressureExpressionMode[] {
  if (intensity >= 65) return ["weight_bias", "emphasis_bias", "surface_opportunity_bias"];
  if (intensity >= 35) return ["weight_bias", "emphasis_bias"];
  return ["weight_bias"];
}

function defaultDecay(): NarrativePressure["decayBehavior"] {
  return {
    mode: "per_scene_step",
    decayPerStep: 8,
    floorIntensity: 0,
  };
}

function addSource(
  bucket: Map<NarrativePressureCategory, CategoryAccumulator>,
  input: {
    category: NarrativePressureCategory;
    source: NarrativePressureSourceSignal;
  }
): void {
  const existing =
    bucket.get(input.category) ??
    ({
      category: input.category,
      sources: [],
      blockedConditions: [],
      reinforcingConditions: [],
    } satisfies CategoryAccumulator);
  existing.sources.push(input.source);
  bucket.set(input.category, existing);
}

function blockedByCategoryGlobalRule(category: NarrativePressureCategory, blockedConditionCodes: string[]): boolean {
  return blockedConditionCodes.includes(`block_${category}`);
}

function applyDecayIntensity(input: {
  rawIntensity: number;
  prior: NarrativePressure | undefined;
  stepDelta: number;
}): number {
  if (input.rawIntensity > 0) return clamp0to100(input.rawIntensity);
  if (!input.prior) return 0;
  const decayed = input.prior.intensity - input.prior.decayBehavior.decayPerStep * input.stepDelta;
  return clamp0to100(Math.max(input.prior.decayBehavior.floorIntensity, decayed));
}

function influenceHintForPressure(pressure: NarrativePressure): NarrativePressureInfluenceHint {
  const base = Math.round((pressure.intensity / 100) * 20);
  const blockedPenalty = pressure.blockedConditions.length > 0 ? 0.55 : 1;
  const adjusted = clampInfluence(base * blockedPenalty);
  const sceneCandidateWeightDelta =
    pressure.targetScope === "scene_candidate_weighting" ? adjusted : Math.round(adjusted * 0.4);
  const responseTendencyWeightDelta =
    pressure.targetScope === "response_tendency_weighting" ? adjusted : Math.round(adjusted * 0.35);
  const tensionEmphasisWeightDelta =
    pressure.targetScope === "tension_emphasis" ? adjusted : Math.round(adjusted * 0.5);
  const memoryActivationWeightDelta =
    pressure.targetScope === "memory_activation_weighting" ? adjusted : Math.round(adjusted * 0.3);
  const opportunitySurfaceWeightDelta =
    pressure.targetScope === "opportunity_surfacing" ? adjusted : Math.round(adjusted * 0.35);

  return {
    category: pressure.category,
    sceneCandidateWeightDelta,
    responseTendencyWeightDelta,
    tensionEmphasisWeightDelta,
    memoryActivationWeightDelta,
    opportunitySurfaceWeightDelta,
    forceOverride: false,
  };
}

export function evaluateNarrativePressure(input: {
  pressureInput: NarrativePressureInput;
  evaluatedAtIso: string;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): NarrativePressureOutputSurface {
  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "character_bounded_knowledge";
  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      chapterFunction: input.pressureInput.chapterFunction,
      worldStatePressure: input.pressureInput.worldStatePressure,
      arcCount: input.pressureInput.activeArcs.length,
      unresolvedConsequenceCount: input.pressureInput.unresolvedConsequences.length,
    },
  });

  const stepDelta = Math.max(1, Math.round(input.pressureInput.stepDelta ?? 1));
  const blockedCodes = input.pressureInput.blockedConditionCodes ?? [];
  const priorByCategory = new Map<NarrativePressureCategory, NarrativePressure>();
  for (const prior of input.pressureInput.priorPressures ?? []) {
    priorByCategory.set(prior.category, prior);
  }

  const bucket = new Map<NarrativePressureCategory, CategoryAccumulator>();

  for (const arc of input.pressureInput.activeArcs) {
    const categories = categoriesForArcType(arc.arcType);
    const contribution = Math.round((clamp0to100(arc.tensionLevel) / 100) * 22 * arcLifecycleFactor(arc.lifecycleState));
    for (const category of categories) {
      addSource(bucket, {
        category,
        source: {
          sourceKind: "active_arc",
          sourceId: arc.arcId,
          authority: "structural_arc",
          contribution,
        },
      });
    }
  }

  for (const category of categoriesForChapterFunction(input.pressureInput.chapterFunction)) {
    addSource(bucket, {
      category,
      source: {
        sourceKind: "chapter_function",
        sourceId: input.pressureInput.chapterFunction,
        authority: "structural_chapter",
        contribution: 14,
      },
    });
  }

  const worldPressureContribution = Math.round((clamp0to100(input.pressureInput.worldStatePressure) / 100) * 18);
  for (const category of ["scarcity", "authority", "escape"] as NarrativePressureCategory[]) {
    addSource(bucket, {
      category,
      source: {
        sourceKind: "world_state_pressure",
        sourceId: "world-state",
        authority: "structural_world",
        contribution: worldPressureContribution,
      },
    });
  }

  for (const consequence of input.pressureInput.unresolvedConsequences) {
    if (!["active", "latent", "decaying"].includes(consequence.lifecycleState)) continue;
    const contribution = severityContribution(consequence.severity);
    const category: NarrativePressureCategory =
      consequence.category === "spiritual"
        ? "spiritual"
        : consequence.category === "social" || consequence.category === "reputational"
          ? "shame"
          : consequence.category === "bodily"
            ? "grief"
            : consequence.category === "material" || consequence.category === "household_economic"
              ? "scarcity"
              : "conflict";
    addSource(bucket, {
      category,
      source: {
        sourceKind: "unresolved_consequence",
        sourceId: consequence.consequenceId,
        authority: "structural_consequence",
        contribution,
      },
    });
  }

  for (const [category, shapingWeight] of Object.entries(input.pressureInput.shapingDefaults ?? {})) {
    if (typeof shapingWeight !== "number") continue;
    addSource(bucket, {
      category: category as NarrativePressureCategory,
      source: {
        sourceKind: "shaping_default",
        sourceId: "narrative-shaping-defaults",
        authority: "shaping_default_bounded",
        contribution: clampInfluence(shapingWeight),
      },
    });
  }

  const pressures: NarrativePressure[] = [];
  for (const [category, acc] of bucket.entries()) {
    const structuralSources = acc.sources.filter((source) => source.authority !== "shaping_default_bounded");
    const hasOnlyShapingSource = structuralSources.length === 0;
    const rawIntensity = clamp0to100(acc.sources.reduce((sum, source) => sum + source.contribution, 0));

    if (hasOnlyShapingSource) acc.blockedConditions.push("insufficient_structural_support");
    if (blockedByCategoryGlobalRule(category, blockedCodes)) acc.blockedConditions.push(`blocked_by_policy_${category}`);
    if (input.pressureInput.worldStatePressure < 10 && ["scarcity", "authority", "escape"].includes(category)) {
      acc.blockedConditions.push("world_pressure_below_threshold");
    }
    if (structuralSources.length >= 2) acc.reinforcingConditions.push("multi_source_alignment");
    if (structuralSources.some((source) => source.sourceKind === "active_arc") && structuralSources.some((source) => source.sourceKind === "unresolved_consequence")) {
      acc.reinforcingConditions.push("arc_consequence_resonance");
    }

    const blockedPenalty = acc.blockedConditions.length > 0 ? 0.5 : 1;
    const reinforcedBoost = acc.reinforcingConditions.length > 0 ? 1.15 : 1;
    const prior = priorByCategory.get(category);
    const adjustedRaw = rawIntensity * blockedPenalty * reinforcedBoost;
    const intensity = applyDecayIntensity({
      rawIntensity: adjustedRaw,
      prior,
      stepDelta,
    });
    if (intensity <= 0) continue;

    const dominantAuthority =
      [...acc.sources].sort((a, b) => authorityRank(b.authority) - authorityRank(a.authority))[0]?.authority ?? "shaping_default_bounded";
    const allowedExpressionModes = expressionModesForIntensity(intensity);

    pressures.push({
      contractVersion: NARRATIVE_PRESSURE_CONTRACT_VERSION,
      pressureId: `${category}::${input.evaluatedAtIso}`,
      category,
      targetScope: CATEGORY_TARGET_SCOPE[category],
      intensity,
      sourceAuthority: dominantAuthority,
      sources: acc.sources,
      allowedExpressionModes,
      blockedConditions: [...new Set(acc.blockedConditions)],
      reinforcingConditions: [...new Set(acc.reinforcingConditions)],
      decayBehavior: defaultDecay(),
      explanation: {
        summaryCode: `narrative_pressure_${category}_evaluated`,
        reasonCodes: [
          hasOnlyShapingSource ? "shaping_default_insufficient_without_structure" : "structural_support_present",
          ...acc.blockedConditions,
          ...acc.reinforcingConditions,
        ],
        sourcePlane,
        targetPlane,
      },
    });
  }

  pressures.sort((a, b) => b.intensity - a.intensity || a.category.localeCompare(b.category));
  const influenceHints = pressures.map(influenceHintForPressure);
  const categoryIntensitySummary = pressures.map((pressure) => ({
    category: pressure.category,
    intensity: pressure.intensity,
    blocked: pressure.blockedConditions.length > 0,
    reinforced: pressure.reinforcingConditions.length > 0,
  }));

  return {
    activePressures: pressures,
    categoryIntensitySummary,
    influenceHints,
  };
}
