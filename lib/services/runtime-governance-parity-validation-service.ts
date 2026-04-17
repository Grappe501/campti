import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

export type GovernanceParityValidationResult = {
  ok: boolean;
  violations: string[];
};

/**
 * Validates that canonical-capable paths applied the shared governance merge and preserved key signals.
 */
export class RuntimeGovernanceParityValidationService {
  validateMergedProseConstraints(input: {
    proseConstraints: ProseGenerationConstraints;
    expectCluster3GovernanceMerge: boolean;
  }): GovernanceParityValidationResult {
    const violations: string[] = [];
    if (input.expectCluster3GovernanceMerge) {
      if (!input.proseConstraints.validationFlags.includes("cluster3_encs_eegs_narrator_governance_merge")) {
        violations.push("missing_cluster3_encs_eegs_narrator_governance_merge");
      }
      if (!input.proseConstraints.validationFlags.includes("cluster3_narrator_presence_to_prose_runtime_pack")) {
        violations.push("missing_cluster3_narrator_presence_to_prose_runtime_pack");
      }
    }
    return { ok: violations.length === 0, violations };
  }

  validatePreGenerationBundle(input: {
    bundle: CanonicalPreGenerationBundle | null | undefined;
    expectGovernance: boolean;
  }): GovernanceParityValidationResult {
    const violations: string[] = [];
    if (!input.expectGovernance) {
      return { ok: true, violations: [] };
    }
    if (!input.bundle?.governanceMergeApplied) {
      violations.push("canonical_pre_generation_bundle_missing_or_governance_not_applied");
    }
    if (!input.bundle?.proseConstraints.validationFlags.includes("cluster3_encs_eegs_narrator_governance_merge")) {
      violations.push("bundle_prose_missing_cluster3_merge_flag");
    }
    return { ok: violations.length === 0, violations };
  }
}
