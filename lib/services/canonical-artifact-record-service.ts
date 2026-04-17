import type { CanonicalArtifactRecord, ArtifactTruthStamp } from "@/lib/domain/canonical-artifact-governance";
import { CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION } from "@/lib/domain/canonical-artifact-governance";
import type { ReadinessEvidenceTrustClass } from "@/lib/domain/enforcement-contract";
import type { PersistenceGovernanceDecision } from "@/lib/domain/persistence-governance";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";

export const CANONICAL_SCENE_GENERATION_RUNTIME_ID = "canonical_scene_generation_v1";

function authorityClassFromRun(
  persistence: PersistenceGovernanceDecision,
  governanceMerge: boolean,
  realismValid: boolean | null,
  hgValid: boolean | null
): import("@/lib/domain/canonical-artifact-governance").ArtifactAuthorityClass {
  if (persistence.persistedTruthLabel === "blocked_invalid_realism" || persistence.persistedTruthLabel === "blocked_invalid_human_gravity") {
    return "blocked_from_save";
  }
  if (persistence.persistedTruthLabel === "save_overridden_despite_invalid_realism" || persistence.persistedTruthLabel === "save_overridden_despite_invalid_human_gravity") {
    return "invalidated";
  }
  if (!governanceMerge) return "advisory_runtime";
  if (realismValid === false || hgValid === false) return "invalidated";
  return "canonical_production";
}

function trustFromAuthority(
  authority: import("@/lib/domain/canonical-artifact-governance").ArtifactAuthorityClass
): ReadinessEvidenceTrustClass {
  switch (authority) {
    case "canonical_production":
      return "authoritative_production";
    case "advisory_runtime":
    case "simulation_proof":
      return "observational_only";
    case "incomplete":
      return "qualified_production";
    case "invalidated":
    case "blocked_from_save":
      return "inadmissible_for_runtime_governance";
    default:
      return "observational_only";
  }
}

export function buildArtifactTruthStamp(input: {
  sceneId: string;
  sceneGenerationInputHash: string | null;
  /** When false, save eligibility is vacuously non-downgraded (no save attempted). */
  saveGenerationTextRequested: boolean;
  run: Pick<
    SceneGenerationRunResult,
    | "canonicalPreGeneration"
    | "proseRealism"
    | "humanGravityValidation"
    | "savedGenerationText"
    | "generationTextSaveBlockedByRealism"
    | "generationTextSaveBlockedByHumanGravity"
  >;
  persistence: PersistenceGovernanceDecision;
}): ArtifactTruthStamp {
  const governanceMerge = Boolean(input.run.canonicalPreGeneration?.governanceMergeApplied);
  const realismValid = input.run.proseRealism?.realismTruth.sceneOutputValidUnderRealismRules ?? null;
  const hgValid = input.run.humanGravityValidation?.humanGravityTruth.sceneOutputValidUnderNoResetRules ?? null;

  const authorityClass = authorityClassFromRun(input.persistence, governanceMerge, realismValid, hgValid);
  const readinessEvidenceTrustClass = trustFromAuthority(authorityClass);

  const invalidationOrDowngradeReasons: string[] = [];
  if (realismValid === false) invalidationOrDowngradeReasons.push("prose_realism_invalid");
  if (hgValid === false) invalidationOrDowngradeReasons.push("human_gravity_no_reset_invalid");
  if (!governanceMerge) invalidationOrDowngradeReasons.push("governance_merge_not_applied");

  return {
    contractVersion: CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION,
    stampedAtIso: new Date().toISOString(),
    sceneId: input.sceneId,
    sceneGenerationInputHash: input.sceneGenerationInputHash,
    authorityClass,
    enforcementClassesRepresented: ["cluster4_governance", "cluster5_prose_realism", "cluster6_human_gravity"].filter(
      (_, i) => [governanceMerge, input.run.proseRealism != null, input.run.humanGravityValidation != null][i]
    ),
    deterministicOrSampleSeeded: "neither",
    validationSummary: {
      governanceMergeApplied: governanceMerge,
      realismValid,
      humanGravityNoResetValid: hgValid,
    },
    saveEligibility: {
      contractVersion: CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION,
      eligibleForCanonicalGenerationTextSave:
        !input.saveGenerationTextRequested || input.persistence.mayDescribeAsCanonicalReady,
      blockedReasons: input.persistence.blockedReasons,
      saveOverrideActive:
        input.persistence.overridesApplied.allowSaveOnInvalidRealism ||
        input.persistence.overridesApplied.allowSaveOnInvalidHumanGravity,
      saveOverrideLabels: [
        ...(input.persistence.overridesApplied.allowSaveOnInvalidRealism ? ["allowSaveOnInvalidRealism"] : []),
        ...(input.persistence.overridesApplied.allowSaveOnInvalidHumanGravity ? ["allowSaveOnInvalidHumanGravity"] : []),
      ],
    },
    readinessEvidenceTrustClass,
    invalidationOrDowngradeReasons,
    canonicalProvenanceNotes: input.run.canonicalPreGeneration?.preparationPath
      ? [`preparationPath:${input.run.canonicalPreGeneration.preparationPath}`]
      : [],
  };
}

export function buildSceneGenerationCanonicalArtifactRecord(input: {
  runId: string;
  sceneId: string;
  sceneGenerationInputHash: string | null;
  saveGenerationTextRequested: boolean;
  run: SceneGenerationRunResult;
  persistence: PersistenceGovernanceDecision;
}): CanonicalArtifactRecord {
  const truthStamp = buildArtifactTruthStamp({
    sceneId: input.sceneId,
    sceneGenerationInputHash: input.sceneGenerationInputHash,
    saveGenerationTextRequested: input.saveGenerationTextRequested,
    run: input.run,
    persistence: input.persistence,
  });

  return {
    contractVersion: CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION,
    artifactId: `scene_gen:${input.sceneId}:${input.runId}`,
    artifactType: "scene_generation_run",
    runtimeId: CANONICAL_SCENE_GENERATION_RUNTIME_ID,
    runtimePathLabel: input.run.canonicalPreGeneration?.preparationPath ?? "unknown",
    truthStamp,
    validationFlags: [
      ...(truthStamp.authorityClass === "canonical_production" ? ["cluster7_canonical_artifact"] : ["cluster7_non_canonical_artifact"]),
    ],
  };
}
