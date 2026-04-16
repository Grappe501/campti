import {
  ChapterStateSchema,
  type ChapterMode,
  type ChapterState,
  type ChapterStateAxisKey,
  type ChapterStateAxisValue,
  type ChapterStateAxes,
  type MeaningIntensity,
} from "@/lib/domain/chapter-state";
import { deriveChapterStateBeatInfluence } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { validateChapterState } from "@/lib/chapter-state/chapter-state-validation";

type AxisInput = {
  score: number;
  direction: "falling" | "flat" | "rising";
  rationale: string;
};

export type ChapterStateDerivationInput = {
  chapterId: string;
  bookId: string;
  sequenceNumber: number;
  era: string;
  timePosition: string;
  locationProfile: string;
  seasonPhase: string;
  progressionPhase: "phase_a" | "phase_b" | "phase_c" | "phase_d" | "phase_e" | "phase_f";
  povWeightingCandidates: Array<{ characterId: string; weight: number; rationale: string }>;
  axisInputs: Record<ChapterStateAxisKey, AxisInput>;
  activeContinuityThreads: Array<{ threadId: string; label: string; strength: number; status?: "active" | "threatened" | "suppressed" }>;
  threatenedContinuityThreads: Array<{ threadId: string; label: string; strength: number; status?: "active" | "threatened" | "suppressed" }>;
  sourceBasis: string[];
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Number(score.toFixed(1))));
}

function intensityBand(score: number): "low" | "moderate" | "high" {
  if (score < 35) return "low";
  if (score < 70) return "moderate";
  return "high";
}

function stateBandForAxis(axis: ChapterStateAxisKey, score: number): "stable" | "unstable" | "volatile" | undefined {
  if (axis === "signal_integrity" || axis === "meaning_load") return undefined;
  if (axis === "environmental_stability" || axis === "food_security" || axis === "social_cohesion" || axis === "memory_continuity" || axis === "identity_stability") {
    if (score >= 70) return "stable";
    if (score >= 40) return "unstable";
    return "volatile";
  }
  if (score <= 35) return "stable";
  if (score <= 65) return "unstable";
  return "volatile";
}

function readabilityBand(score: number): "clear" | "noisy" | "contradictory" {
  if (score >= 70) return "clear";
  if (score >= 40) return "noisy";
  return "contradictory";
}

function deriveChapterMode(axes: ChapterStateAxes): ChapterMode {
  const movement = axes.movement_pressure.score;
  const identity = axes.identity_stability.score;
  const decision = axes.decision_pressure.score;
  const social = axes.social_cohesion.score;
  const signal = axes.signal_integrity.score;
  const relational = axes.relational_heat.score;

  if (movement >= 80) return "movement_chapter";
  if (movement >= 65 && identity <= 45) return "crossing_preparation_chapter";
  if (movement >= 55 && decision >= 60) return "adaptation_chapter";
  if (identity <= 45 && social <= 45) return "fracture_chapter";
  if (decision >= 55 || relational >= 60) return "obligation_strain_chapter";
  if (signal <= 50) return "signal_disturbance_chapter";
  return "continuity_chapter";
}

function deriveMeaningIntensity(axes: ChapterStateAxes): MeaningIntensity {
  const meaning = axes.meaning_load.score;
  const movement = axes.movement_pressure.score;
  if (meaning < 35) return "minimal";
  if (meaning < 55) return "guarded";
  if (meaning < 75 && movement < 75) return "elevated";
  return "transition_peak";
}

function sortedAxesByScore(axes: ChapterStateAxes, descending = true): ChapterStateAxisKey[] {
  return (Object.keys(axes) as ChapterStateAxisKey[]).sort((left, right) =>
    descending ? axes[right].score - axes[left].score : axes[left].score - axes[right].score,
  );
}

function toAxisValue(axis: ChapterStateAxisKey, input: AxisInput): ChapterStateAxisValue {
  const score = clampScore(input.score);
  return {
    score,
    intensityBand: intensityBand(score),
    stateBand: stateBandForAxis(axis, score),
    readabilityBand: axis === "signal_integrity" ? readabilityBand(score) : undefined,
    direction: input.direction,
    rationale: input.rationale,
  };
}

export function deriveChapterState(input: ChapterStateDerivationInput): ChapterState {
  const stateAxes = Object.fromEntries(
    (Object.keys(input.axisInputs) as ChapterStateAxisKey[]).map((axis) => [axis, toAxisValue(axis, input.axisInputs[axis])]),
  ) as ChapterStateAxes;

  const chapterMode = deriveChapterMode(stateAxes);
  const dominantPressures = sortedAxesByScore(stateAxes, true).slice(0, 4);
  const suppressedPressures = sortedAxesByScore(stateAxes, false).slice(0, 3);
  const allowedMeaningIntensity = deriveMeaningIntensity(stateAxes);

  const draft: ChapterState = {
    artifact: "chapter_state_model",
    schemaVersion: "1.0.0",
    chapterId: input.chapterId,
    bookId: input.bookId,
    sequenceNumber: input.sequenceNumber,
    chapterMode,
    era: input.era,
    timePosition: input.timePosition,
    locationProfile: input.locationProfile,
    seasonPhase: input.seasonPhase,
    progressionPhase: input.progressionPhase,
    povWeightingCandidates: input.povWeightingCandidates,
    stateAxes,
    dominantPressures,
    suppressedPressures,
    activeContinuityThreads: input.activeContinuityThreads.map((thread) => ({
      ...thread,
      status: thread.status ?? "active",
    })),
    threatenedContinuityThreads: input.threatenedContinuityThreads.map((thread) => ({
      ...thread,
      status: thread.status ?? "threatened",
    })),
    chapterStateSummary:
      `Chapter ${input.sequenceNumber} runs in ${chapterMode} mode with dominant pressure on ` +
      `${dominantPressures.slice(0, 2).join(" + ")}, while ${suppressedPressures.join(", ")} remain backgrounded.`,
    recommendedBeatWeights: {
      salience_lock_beat: 0.09,
      memory_comparison_beat: 0.09,
      environmental_confirmation_beat: 0.09,
      emotional_appraisal_beat: 0.09,
      micro_decision_beat: 0.09,
      social_signal_beat: 0.09,
      relational_interpretation_beat: 0.09,
      pressure_escalation_beat: 0.09,
      meaning_trace_beat: 0.09,
      consequence_seed_beat: 0.09,
      state_update_beat: 0.1,
    },
    beatTransitionBiases: [],
    allowedMeaningIntensity,
    visibilityRules: {
      keepGlobalCausesOffstage: true,
      requireEmbodiedEvidenceBeforeInterpretation: true,
      allowedRevealScopes: ["household", "kinship", "settlement", "regional_edge"],
      prohibitedNarrationMoves: [
        "omniscient_future_resolution",
        "modern_plot_template_naming",
      ],
    },
    memoryAccessProfile: {
      recallBias: stateAxes.memory_continuity.score >= 65 ? "lineage_memory" : "mixed",
      memoryComparisonIntensity: Number((Math.max(0.2, (100 - stateAxes.signal_integrity.score) / 100)).toFixed(2)),
      confidenceInPrecedent: Number((stateAxes.memory_continuity.score / 100).toFixed(2)),
      allowContradictoryMemories: stateAxes.signal_integrity.score < 45,
    },
    decisionUrgencyProfile: {
      urgencyScore: Number((stateAxes.decision_pressure.score / 100).toFixed(2)),
      reversibility:
        stateAxes.decision_pressure.score >= 70 ? "low" : stateAxes.decision_pressure.score >= 45 ? "medium" : "high",
      ambiguityCost: Number((Math.max(stateAxes.external_awareness.score, stateAxes.signal_integrity.score) / 100).toFixed(2)),
      delayRisk: Number((Math.max(stateAxes.movement_pressure.score, 100 - stateAxes.food_security.score) / 100).toFixed(2)),
    },
    chapterRiskFlags: [],
    validationFlags: {
      passesAll: true,
      warnings: [],
      errors: [],
      riskFlags: [],
    },
    provenance: {
      sourceBasis: input.sourceBasis,
      generatedBy: "chapter-state-derivation",
      generatedAt: new Date().toISOString(),
    },
  };

  const influence = deriveChapterStateBeatInfluence(draft);
  draft.recommendedBeatWeights = influence.recommendedBeatWeights;
  draft.beatTransitionBiases = influence.beatTransitionBiases;

  const validationFlags = validateChapterState(draft);
  draft.chapterRiskFlags = validationFlags.riskFlags;
  draft.validationFlags = validationFlags;

  return ChapterStateSchema.parse(draft);
}
