import type { BeatType } from "@/lib/domain/beat-assembly";
import type { ChapterBeatProfileRecommendation } from "@/lib/domain/chapter-state";
import { type NarrativeThread, type ThreadBeatInfluence, ThreadBeatInfluenceSchema } from "@/lib/domain/narrative-thread";

const BEAT_TYPES: BeatType[] = [
  "salience_lock_beat",
  "environmental_confirmation_beat",
  "memory_comparison_beat",
  "social_signal_beat",
  "relational_interpretation_beat",
  "emotional_appraisal_beat",
  "micro_decision_beat",
  "pressure_escalation_beat",
  "meaning_trace_beat",
  "consequence_seed_beat",
  "state_update_beat",
];

function emptyBias(): Record<BeatType, number> {
  return Object.fromEntries(BEAT_TYPES.map((beatType) => [beatType, 0])) as Record<BeatType, number>;
}

function applyThreadBias(target: Record<BeatType, number>, thread: NarrativeThread): string[] {
  const notes: string[] = [];
  const pulse = Number((thread.currentTensionLevel * 0.55 + thread.currentMeaningLoad * 0.45).toFixed(3));
  switch (thread.threadType) {
    case "relational_thread":
      target.social_signal_beat += 0.2 * pulse;
      target.relational_interpretation_beat += 0.25 * pulse;
      notes.push(`Relational thread ${thread.threadId} elevates social and relational beats.`);
      break;
    case "memory_thread":
      target.memory_comparison_beat += 0.3 * pulse;
      notes.push(`Memory thread ${thread.threadId} elevates memory comparison beats.`);
      break;
    case "warning_thread":
      target.salience_lock_beat += 0.2 * pulse;
      target.consequence_seed_beat += 0.24 * pulse;
      notes.push(`Warning thread ${thread.threadId} prioritizes salience and consequence seeding.`);
      break;
    case "philosophy_thread":
    case "belief_worldview_thread":
      target.meaning_trace_beat += 0.32 * pulse;
      target.emotional_appraisal_beat += 0.14 * pulse;
      notes.push(`Philosophy/worldview thread ${thread.threadId} strengthens meaning trace flow.`);
      break;
    case "setting_thread":
      target.environmental_confirmation_beat += 0.24 * pulse;
      notes.push(`Setting thread ${thread.threadId} increases place confirmation beats.`);
      break;
    case "route_thread":
      target.environmental_confirmation_beat += 0.16 * pulse;
      target.social_signal_beat += 0.14 * pulse;
      target.consequence_seed_beat += 0.18 * pulse;
      notes.push(`Route thread ${thread.threadId} drives travel report / route linkage beats.`);
      break;
    case "mystery_thread":
      target.memory_comparison_beat += 0.12 * pulse;
      target.meaning_trace_beat += 0.12 * pulse;
      notes.push(`Mystery thread ${thread.threadId} biases deferred interpretation beats.`);
      break;
    case "convergence_thread":
      target.consequence_seed_beat += 0.2 * pulse;
      target.state_update_beat += 0.08 * pulse;
      notes.push(`Convergence thread ${thread.threadId} reserves delayed callback/re-entry pressure.`);
      break;
    default:
      target.micro_decision_beat += 0.08 * pulse;
      notes.push(`Thread ${thread.threadId} contributes to micro decision pressure.`);
      break;
  }
  return notes;
}

export class NarrativeThreadToBeatProfileService {
  deriveInfluence(input: { chapterId: string; threads: NarrativeThread[] }): ThreadBeatInfluence {
    const bias = emptyBias();
    const emphasisNotes: string[] = [];
    for (const thread of input.threads) {
      if (thread.currentStatus === "suppressed" || thread.currentStatus === "resolved") continue;
      emphasisNotes.push(...applyThreadBias(bias, thread));
    }
    for (const beatType of BEAT_TYPES) {
      bias[beatType] = Number(Math.max(-1, Math.min(1, bias[beatType])).toFixed(4));
    }
    return ThreadBeatInfluenceSchema.parse({
      artifact: "narrative_thread_beat_influence",
      chapterId: input.chapterId,
      beatWeightBias: bias,
      emphasisNotes,
    });
  }

  mergeWithRecommendation(input: {
    recommendation: ChapterBeatProfileRecommendation;
    threadInfluence: ThreadBeatInfluence;
    scale?: number;
  }): ChapterBeatProfileRecommendation {
    const scale = input.scale ?? 0.3;
    const adjusted = input.recommendation.topWeightedBeatTypes
      .map((row) => ({
        beatType: row.beatType,
        weight: Number(
          Math.max(0, Math.min(1, row.weight + (input.threadInfluence.beatWeightBias[row.beatType] ?? 0) * scale)).toFixed(4),
        ),
      }))
      .sort((a, b) => b.weight - a.weight);

    return {
      ...input.recommendation,
      topWeightedBeatTypes: adjusted,
      transitionBiasNotes: input.recommendation.transitionBiasNotes.concat(input.threadInfluence.emphasisNotes),
    };
  }
}
