# Enforcement Contract Specification (Cluster 2)

## Purpose

Distinguish **implementation existence** from **runtime enforcement**, **canonical-output effects**, and **readiness evidence admissibility**. This complements the runtime shell model in `lib/domain/runtime-authority.ts` with **per-subsystem** semantic declarations.

## Machine-usable sources

| Artifact | Role |
|----------|------|
| `lib/domain/enforcement-contract.ts` | Types, enums, Zod schemas (`subsystemEnforcementDeclarationSchema`). |
| `lib/services/enforcement-registry-service.ts` | Authoritative subsystem declarations + validation + readiness trust mapping. |
| `reports/enforcement-registry-snapshot.json` | Generated snapshot (`npm run verify:enforcement-contract`). |

## EnforcementClass

| Value | Meaning |
|-------|---------|
| `not_implemented` | No executable surface. |
| `docs_only` | Specification/docs only. |
| `code_exists_not_wired` | Code present but not on a governed path. |
| `validation_only` | CI/tests/validators; no production narrative effect. |
| `cockpit_only` | Operator UI aggregate; observational. |
| `report_only` | Reports/exports; may summarize readiness but not enforce generation. |
| `advisory_runtime` | Runs in a runtime context but does not hard-govern canonical truth. |
| `soft_enforced_runtime` | Constrains or gates with softer blocking (qualified). |
| `hard_enforced_runtime` | Participates in canonical path and mutates or hard-blocks. |
| `test_only` | Test harness only. |
| `deprecated` | Do not use for new claims. |

## SubsystemEnforcementDeclaration (fields)

Each subsystem declares: `subsystemId`, `subsystemName`, `enforcementClass`, `authorityClass` (aligned with runtime authority), `participatesInCanonicalRuntime`, `affectsCanonicalOutput`, `canBlockInvalidExecution`, `canAffectReadiness`, `visibleInCockpit`, `visibleInReports`, `demoSafeStatus`, `deterministicOrSampleSeeded`, `primaryRuntimeId`, `canonicalOutputEffectClass`, `semanticTruthNotes`, `validationFlags` (may include `readiness_authoritative_evidence_allow:<ruleId>` for explicit authoritative-readiness exceptions).

## Canonical runtime ground truth

`canonicalRuntimeId` is **`scene_chapter_production_runtime`**, identical to `buildRuntimeAuthorityRegistry().canonicalRuntimeId`.

### Enforcement truth rule (machine-checked)

`hard_enforced_runtime` and `soft_enforced_runtime` are **invalid** unless **both** hold:

1. `participatesInCanonicalRuntime === true`
2. `affectsCanonicalOutput || canBlockInvalidExecution`

Violation code: `invalid_production_enforced_label`. Helpers: `meetsProductionEnforcedTruth`, `evaluateReadinessEvidenceTrustRecord`.

### Readiness evidence rule (authoritative production)

`evaluateReadinessEvidenceTrustRecord` sets `mayCountAsAuthoritativeProductionReadinessEvidence`. Subsystems that are `validation_only`, `cockpit_only`, `report_only`, `advisory_runtime`, other non-production classes, **or** deterministic/sample-seeded (`deterministicOrSampleSeeded !== "neither"`) **cannot** be authoritative unless `validationFlags` includes `readiness_authoritative_evidence_allow:<ruleId>` (`READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX`).

## Cockpit extension

`AuthorCommandCockpitBundle.enforcementSemanticTruth` (see `lib/domain/author-command-cockpit.ts`) carries per-panel enforcement truth for populated optional sections. Panels remain **observational**; the bundle does not mutate canonical narrative truth (`mutatesCanonicalTruth: false`).

## Validation API

- `buildEnforcementRegistry()` — full registry including `semanticViolations` (errors + warnings).
- `validateEnforcementRegistry()` — throws if any **error**-severity violation exists.
- `analyzeSubsystemEnforcementSemantics(declarations, canonicalRuntimeId)` — validate arbitrary declaration sets (CI/extensions).
