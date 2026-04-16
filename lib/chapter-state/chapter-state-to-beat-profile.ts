import type { BeatType } from "@/lib/domain/beat-assembly";
import {
  ChapterBeatProfileRecommendationSchema,
  type BeatTransitionBias,
  type ChapterBeatProfileRecommendation,
  type ChapterState,
} from "@/lib/domain/chapter-state";

const BEAT_TYPES: BeatType[] = [
  "salience_lock_beat",
  "memory_comparison_beat",
  "environmental_confirmation_beat",
  "emotional_appraisal_beat",
  "micro_decision_beat",
  "social_signal_beat",
  "relational_interpretation_beat",
  "pressure_escalation_beat",
  "meaning_trace_beat",
  "consequence_seed_beat",
  "state_update_beat",
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalize(weights: Record<BeatType, number>): Record<BeatType, number> {
  const total = Object.values(weights).reduce((acc, value) => acc + value, 0);
  if (total <= 0) {
    const fallback = Number((1 / BEAT_TYPES.length).toFixed(4));
    return Object.fromEntries(BEAT_TYPES.map((beatType) => [beatType, fallback])) as Record<BeatType, number>;
  }
  return Object.fromEntries(
    Object.entries(weights).map(([beatType, value]) => [beatType, Number((value / total).toFixed(4))]),
  ) as Record<BeatType, number>;
}

function n(state: ChapterState, axis: keyof ChapterState["stateAxes"]): number {
  return state.stateAxes[axis].score / 100;
}

export function deriveChapterStateBeatInfluence(state: ChapterState): {
  recommendedBeatWeights: Record<BeatType, number>;
  beatTransitionBiases: BeatTransitionBias[];
  transitionBiasNotes: string[];
} {
  const base = Object.fromEntries(BEAT_TYPES.map((beatType) => [beatType, 1])) as Record<BeatType, number>;
  const environmentalInstability = 1 - n(state, "environmental_stability");
  const foodInsecurity = 1 - n(state, "food_security");
  const socialStrain = 1 - n(state, "social_cohesion");
  const signalNoise = 1 - n(state, "signal_integrity");
  const memoryStrength = n(state, "memory_continuity");
  const meaning = n(state, "meaning_load");
  const decision = n(state, "decision_pressure");
  const movement = n(state, "movement_pressure");
  const relationalHeat = n(state, "relational_heat");
  const externalAwareness = n(state, "external_awareness");
  const laborPressure = n(state, "labor_pressure");

  base.salience_lock_beat += 1.3 * environmentalInstability + 0.7 * signalNoise;
  base.environmental_confirmation_beat += 1.5 * environmentalInstability + 0.5 * externalAwareness;
  base.memory_comparison_beat += 1.3 * signalNoise * memoryStrength + 0.4 * externalAwareness;
  base.social_signal_beat += 1.2 * socialStrain + 0.4 * externalAwareness;
  base.relational_interpretation_beat += 1.1 * relationalHeat + 0.8 * socialStrain;
  base.micro_decision_beat += 1.4 * decision + 0.5 * laborPressure;
  base.pressure_escalation_beat += 1.2 * movement + 0.8 * laborPressure + 0.7 * foodInsecurity;
  base.meaning_trace_beat += 1.1 * meaning + 0.6 * movement + 0.5 * (1 - n(state, "identity_stability"));
  base.consequence_seed_beat += 1.3 * movement + 0.8 * decision + 0.3 * externalAwareness;
  base.state_update_beat += 1.0 * decision + 0.8 * movement;
  base.emotional_appraisal_beat += 0.8 * relationalHeat + 0.6 * meaning + 0.3 * socialStrain;

  const recommendedBeatWeights = normalize(base);

  const beatTransitionBiases: BeatTransitionBias[] = [
    {
      from: "salience_lock_beat",
      to: "environmental_confirmation_beat",
      bias: clamp01(0.2 + environmentalInstability * 0.7),
      rationale: "Unstable conditions push immediate salience checks into environmental confirmation.",
    },
    {
      from: "environmental_confirmation_beat",
      to: "memory_comparison_beat",
      bias: clamp01(0.15 + signalNoise * memoryStrength),
      rationale: "Noisy signal with strong memory continuity increases precedent comparison transitions.",
    },
    {
      from: "social_signal_beat",
      to: "relational_interpretation_beat",
      bias: clamp01(0.2 + socialStrain * 0.6 + relationalHeat * 0.4),
      rationale: "Social strain converts observations into relational decoding.",
    },
    {
      from: "micro_decision_beat",
      to: "state_update_beat",
      bias: clamp01(0.25 + decision * 0.6),
      rationale: "Higher decision pressure requires rapid state updates after choices.",
    },
    {
      from: "pressure_escalation_beat",
      to: "consequence_seed_beat",
      bias: clamp01(0.2 + movement * 0.65),
      rationale: "Movement pressure turns pressure escalations into future-facing consequences.",
    },
    {
      from: "pressure_escalation_beat",
      to: "meaning_trace_beat",
      bias: clamp01(0.15 + meaning * 0.6),
      rationale: "Meaning generation intensifies when continuity pressure rises.",
    },
  ];

  const transitionBiasNotes = [
    "Low signal integrity plus high memory continuity prioritizes memory comparison transitions.",
    "High labor pressure and food insecurity bias transitions toward micro decisions and pressure escalation.",
    "Rising movement pressure amplifies pressure_escalation -> consequence_seed and meaning_trace branches.",
  ];

  return {
    recommendedBeatWeights,
    beatTransitionBiases,
    transitionBiasNotes,
  };
}

export function deriveBeatProfileRecommendation(state: ChapterState): ChapterBeatProfileRecommendation {
  const { recommendedBeatWeights, transitionBiasNotes } = deriveChapterStateBeatInfluence(state);
  const ranking = Object.entries(recommendedBeatWeights)
    .map(([beatType, weight]) => ({ beatType: beatType as BeatType, weight }))
    .sort((a, b) => b.weight - a.weight);
  const topWeightedBeatTypes = ranking.slice(0, 4);
  const deEmphasizedBeatTypes = ranking.slice(-3);

  return ChapterBeatProfileRecommendationSchema.parse({
    artifact: "chapter_state_beat_profile_recommendation",
    chapterId: state.chapterId,
    chapterMode: state.chapterMode,
    topWeightedBeatTypes,
    deEmphasizedBeatTypes,
    transitionBiasNotes,
    chapterDifferentiationNote:
      "This chapter diverges from Chapter 1 by shifting beat priority according to pressure distribution rather than replaying a fixed chain.",
    sharedSystemContinuity: [
      "Beat taxonomy remains unchanged and reusable across chapters.",
      "Transition rules still enforce cognition-safe ordering.",
      "Validation remains shared; only state-conditioned weighting changes.",
    ],
  });
}
