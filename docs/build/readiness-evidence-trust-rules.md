# Readiness Evidence Trust Rules (Cluster 2)

## API

**Authoritative production readiness** (certification-grade) uses `evaluateReadinessEvidenceTrustRecord(subsystemDeclaration)` in `lib/services/enforcement-registry-service.ts`.

`classifyReadinessEvidenceTrust(enforcementClass)` (and deprecated alias `evaluateReadinessEvidenceTrust`) returns a `ReadinessEvidenceTrustRecord` with **coarse** `trustClass` / `mayCountAsRuntimeReadinessProof` only; it always sets `mayCountAsAuthoritativeProductionReadinessEvidence: false` because enforcement class alone is insufficient.

`ReadinessEvidenceTrustRecord` fields:

- `trustClass` — `authoritative_production` | `qualified_production` | `observational_only` | `inadmissible_for_runtime_governance` | `disallowed_non_production`
- `mayCountAsRuntimeReadinessProof` — looser bar (reports/CI surfaces)
- `mayCountAsAuthoritativeProductionReadinessEvidence` — **strict** bar for production-readiness certification
- `readinessTrustAllowanceRuleId` — parsed from `readiness_authoritative_evidence_allow:<ruleId>` when an explicit exception applies
- `requiresExplicitQualifier` — visible qualification required
- `notes` — human-readable rationale

## Authoritative production-readiness rule

`mayCountAsAuthoritativeProductionReadinessEvidence` is **true** only if either:

1. **Default path:** `enforcementClass` is `hard_enforced_runtime` or `soft_enforced_runtime`, the subsystem **participates in the canonical production runtime path**, **and** it **affects canonical output or blocks invalid execution** on that path; **and** it is **not** in a gated category below; **and** `deterministicOrSampleSeeded === "neither"`, **or**

2. **Explicit machine-readable allow:** `validationFlags` contains `readiness_authoritative_evidence_allow:<ruleId>` (see `READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX` in `lib/domain/enforcement-contract.ts`). This is the only way for gated categories or deterministic/sample-seeded runs to count as authoritative.

**Gated (not authoritative without explicit allow):** `validation_only`, `cockpit_only`, `report_only`, `advisory_runtime`, `test_only`, `not_implemented`, `docs_only`, `code_exists_not_wired`, `deprecated`, **or** any `deterministicOrSampleSeeded` other than `"neither"`.

## Enforcement truth (production-enforced label)

Subsystems labeled `hard_enforced_runtime` or `soft_enforced_runtime` **must** satisfy `meetsProductionEnforcedTruth`: `participatesInCanonicalRuntime && (affectsCanonicalOutput || canBlockInvalidExecution)`. Otherwise the registry reports `invalid_production_enforced_label`.

## Advisory readiness ambiguity

If an `advisory_runtime` subsystem must influence readiness scoring, set `canAffectReadiness: true` **only** with `validationFlags` containing `readiness_explicit_allow`; otherwise the registry lists the id under `ambiguousSubsystems`.
