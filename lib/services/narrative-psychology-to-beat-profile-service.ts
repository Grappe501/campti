import type { ChapterBeatProfileRecommendation } from "@/lib/domain/chapter-state";
import {
  NarrativePsychologyBeatBiasSchema,
  type NarrativePsychologyBeatBias,
  type NarrativePsychologyChapterStateBias,
} from "@/lib/domain/narrative-psychology";

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, Number(value.toFixed(3))));
}

export function mapNarrativePsychologyToBeatProfile(input: {
  chapterStateBias: NarrativePsychologyChapterStateBias;
  recommendation: ChapterBeatProfileRecommendation;
}): NarrativePsychologyBeatBias {
  const bias = input.chapterStateBias.axisBias;
  const beatWeightBias: Record<string, number> = {
    salience_lock_beat: clamp(bias.place_immersion * 0.35),
    environmental_confirmation_beat: clamp(bias.place_immersion * 0.42),
    memory_comparison_beat: clamp(bias.continuity_investment * 0.38),
    social_signal_beat: clamp(bias.attachment_intensity * 0.32),
    relational_interpretation_beat: clamp(bias.relational_heat * 0.44),
    emotional_appraisal_beat: clamp((bias.attachment_intensity + bias.meaning_depth) * 0.22),
    micro_decision_beat: clamp((bias.curiosity_tension + bias.unresolved_pull) * 0.28),
    pressure_escalation_beat: clamp((bias.anticipatory_dread + bias.curiosity_tension) * 0.34),
    meaning_trace_beat: clamp(bias.meaning_depth * 0.45),
    consequence_seed_beat: clamp(bias.unresolved_pull * 0.46),
    state_update_beat: clamp((bias.continuity_investment + bias.unresolved_pull) * 0.3),
  };

  const emphasized = input.recommendation.topWeightedBeatTypes.map((row) => `${row.beatType}:${row.weight.toFixed(2)}`);

  return NarrativePsychologyBeatBiasSchema.parse({
    artifact: "narrative_psychology_beat_bias",
    chapterId: input.chapterStateBias.chapterId,
    beatWeightBias,
    emphasisNotes: [
      `Narrative psychology biases layered on top of recommendation set ${emphasized.join(", ")}.`,
      "Attachment and place targets increase social/environmental grounding beats.",
      "Unresolved pull and curiosity targets increase consequence-seed and pressure-escalation emphasis.",
    ],
    historicalIntegrityGuards: [
      "Biases can reprioritize beat emphasis but cannot violate transition constraints.",
      "Beat content remains observer-bounded and materially grounded.",
      "No modern abstract cognition labels are introduced by biasing logic.",
    ],
  });
}
