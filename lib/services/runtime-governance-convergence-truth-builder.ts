import type { Cluster3RuntimeActivationTruth } from "@/lib/domain/author-command-cockpit";
import type { RuntimeGovernanceConvergenceTruth } from "@/lib/domain/canonical-scene-generation-governance";

export function buildRuntimeGovernanceConvergenceTruth(input: {
  runtimePathLabel: RuntimeGovernanceConvergenceTruth["runtimePathLabel"];
  cluster3: Cluster3RuntimeActivationTruth;
  /** When DB path notes literary-layer difference vs regeneration. */
  literaryLayerParityNotes?: string[];
}): RuntimeGovernanceConvergenceTruth {
  const flags = input.cluster3.proseConstraintCluster3Flags;
  const divergenceWarnings = [...(input.literaryLayerParityNotes ?? [])];
  if (!input.cluster3.governanceMergeApplied) {
    divergenceWarnings.push("cluster3_governance_merge_not_applied");
  }
  return {
    contractVersion: "1",
    canonicalGovernanceMergeApplied: input.cluster3.governanceMergeApplied,
    runtimePathLabel: input.runtimePathLabel,
    regenerationProductionParitySatisfied:
      input.cluster3.governanceMergeApplied && divergenceWarnings.length === 0,
    divergenceWarnings,
    governanceSourcesConsumed: [
      "encs_epic_continuity_pack",
      "eegs_epic_emotional_gravity_pack",
      "narrator_presence_pack",
      "narrative_sequence_validation",
      "canonical_runtime_cluster3_governance_merge",
    ],
    narratorSignalsActive: flags.some((f) => f.includes("narrator")),
    continuitySignalsActive: flags.some((f) => f.includes("encs")),
    emotionalGravitySignalsActive: flags.some((f) => f.includes("eegs")),
    hookPressureSignalsActive:
      input.cluster3.sequenceStructuralHookPressureActive || input.cluster3.hcelHookHardSignalsActive,
    proseConstraintGovernanceFlags: flags,
  };
}
