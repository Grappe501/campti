export const PERSISTENCE_GOVERNANCE_CONTRACT_VERSION = "1" as const;

export type PersistedTruthLabel =
  | "canonical_generation_text_saved"
  | "blocked_invalid_realism"
  | "blocked_invalid_human_gravity"
  | "no_save_requested"
  | "save_overridden_despite_invalid_realism"
  | "save_overridden_despite_invalid_human_gravity";

export type PersistenceGovernanceDecision = {
  contractVersion: typeof PERSISTENCE_GOVERNANCE_CONTRACT_VERSION;
  persistedTruthLabel: PersistedTruthLabel;
  /** False when output must not be described as canonical-ready for promotion. */
  mayDescribeAsCanonicalReady: boolean;
  blockedReasons: string[];
  overridesApplied: {
    allowSaveOnInvalidRealism: boolean;
    allowSaveOnInvalidHumanGravity: boolean;
  };
  auditLogLines: string[];
  validationFlags: string[];
};
