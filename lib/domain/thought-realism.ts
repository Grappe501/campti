/**
 * Phase 5C.2 — Human thought realism (fragmentation, distortion, texture).
 * Deterministic derived layer; numeric fields are **0–1** unless noted.
 */

/** Controls how “broken” and non-linear inner speech tends to read. */
export type ThoughtFragmentProfile = {
  /** 0–1: shorter bursts, more staccato. */
  fragmentationLevel: number;
  /** 0–1: mid-thought cuts, asides, self-interruption. */
  interruptionRate: number;
  /** 0–1: phrases/images return in loops. */
  repetitionTendency: number;
  /** 0–1: linear, complete thought (inverse of chaos). */
  coherenceLevel: number;
  /** 0–1: feeling spikes interrupt reasoning. */
  emotionalIntrusionRate: number;
};

export type CognitiveDistortionKind =
  | "exaggeration"
  | "minimization"
  | "rationalization"
  | "projection"
  | "fatalism"
  | "magical_thinking"
  | "catastrophizing"
  | "black_white_split";

/** Era- and state-conditioned warping of inference (not clinical labels in output). */
export type CognitiveDistortionProfile = {
  distortionTypes: CognitiveDistortionKind[];
  /** 0–1 aggregate pull of active distortions. */
  distortionIntensity: number;
  dominantDistortion: CognitiveDistortionKind;
  /** One dense line for prompts (deterministic). */
  distortionSummary: string;
};

/** Fine-grained controls for rhythm and bleed in inner voice. */
export type InnerVoiceTextureProfile = {
  /** 0–1: uneven pacing, drift. */
  rhythmVariation: number;
  /** 0–1: body/sense interrupts abstraction. */
  sensoryIntrusionRate: number;
  /** 0–1: past faces/scenes intrude. */
  memoryIntrusionRate: number;
  /** 0–1: want/yearning tints diction. */
  desireIntrusionRate: number;
  /** 0–1: taboo edges into “safer” channels. */
  tabooLeakRate: number;
};
