import {
  type ChapterRiskFlag,
  type ChapterState,
  type ChapterStateValidationFlags,
  type ChapterStateAxisKey,
} from "@/lib/domain/chapter-state";

function score(state: ChapterState, axis: ChapterStateAxisKey): number {
  return state.stateAxes[axis].score;
}

function weight(state: ChapterState, beatType: keyof ChapterState["recommendedBeatWeights"]): number {
  return state.recommendedBeatWeights[beatType] ?? 0;
}

function includesOperationalBufferRationale(state: ChapterState): boolean {
  const rationale = [
    state.stateAxes.food_security.rationale,
    state.stateAxes.environmental_stability.rationale,
    state.chapterStateSummary,
  ]
    .join(" ")
    .toLowerCase();
  return /stored|reserve|trade|buffer|redistribution/.test(rationale);
}

function phaseCompatibilityErrors(state: ChapterState): string[] {
  const movement = score(state, "movement_pressure");
  const meaning = score(state, "meaning_load");
  const signal = score(state, "signal_integrity");
  const errors: string[] = [];
  if (state.progressionPhase === "phase_a" && movement > 25) {
    errors.push("Phase A should keep movement pressure low and mostly unthinkable.");
  }
  if (state.progressionPhase === "phase_b" && signal > 70) {
    errors.push("Phase B should preserve readable signal baseline with only soft disturbance.");
  }
  if (state.progressionPhase === "phase_c" && score(state, "decision_pressure") < 45) {
    errors.push("Phase C requires non-trivial decision pressure.");
  }
  if (state.progressionPhase === "phase_d" && score(state, "identity_stability") > 60) {
    errors.push("Phase D should show visible identity weakening.");
  }
  if (state.progressionPhase === "phase_e" && meaning < 55) {
    errors.push("Phase E should carry elevated meaning load for adaptation decisions.");
  }
  if (state.progressionPhase === "phase_f" && movement < 70) {
    errors.push("Phase F requires high movement pressure.");
  }
  return errors;
}

export function validateChapterState(state: ChapterState): ChapterStateValidationFlags {
  const warnings: string[] = [];
  const errors: string[] = [];
  const riskFlags = new Set<ChapterRiskFlag>();

  const environmental = score(state, "environmental_stability");
  const food = score(state, "food_security");
  const movement = score(state, "movement_pressure");
  const meaning = score(state, "meaning_load");
  const decision = score(state, "decision_pressure");
  const relational = score(state, "relational_heat");
  const social = score(state, "social_cohesion");
  const identity = score(state, "identity_stability");
  const signal = score(state, "signal_integrity");

  if (environmental <= 35 && food >= 75 && !includesOperationalBufferRationale(state)) {
    warnings.push("Food security remains high while environmental stability is low without explicit storage/trade basis.");
    riskFlags.add("axis_contradiction_without_basis");
  }

  if (social >= 75 && relational >= 70) {
    warnings.push("Social cohesion and relational heat are both high; clarify whether cohesion is brittle or truly buffering.");
    riskFlags.add("axis_contradiction_without_basis");
  }

  if (state.sequenceNumber <= 3 && movement >= 60) {
    errors.push("Movement pressure spikes too early for sequence position.");
    riskFlags.add("premature_movement_spike");
  }

  if (meaning >= 75 && decision <= 35 && movement <= 35) {
    errors.push("Meaning load is too high for a low-pressure chapter state.");
    riskFlags.add("meaning_overload_for_routine_chapter");
  }

  if (movement >= 60 && weight(state, "consequence_seed_beat") < 0.11) {
    errors.push("Movement-heavy chapter must elevate consequence_seed_beat weighting.");
    riskFlags.add("beat_profile_state_mismatch");
  }
  if (decision >= 60 && weight(state, "micro_decision_beat") < 0.1) {
    errors.push("Decision pressure requires stronger micro_decision_beat weighting.");
    riskFlags.add("beat_profile_state_mismatch");
  }
  if (meaning >= 60 && weight(state, "meaning_trace_beat") < 0.08) {
    errors.push("Elevated meaning load requires stronger meaning_trace_beat weighting.");
    riskFlags.add("beat_profile_state_mismatch");
  }
  if (environmental <= 40 && (weight(state, "salience_lock_beat") < 0.08 || weight(state, "environmental_confirmation_beat") < 0.08)) {
    errors.push("Environmental instability should increase salience_lock_beat and environmental_confirmation_beat weights.");
    riskFlags.add("beat_profile_state_mismatch");
  }

  const phaseErrors = phaseCompatibilityErrors(state);
  if (phaseErrors.length > 0) {
    for (const error of phaseErrors) errors.push(error);
    riskFlags.add("historical_phase_mismatch");
  }

  const topPov = [...state.povWeightingCandidates].sort((a, b) => b.weight - a.weight)[0];
  if (topPov && decision >= 60 && topPov.weight < 0.45) {
    warnings.push("High decision pressure chapter should have at least one clearly weighted POV carrier.");
    riskFlags.add("pov_misaligned_with_pressure_load");
  }
  if (identity <= 40 && meaning <= 40 && movement >= 65) {
    warnings.push("Identity risk is high with rising movement pressure but meaning load remains low.");
  }
  if (signal <= 40 && score(state, "memory_continuity") >= 70 && weight(state, "memory_comparison_beat") < 0.09) {
    warnings.push("Low signal integrity with strong memory continuity should increase memory comparison beats.");
  }

  return {
    passesAll: errors.length === 0,
    warnings,
    errors,
    riskFlags: [...riskFlags],
  };
}

export function validateChapterStateSequence(states: ChapterState[]): {
  passesAll: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (states.length < 2) {
    return { passesAll: true, warnings, errors };
  }

  for (let index = 1; index < states.length; index += 1) {
    const previous = states[index - 1];
    const current = states[index];
    const previousMovement = previous.stateAxes.movement_pressure.score;
    const currentMovement = current.stateAxes.movement_pressure.score;
    const movementDelta = currentMovement - previousMovement;
    if (movementDelta > 25) {
      errors.push(`Movement pressure jumps too abruptly from ${previous.chapterId} to ${current.chapterId}.`);
    }
    if (movementDelta < -15) {
      warnings.push(`Movement pressure drops sharply from ${previous.chapterId} to ${current.chapterId}; verify transition continuity.`);
    }

    const previousMeaning = previous.stateAxes.meaning_load.score;
    const currentMeaning = current.stateAxes.meaning_load.score;
    if (current.stateAxes.identity_stability.score < previous.stateAxes.identity_stability.score && currentMeaning < previousMeaning - 10) {
      warnings.push(`Identity weakens from ${previous.chapterId} to ${current.chapterId} while meaning load falls; ensure continuity rationale.`);
    }
  }

  return {
    passesAll: errors.length === 0,
    warnings,
    errors,
  };
}
