import type { ChapterState } from "@/lib/domain/chapter-state";
import {
  NarrativePsychologyChapterStateBiasSchema,
  type ChapterNarrativePsychology,
  type NarrativePsychologyChapterStateBias,
} from "@/lib/domain/narrative-psychology";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function mapNarrativePsychologyToChapterState(input: {
  chapterPsychology: ChapterNarrativePsychology;
  chapterState: ChapterState;
}): NarrativePsychologyChapterStateBias {
  const { chapterPsychology, chapterState } = input;
  const axisBias = {
    ...chapterPsychology.axisTargets,
    place_immersion: clamp01(Math.max(chapterPsychology.axisTargets.place_immersion, chapterState.stateAxes.environmental_stability.score / 100)),
    attachment_intensity: clamp01(
      Math.max(chapterPsychology.axisTargets.attachment_intensity, chapterState.stateAxes.relational_heat.score / 100),
    ),
    continuity_investment: clamp01(
      Math.max(chapterPsychology.axisTargets.continuity_investment, chapterState.stateAxes.memory_continuity.score / 100),
    ),
    unresolved_pull: clamp01(
      Math.max(
        chapterPsychology.axisTargets.unresolved_pull,
        chapterState.stateAxes.decision_pressure.score / 100,
        chapterState.stateAxes.movement_pressure.score / 100,
      ),
    ),
  };

  const driftWarnings: string[] = [];
  if (chapterState.stateAxes.signal_integrity.score > 70 && chapterPsychology.axisTargets.interpretive_instability > 0.65) {
    driftWarnings.push("Chapter-state signal_integrity is too high for targeted interpretive instability.");
  }
  if (chapterState.stateAxes.memory_continuity.score < 45 && chapterPsychology.axisTargets.continuity_investment > 0.75) {
    driftWarnings.push("Continuity investment target exceeds current memory continuity readiness.");
  }

  return NarrativePsychologyChapterStateBiasSchema.parse({
    artifact: "narrative_psychology_chapter_state_bias",
    chapterId: chapterPsychology.chapterId,
    chapterStateId: chapterState.chapterId,
    parentNarrativePsychologyId: chapterPsychology.parentBookId,
    axisBias,
    chapterStateBiasRules: [
      "Higher place_immersion biases early chapters toward environmental grounding and material noticing.",
      "Higher attachment_intensity biases POV weighting toward relationally loaded observers.",
      "Higher continuity_investment increases memory_continuity emphasis before fracture phases.",
      "Higher unresolved_pull increases state_update and carry-forward pressure requirements at chapter end.",
    ],
    endingBiasRecommendations: [
      "Prefer consequence-seeded ending vectors over closed explanatory endings.",
      "Retain unresolved meaningful pressure linked to continuity stakes.",
    ],
    driftWarnings,
  });
}
