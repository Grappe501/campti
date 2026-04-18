import { z } from "zod";

export const RUNTIME_SEMANTIC_INVARIANT_CONTRACT_VERSION = "1" as const;

/**
 * Cluster 7 — semantic invariant model (normative).
 *
 * **CERTIFICATION TRUTH RULE:** A run may not be presented as execution-ready or production-grade unless its
 * readiness/certification evidence is derived from canonical runtime truth, semantically valid artifact records,
 * and non-downgraded save eligibility. (Enforced via `evaluateReadinessCertificationDepth` + cockpit summary.)
 *
 * **ARTIFACT TRUTH RULE:** Any scene/chapter/run artifact that does not preserve authority class, enforcement truth,
 * validation outcome, and save eligibility is invalid as canonical evidence. (Enforced via `evaluateArtifactTruthRule`.)
 *
 * Semantic invariant classes for the canonical narrative runtime (Cluster 7).
 * Shape-level validation is insufficient; these describe runtime meaning and enforcement.
 */
export const RUNTIME_SEMANTIC_INVARIANT_CLASSES = [
  "canonical_truth_invariant",
  "enforcement_truth_invariant",
  "continuity_integrity_invariant",
  "narrator_boundary_invariant",
  "human_gravity_persistence_invariant",
  "no_reset_invariant",
  "prose_realism_integrity_invariant",
  "artifact_truth_invariant",
  "persistence_truth_invariant",
  "readiness_evidence_invariant",
  "hook_continuity_invariant",
] as const;

export type RuntimeSemanticInvariantClass = (typeof RUNTIME_SEMANTIC_INVARIANT_CLASSES)[number];

export const INVARIANT_SEVERITIES = ["hard", "soft", "warning", "info"] as const;
export type InvariantSeverity = (typeof INVARIANT_SEVERITIES)[number];

export const INVARIANT_ENFORCEMENT_MODES = [
  "hard_block",
  "soft_block",
  "advisory",
  "observability_only",
] as const;
export type InvariantEnforcementMode = (typeof INVARIANT_ENFORCEMENT_MODES)[number];

export type RuntimeSemanticInvariant = {
  invariantId: string;
  invariantName: string;
  invariantClass: RuntimeSemanticInvariantClass;
  severity: InvariantSeverity;
  appliesToScopes: Array<"scene" | "chapter" | "book" | "epic" | "cockpit" | "readiness">;
  requiredInputs: string[];
  violationConditions: string[];
  enforcementMode: InvariantEnforcementMode;
  validationFlags: string[];
};

export type InvariantResult = {
  invariantId: string;
  invariantClass: RuntimeSemanticInvariantClass;
  passed: boolean;
  severity: InvariantSeverity;
  enforcementMode: InvariantEnforcementMode;
  message: string | null;
  validationFlags: string[];
};

export type RuntimeSemanticInvariantReport = {
  contractVersion: typeof RUNTIME_SEMANTIC_INVARIANT_CONTRACT_VERSION;
  runId: string;
  sceneId: string;
  invariantResults: InvariantResult[];
  hardViolations: InvariantResult[];
  softViolations: InvariantResult[];
  warnings: InvariantResult[];
  suggestedRepairs: string[];
  validationFlags: string[];
};

/** Machine validation of invariant evaluation output (integration / certification scripts). */
export const InvariantResultSchema = z.object({
  invariantId: z.string(),
  invariantClass: z.string().min(1),
  passed: z.boolean(),
  severity: z.enum(INVARIANT_SEVERITIES),
  enforcementMode: z.enum(INVARIANT_ENFORCEMENT_MODES),
  message: z.string().nullable(),
  validationFlags: z.array(z.string()),
});

export const RuntimeSemanticInvariantReportSchema = z.object({
  contractVersion: z.literal(RUNTIME_SEMANTIC_INVARIANT_CONTRACT_VERSION),
  runId: z.string().min(1),
  sceneId: z.string().min(1),
  invariantResults: z.array(InvariantResultSchema),
  hardViolations: z.array(InvariantResultSchema),
  softViolations: z.array(InvariantResultSchema),
  warnings: z.array(InvariantResultSchema),
  suggestedRepairs: z.array(z.string()),
  validationFlags: z.array(z.string()),
});

/** Catalog: definitions for operators and machine routing; evaluation lives in the invariant service. */
export const RUNTIME_SEMANTIC_INVARIANT_CATALOG: readonly RuntimeSemanticInvariant[] = [
  {
    invariantId: "inv.canonical_governance_merge",
    invariantName: "Canonical governance merge applied when canonical prep is requested",
    invariantClass: "canonical_truth_invariant",
    severity: "hard",
    appliesToScopes: ["scene"],
    requiredInputs: ["canonicalPreGeneration", "applyCanonicalNarrativeGovernance"],
    violationConditions: ["governance expected but bundle missing or governanceMergeApplied false"],
    enforcementMode: "hard_block",
    validationFlags: ["cluster7_canonical_truth"],
  },
  {
    invariantId: "inv.cluster3_pack_integrity",
    invariantName: "Cluster-3 pack validations align with material influences",
    invariantClass: "continuity_integrity_invariant",
    severity: "soft",
    appliesToScopes: ["scene", "chapter"],
    requiredInputs: ["canonicalPreGeneration.packValidations"],
    violationConditions: ["epic continuity / emotional gravity / narrator packs invalid while marked material"],
    enforcementMode: "soft_block",
    validationFlags: ["cluster7_continuity"],
  },
  {
    invariantId: "inv.narrator_presence_valid",
    invariantName: "Narrator presence pack validates when narrator influences are material",
    invariantClass: "narrator_boundary_invariant",
    severity: "soft",
    appliesToScopes: ["scene"],
    requiredInputs: ["canonicalPreGeneration.packValidations.narratorPresence"],
    violationConditions: ["narratorPresence.valid false with material narrator influences"],
    enforcementMode: "advisory",
    validationFlags: ["cluster7_narrator"],
  },
  {
    invariantId: "inv.human_gravity_runtime_coherent",
    invariantName: "Human-gravity runtime influence truth matches profile presence",
    invariantClass: "human_gravity_persistence_invariant",
    severity: "soft",
    appliesToScopes: ["scene"],
    requiredInputs: ["humanGravityRuntime", "canonicalPreGeneration.governanceMergeApplied"],
    violationConditions: ["profile present but runtimeInfluenceTruth marks inactive while gates require activity"],
    enforcementMode: "advisory",
    validationFlags: ["cluster7_human_gravity"],
  },
  {
    invariantId: "inv.no_reset_when_pressured",
    invariantName: "No-reset rules satisfied when upstream pressure is active",
    invariantClass: "no_reset_invariant",
    severity: "hard",
    appliesToScopes: ["scene"],
    requiredInputs: ["humanGravityValidation.humanGravityTruth"],
    violationConditions: ["sceneOutputValidUnderNoResetRules false while save would be treated as canonical"],
    enforcementMode: "hard_block",
    validationFlags: ["cluster7_no_reset"],
  },
  {
    invariantId: "inv.prose_realism_critical",
    invariantName: "Prose realism truth rules satisfied when realism layer ran",
    invariantClass: "prose_realism_integrity_invariant",
    severity: "hard",
    appliesToScopes: ["scene"],
    requiredInputs: ["proseRealism.realismTruth"],
    violationConditions: ["sceneOutputValidUnderRealismRules false while claiming valid canonical output"],
    enforcementMode: "hard_block",
    validationFlags: ["cluster7_prose_realism"],
  },
  {
    invariantId: "inv.scene_output_advisory_envelope",
    invariantName: "Scene generation output remains advisory-only at the contract boundary",
    invariantClass: "artifact_truth_invariant",
    severity: "info",
    appliesToScopes: ["scene"],
    requiredInputs: ["SceneGenerationOutputV1.advisoryOnly"],
    violationConditions: ["advisoryOnly not true"],
    enforcementMode: "observability_only",
    validationFlags: ["cluster7_artifact_boundary"],
  },
  {
    invariantId: "inv.persistence_matches_block_flags",
    invariantName: "Persisted generation text matches save-block semantics",
    invariantClass: "persistence_truth_invariant",
    severity: "hard",
    appliesToScopes: ["scene"],
    requiredInputs: ["savedGenerationText", "generationTextSaveBlockedByRealism", "generationTextSaveBlockedByHumanGravity"],
    violationConditions: ["saved true while blocked flag true", "saved false while claiming canonical persistence without block reason"],
    enforcementMode: "hard_block",
    validationFlags: ["cluster7_persistence"],
  },
  {
    invariantId: "inv.enforcement_truth_scene_scope",
    invariantName: "Enforcement semantic truth available on canonical paths when cockpit/registry is wired",
    invariantClass: "enforcement_truth_invariant",
    severity: "info",
    appliesToScopes: ["scene", "cockpit"],
    requiredInputs: ["EnforcementRegistry", "CockpitEnforcementSemanticTruth"],
    violationConditions: ["production_enforced label without canonical path participation"],
    enforcementMode: "observability_only",
    validationFlags: ["cluster7_enforcement_truth"],
  },
  {
    invariantId: "inv.readiness_evidence_not_inflated",
    invariantName: "Readiness evidence trust is not upgraded from observational-only inputs",
    invariantClass: "readiness_evidence_invariant",
    severity: "warning",
    appliesToScopes: ["readiness", "cockpit"],
    requiredInputs: ["ReadinessEvidenceTrustClass", "subsystem declarations"],
    violationConditions: ["authoritative_production claimed without eligible enforcement path"],
    enforcementMode: "advisory",
    validationFlags: ["cluster7_readiness"],
  },
  {
    invariantId: "inv.hook_pressure_consistent_with_continuity",
    invariantName: "Hard hook pressure must not assert while epic continuity pack is invalid",
    invariantClass: "hook_continuity_invariant",
    severity: "soft",
    appliesToScopes: ["scene", "chapter"],
    requiredInputs: ["canonicalPreGeneration.cluster3RuntimeActivationTruth", "packValidations.epicContinuity"],
    violationConditions: ["hcelHookHardSignalsActive true with invalid epic continuity — hook/continuity semantic drift"],
    enforcementMode: "advisory",
    validationFlags: ["cluster7_hook_continuity"],
  },
] as const;