/**
 * Stage 8.5 — Outcome Envelope (derived, inspectable; not persisted).
 * Coarse families of what the scene can afford narratively.
 */
export type OutcomeEnvelopeEntry = {
  /** Outcome family line (stable for UI / JSON). */
  text: string;
  /** Short policy or cue reason for debugging / Stage 9 prep (optional). */
  reason?: string;
};

export type SceneOutcomeEnvelope = {
  allowedOutcomes: OutcomeEnvelopeEntry[];
  costlyOutcomes: OutcomeEnvelopeEntry[];
  blockedOutcomes: OutcomeEnvelopeEntry[];
  unstableOutcomes: OutcomeEnvelopeEntry[];
  notes: string[];
};
