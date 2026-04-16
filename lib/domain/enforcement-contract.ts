import { z } from "zod";

import type { RuntimeAuthorityClass } from "@/lib/domain/runtime-authority";

/**
 * Cluster 2 — Advisory vs enforced semantic contract.
 *
 * `EnforcementClass` describes how a subsystem participates in truth and blocking,
 * independent of whether code exists (`runtime-authority` covers runtime shells).
 */

export const ENFORCEMENT_CLASSES = [
  "not_implemented",
  "docs_only",
  "code_exists_not_wired",
  "validation_only",
  "cockpit_only",
  "report_only",
  "advisory_runtime",
  "soft_enforced_runtime",
  "hard_enforced_runtime",
  "test_only",
  "deprecated",
] as const;

export type EnforcementClass = (typeof ENFORCEMENT_CLASSES)[number];

export const enforcementClassSchema = z.enum(ENFORCEMENT_CLASSES);

export type DemoSafeStatus = "demo_safe" | "demo_with_warnings" | "non_demo_safe";

export const demoSafeStatusSchema = z.enum(["demo_safe", "demo_with_warnings", "non_demo_safe"]);

export type DeterministicOrSampleSeeded = "neither" | "deterministic" | "sample_seeded" | "mixed";

export const deterministicOrSampleSeededSchema = z.enum([
  "neither",
  "deterministic",
  "sample_seeded",
  "mixed",
]);

/**
 * Canonical-output effect: how persisted / published narrative truth is influenced.
 */
export type CanonicalOutputEffectClass =
  | "none"
  | "observability_only"
  | "advisory_shaping"
  | "soft_constraint"
  | "hard_gate_or_mutation";

export const canonicalOutputEffectClassSchema = z.enum([
  "none",
  "observability_only",
  "advisory_shaping",
  "soft_constraint",
  "hard_gate_or_mutation",
]);

export type SubsystemEnforcementDeclaration = {
  subsystemId: string;
  subsystemName: string;
  enforcementClass: EnforcementClass;
  /** Aligns with `RuntimeAuthorityDeclaration.authorityClass` for the primary runtime surface. */
  authorityClass: RuntimeAuthorityClass;
  /** True when the subsystem is on the canonical production scene/chapter path (see runtime authority lock). */
  participatesInCanonicalRuntime: boolean;
  affectsCanonicalOutput: boolean;
  canBlockInvalidExecution: boolean;
  /** Whether readiness/certification may treat evidence from this subsystem as governance-relevant. */
  canAffectReadiness: boolean;
  visibleInCockpit: boolean;
  visibleInReports: boolean;
  demoSafeStatus: DemoSafeStatus;
  deterministicOrSampleSeeded: DeterministicOrSampleSeeded;
  /** Primary runtime this subsystem is attributed to (see `runtime-authority-registry-service`). */
  primaryRuntimeId: string;
  canonicalOutputEffectClass: CanonicalOutputEffectClass;
  semanticTruthNotes: string;
  validationFlags: string[];
};

export const subsystemEnforcementDeclarationSchema: z.ZodType<SubsystemEnforcementDeclaration> = z.object({
  subsystemId: z.string().min(1),
  subsystemName: z.string().min(1),
  enforcementClass: enforcementClassSchema,
  authorityClass: z.enum([
    "canonical_production",
    "advisory_runtime",
    "simulation_only",
    "report_only",
    "test_only",
    "legacy_or_duplicate",
    "deprecated",
  ]),
  participatesInCanonicalRuntime: z.boolean(),
  affectsCanonicalOutput: z.boolean(),
  canBlockInvalidExecution: z.boolean(),
  canAffectReadiness: z.boolean(),
  visibleInCockpit: z.boolean(),
  visibleInReports: z.boolean(),
  demoSafeStatus: demoSafeStatusSchema,
  deterministicOrSampleSeeded: deterministicOrSampleSeededSchema,
  primaryRuntimeId: z.string().min(1),
  canonicalOutputEffectClass: canonicalOutputEffectClassSchema,
  semanticTruthNotes: z.string(),
  validationFlags: z.array(z.string()),
});

export type EnforcementSemanticViolation = {
  code: string;
  severity: "error" | "warning";
  subsystemId?: string;
  message: string;
};

export type EnforcementRegistry = {
  contractVersion: "1";
  canonicalRuntimeId: string;
  generatedAtIso: string;
  subsystemDeclarations: SubsystemEnforcementDeclaration[];
  semanticViolations: EnforcementSemanticViolation[];
  ambiguousSubsystems: string[];
  validationFlags: string[];
};

export const ENFORCEMENT_REGISTRY_CONTRACT_VERSION = "1" as const;

/** Trust tier for readiness / certification evidence (machine-usable). */
export const READINESS_EVIDENCE_TRUST_CLASSES = [
  "authoritative_production",
  "qualified_production",
  "observational_only",
  "inadmissible_for_runtime_governance",
  "disallowed_non_production",
] as const;

export type ReadinessEvidenceTrustClass = (typeof READINESS_EVIDENCE_TRUST_CLASSES)[number];

/** Prefix for {@link SubsystemEnforcementDeclaration.validationFlags}: `readiness_authoritative_evidence_allow:<ruleId>`. */
export const READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX = "readiness_authoritative_evidence_allow:" as const;

export type ReadinessEvidenceTrustRecord = {
  enforcementClass: EnforcementClass;
  trustClass: ReadinessEvidenceTrustClass;
  /** Looser readiness surface (reports/CI); prefer {@link mayCountAsAuthoritativeProductionReadinessEvidence} for certification. */
  mayCountAsRuntimeReadinessProof: boolean;
  /**
   * Authoritative **production** readiness: requires canonical path participation + output/block effect,
   * and never for ineligible classes or deterministic/sample-seeded runs unless `readiness_authoritative_evidence_allow:*` is set.
   */
  mayCountAsAuthoritativeProductionReadinessEvidence: boolean;
  requiresExplicitQualifier: boolean;
  /** Machine-readable rule id when `readiness_authoritative_evidence_allow:<id>` grants an exception with qualification. */
  readinessTrustAllowanceRuleId: string | null;
  notes: string;
};
