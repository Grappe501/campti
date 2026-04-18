import type { Cluster3RuntimeActivationTruth } from "@/lib/domain/author-command-cockpit";
import type { CamptiEpicContinuityPack } from "@/lib/domain/epic-narrative-continuity";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { CamptiNarratorPresencePack, NarratorPresenceValidationResult } from "@/lib/domain/narrator-presence";
import type { SequenceValidationReport } from "@/lib/domain/narrative-sequence";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

/** Mirrors Cluster3PackValidations without importing services into domain. */
export type Cluster3PackValidationSnapshot = {
  epicContinuity: { valid: boolean; score: number; warnings: string[]; risks: string[] };
  epicEmotionalGravity: { valid: boolean; score: number; warnings: string[]; risks: string[] };
  narratorPresence: NarratorPresenceValidationResult;
};

/**
 * Cluster 4 — authoritative pre-generation bundle for any canonical-capable scene/chapter generation path.
 * Prose constraints MUST reflect post–Cluster-3 governance merge when `governanceMergeApplied` is true.
 */
export type CanonicalPreGenerationBundle = {
  contractVersion: "1";
  /** True when ENCS/EEGS/narrator governance merge ran via CanonicalRuntimeCluster3GovernanceService. */
  governanceMergeApplied: boolean;
  proseConstraints: ProseGenerationConstraints;
  sequenceValidation: SequenceValidationReport;
  epicContinuityPack: CamptiEpicContinuityPack;
  epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack;
  narratorPresencePack: CamptiNarratorPresencePack;
  packValidations: Cluster3PackValidationSnapshot;
  cluster3RuntimeActivationTruth: Cluster3RuntimeActivationTruth;
  /** How this bundle was produced (for truthful runtime labeling). */
  preparationPath:
    | "book1_regeneration_orchestration"
    | "db_production_scene_governance_adapter"
    | "explicit_override";
  /** When the DB path could not mirror full book1 literary layering before governance. */
  literaryLayerParityNote?: string | null;
  validationFlags: string[];
  /**
   * Cluster 7 — optional semantic flags for drift detection and certification (e.g. `parity_warning`, `advisory_merge`).
   * Prefer propagating end-to-end over inferring from preparation path alone.
   */
  runtimeSemanticTruthFlags?: string[];
  /**
   * Cluster 8 — character-driven scene emergence overlay (per scene plan id in chapter composition).
   * Feeds scene necessity / conflict justification before model generation on the canonical path.
   */
  characterSceneEmergencePlan?: import("@/lib/domain/character-scene-emergence").CharacterSceneEmergenceChapterPlan | null;
};

export type RuntimeGovernanceConvergenceTruth = {
  contractVersion: "1";
  canonicalGovernanceMergeApplied: boolean;
  runtimePathLabel: "regeneration" | "db_production_scene_generation" | "other";
  regenerationProductionParitySatisfied: boolean;
  divergenceWarnings: string[];
  governanceSourcesConsumed: string[];
  narratorSignalsActive: boolean;
  continuitySignalsActive: boolean;
  emotionalGravitySignalsActive: boolean;
  hookPressureSignalsActive: boolean;
  proseConstraintGovernanceFlags: string[];
};
