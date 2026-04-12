/**
 * Deterministic physical embodiment for cognition (pain, fatigue, hunger, illness).
 * Drives inner voice texture before any LLM; final prose stays English via thought-language layer.
 */

/** 0–100 scalar bands unless noted. */
export type CharacterPhysicalState = {
  fatigueLevel: number;
  painLevel: number;
  hungerLevel: number;
  illnessLevel: number;
  injuryDescription: string;
  /** Blurred senses, ringing, fever haze, etc. */
  sensoryDisruptionLevel: number;
  /** Short free-text: e.g. "lame left leg", "cannot run" — may be empty. */
  mobilityConstraint: string;
};

/**
 * Normalized embodiment pressures merged into cognition (prompt + deterministic stacks).
 * Numeric fields are 0–1 unless noted.
 */
export type EmbodiedCognitionEffects = {
  /** One or two sentences for model grounding (not clinical). */
  perceptionDistortion: string;
  /** Survival / immediacy bias. */
  urgencyAmplification: number;
  /** Positive = more reactive / labile; negative = flattened affect. */
  emotionalVolatilityShift: number;
  /** Tunnel vision vs wide situational scan. */
  focusNarrowing: number;
  /** Short-circuit deliberation toward action or snap judgment. */
  impulseIncrease: number;
};
