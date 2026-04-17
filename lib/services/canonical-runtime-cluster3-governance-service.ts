import type { Cluster3RuntimeActivationTruth } from "@/lib/domain/author-command-cockpit";
import type { CamptiEpicContinuityPack } from "@/lib/domain/epic-narrative-continuity";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { CamptiNarratorPresencePack, NarratorPresenceValidationResult } from "@/lib/domain/narrator-presence";
import type { SequenceValidationReport } from "@/lib/domain/narrative-sequence";
import {
  ProseGenerationConstraintsSchema,
  type ProseGenerationConstraints,
} from "@/lib/domain/prose-generation-constraints";
import { NarratorPresenceToProseService } from "@/lib/services/narrator-presence-to-prose-service";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

export type Cluster3PackValidations = {
  epicContinuity: { valid: boolean; score: number; warnings: string[]; risks: string[] };
  epicEmotionalGravity: { valid: boolean; score: number; warnings: string[]; risks: string[] };
  narratorPresence: NarratorPresenceValidationResult;
};

/**
 * Cluster 3 — merges ENCS / EEGS / narrator presence into prose constraints on the book1 regeneration
 * canonical orchestration path (literary merge → epic packs → **this** → scene generation engine).
 */
export class CanonicalRuntimeCluster3GovernanceService {
  private readonly narratorToProse = new NarratorPresenceToProseService();

  applyToProseConstraints(input: {
    constraints: ProseGenerationConstraints;
    epicContinuityPack: CamptiEpicContinuityPack;
    epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack;
    narratorPresencePack: CamptiNarratorPresencePack;
    validations: Cluster3PackValidations;
  }): ProseGenerationConstraints {
    const encs = input.epicContinuityPack;
    const eegs = input.epicEmotionalGravityPack;
    const cockpit = encs.cockpitSummary;
    const egCockpit = eegs.cockpitSummary;

    const continuityBoost = cockpit.anchorRecurrenceHealth * 0.12;
    let continuityEmphasis = clamp01(input.constraints.continuityEmphasis + continuityBoost + 0.02);
    let placeImmersionTarget = clamp01(input.constraints.placeImmersionTarget + cockpit.disconnectionWarnings.length * 0.02);
    let attachmentTarget = clamp01(input.constraints.attachmentTarget + egCockpit.epicEmotionalGravityScore * 0.07);
    let relationalSignalDensity = clamp01(input.constraints.relationalSignalDensity + egCockpit.epicEmotionalGravityScore * 0.08);

    let lineTensionProfile = { ...input.constraints.lineTensionProfile };
    const hookHard = input.validations.epicContinuity.risks.some((r) => r.includes("ANTI-DROPOFF"));
    if (hookHard) {
      lineTensionProfile = {
        ...lineTensionProfile,
        unresolvedCarryForward: clamp01(lineTensionProfile.unresolvedCarryForward + 0.12),
        target: lineTensionProfile.target === "steady" ? "rising" : lineTensionProfile.target,
      };
    }

    const driftFlags = [
      ...input.constraints.driftFlags,
      ...cockpit.disconnectionWarnings.slice(0, 6),
      ...cockpit.unresolvedEpicContinuityRisks.slice(0, 4),
      ...egCockpit.emotionallyThinWarnings,
      ...egCockpit.resetHeavyWarnings,
      ...input.validations.epicContinuity.warnings.slice(0, 3),
      ...input.validations.epicEmotionalGravity.warnings.slice(0, 3),
    ];

    const validationFlags = [
      ...input.constraints.validationFlags,
      "cluster3_encs_eegs_narrator_governance_merge",
    ];
    if (hookHard) {
      validationFlags.push("cluster3_hcel_hook_transition_hard_signal");
    }
    if (!input.validations.epicContinuity.valid) {
      validationFlags.push("cluster3_encs_pack_validation_failed");
    }
    if (!input.validations.epicEmotionalGravity.valid) {
      validationFlags.push("cluster3_eegs_pack_validation_failed");
    }
    if (!input.validations.narratorPresence.valid) {
      validationFlags.push("cluster3_narrator_presence_validation_failed");
      for (const h of input.validations.narratorPresence.hardFailures) {
        driftFlags.push(`narrator_hard_failure:${h.category}`);
      }
    }

    const requiredPatterns = [
      ...input.constraints.requiredPatterns,
      ...encs.downstreamBias.hookClosureCarryForwardBias.slice(0, 2),
      ...encs.downstreamBias.chapterCompositionRequirements.slice(0, 1),
    ];
    const dictionGuardrails = [
      ...input.constraints.dictionGuardrails,
      ...eegs.downstreamBias.proseConstraintBias.slice(0, 2),
    ];

    let merged = ProseGenerationConstraintsSchema.parse({
      ...input.constraints,
      continuityEmphasis,
      placeImmersionTarget,
      attachmentTarget,
      relationalSignalDensity,
      lineTensionProfile,
      driftFlags,
      validationFlags,
      requiredPatterns,
      dictionGuardrails,
    });

    merged = this.narratorToProse.applyToChapterConstraints({
      constraints: merged,
      modeProfile: input.narratorPresencePack.chapterPresencePlan.modeProfile,
    });

    merged = ProseGenerationConstraintsSchema.parse({
      ...merged,
      validationFlags: [...new Set(merged.validationFlags.concat("cluster3_narrator_presence_to_prose_runtime_pack"))],
    });

    return merged;
  }
}

export function buildCluster3RuntimeActivationTruth(input: {
  proseConstraints: ProseGenerationConstraints;
  sequenceValidation: SequenceValidationReport;
  epicContinuityPack: CamptiEpicContinuityPack;
  epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack;
  narratorPresencePack: CamptiNarratorPresencePack;
  epicContinuityValidation: { valid: boolean };
  epicEmotionalGravityValidation: { valid: boolean };
  narratorPresenceValidation: NarratorPresenceValidationResult;
}): Cluster3RuntimeActivationTruth {
  const flags = input.proseConstraints.validationFlags.filter((f) => f.startsWith("cluster3_"));
  const hookPressure = input.sequenceValidation.structuralWeaknessFlags.includes("cluster3_hook_continuity_pressure");
  return {
    contractVersion: "1",
    governanceMergeApplied: true,
    proseConstraintCluster3Flags: flags,
    sequenceStructuralHookPressureActive: hookPressure,
    epicContinuityPackValidated: input.epicContinuityValidation.valid,
    epicEmotionalGravityPackValidated: input.epicEmotionalGravityValidation.valid,
    narratorPresenceValidated: input.narratorPresenceValidation.valid,
    encsMaterialInfluences: input.epicContinuityPack.downstreamBias.narrativeThreadPriorityBias.slice(0, 3),
    eegsMaterialInfluences: input.epicEmotionalGravityPack.downstreamBias.proseConstraintBias.slice(0, 3),
    narratorMaterialInfluences: input.narratorPresencePack.downstreamIntegration.proseConstraints.slice(0, 3),
    hcelHookHardSignalsActive: flags.includes("cluster3_hcel_hook_transition_hard_signal"),
    advisoryRemainderNote:
      "Epic packs retain deterministic scaffolding; runtime chapter/scene/thread inputs bias prose + sequence validation. DB production scene generation routes through the same Cluster 3 governance merge when canonical narrative governance is enabled (see scene-generation-service).",
  };
}
