import type { ReadinessEvidenceTrustClass } from "@/lib/domain/enforcement-contract";

export const CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION = "1" as const;

/** How an artifact participates in production truth vs observation. */
export const ARTIFACT_AUTHORITY_CLASSES = [
  "canonical_production",
  "advisory_runtime",
  "simulation_proof",
  "incomplete",
  "invalidated",
  "blocked_from_save",
] as const;
export type ArtifactAuthorityClass = (typeof ARTIFACT_AUTHORITY_CLASSES)[number];

/** Operator-visible trust tier for certification (aligns with readiness evidence classes). */
export type ArtifactEvidenceTrustClass = ReadinessEvidenceTrustClass;

export type ArtifactSaveEligibility = {
  contractVersion: typeof CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION;
  eligibleForCanonicalGenerationTextSave: boolean;
  blockedReasons: string[];
  /** Explicit operator overrides (must be auditable). */
  saveOverrideActive: boolean;
  saveOverrideLabels: string[];
};

export type ArtifactTruthStamp = {
  contractVersion: typeof CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION;
  stampedAtIso: string;
  sceneId: string;
  /** Same family as canonical scene-generation hash when present. */
  sceneGenerationInputHash: string | null;
  authorityClass: ArtifactAuthorityClass;
  enforcementClassesRepresented: string[];
  deterministicOrSampleSeeded: "neither" | "deterministic" | "sample_seeded" | "mixed";
  validationSummary: {
    governanceMergeApplied: boolean;
    realismValid: boolean | null;
    humanGravityNoResetValid: boolean | null;
  };
  saveEligibility: ArtifactSaveEligibility;
  readinessEvidenceTrustClass: ArtifactEvidenceTrustClass;
  invalidationOrDowngradeReasons: string[];
  canonicalProvenanceNotes: string[];
};

export type CanonicalArtifactRecord = {
  contractVersion: typeof CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION;
  artifactId: string;
  artifactType: "scene_generation_run" | "chapter_scene_bundle" | "readiness_evidence" | "cockpit_observation";
  runtimeId: string;
  runtimePathLabel: string;
  truthStamp: ArtifactTruthStamp;
  /** Semantic flags propagated end-to-end (drift, overrides, governance). */
  validationFlags: string[];
};

export type ArtifactCanonicalizationReport = {
  contractVersion: typeof CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION;
  runId: string;
  records: CanonicalArtifactRecord[];
  ambiguousArtifacts: string[];
  validationFlags: string[];
};
