import type { PersistenceGovernanceDecision, PersistedTruthLabel } from "@/lib/domain/persistence-governance";

export type PersistenceGovernanceInput = {
  saveGenerationTextRequested: boolean;
  savedGenerationText: boolean;
  generationTextSaveBlockedByRealism: boolean;
  generationTextSaveBlockedByHumanGravity: boolean;
  allowSaveOnInvalidRealism: boolean;
  allowSaveOnInvalidHumanGravity: boolean;
  realismInvalid: boolean;
  humanGravityInvalid: boolean;
};

function labelFor(input: PersistenceGovernanceInput): PersistedTruthLabel {
  if (!input.saveGenerationTextRequested) return "no_save_requested";
  if (input.savedGenerationText) {
    if (input.allowSaveOnInvalidRealism && input.realismInvalid) return "save_overridden_despite_invalid_realism";
    if (input.allowSaveOnInvalidHumanGravity && input.humanGravityInvalid) {
      return "save_overridden_despite_invalid_human_gravity";
    }
    return "canonical_generation_text_saved";
  }
  if (input.generationTextSaveBlockedByRealism) return "blocked_invalid_realism";
  if (input.generationTextSaveBlockedByHumanGravity) return "blocked_invalid_human_gravity";
  return "no_save_requested";
}

/**
 * Auditable persistence labels for scene generation text — maps save flags to operator truth.
 */
export function decidePersistenceGovernance(input: PersistenceGovernanceInput): PersistenceGovernanceDecision {
  const blockedReasons: string[] = [];
  if (input.generationTextSaveBlockedByRealism) {
    blockedReasons.push("realism_truth_invalid");
  }
  if (input.generationTextSaveBlockedByHumanGravity) {
    blockedReasons.push("human_gravity_no_reset_invalid");
  }

  const persistedTruthLabel = labelFor(input);
  const mayDescribeAsCanonicalReady =
    input.savedGenerationText && !input.realismInvalid && !input.humanGravityInvalid;

  const auditLogLines: string[] = [];
  if (input.allowSaveOnInvalidRealism) {
    auditLogLines.push("override:allowSaveOnInvalidRealism=true");
  }
  if (input.allowSaveOnInvalidHumanGravity) {
    auditLogLines.push("override:allowSaveOnInvalidHumanGravity=true");
  }
  if (input.saveGenerationTextRequested && !input.savedGenerationText && blockedReasons.length) {
    auditLogLines.push(`save_blocked:${blockedReasons.join(",")}`);
  }
  if (input.saveGenerationTextRequested && input.savedGenerationText) {
    auditLogLines.push("generation_text_persisted");
  }

  return {
    contractVersion: "1",
    persistedTruthLabel,
    /** True only when generation text was persisted and both realism and human-gravity validity pass. */
    mayDescribeAsCanonicalReady,
    blockedReasons,
    overridesApplied: {
      allowSaveOnInvalidRealism: input.allowSaveOnInvalidRealism,
      allowSaveOnInvalidHumanGravity: input.allowSaveOnInvalidHumanGravity,
    },
    auditLogLines,
    validationFlags: ["cluster7_persistence_governance"],
  };
}
