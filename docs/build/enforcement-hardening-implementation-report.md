# Enforcement Hardening Implementation Report (Cluster 2)

## What was audited

- Runtime orchestration: `scene-generation-service`, `scene-generation-llm-adapter`, `chapter-assembly-service`, `scene-generation-engine-service`, `book1-regeneration-loop-service` (usage patterns vs canonical path).
- Higher-order narrative systems as represented in regeneration and author cockpit: chapter state, psychology, threads, composition, sequence architecture, prose constraints, literary devices, ENCS, EEGS, HCEL alias, narrator presence, routes/callbacks.
- Operator/evidence: author command cockpit bundle, certification/report scripts pattern, verification tests.
- Ground truth cross-check: `docs/build/canonical-runtime-path-map.md`, `lib/services/runtime-authority-registry-service.ts`.

## Existing systems reused

- `RuntimeAuthorityRegistry` / `RuntimeAuthorityStamp` (`lib/domain/runtime-authority.ts`, `runtime-authority-registry-service.ts`).
- `AuthorCommandCockpitBundle` (`lib/domain/author-command-cockpit.ts`) extended with `enforcementSemanticTruth`.
- Contract governance patterns (Zod, explicit version constants).

## New files

- `lib/domain/enforcement-contract.ts`
- `lib/services/enforcement-registry-service.ts`
- `lib/services/enforcement-cockpit-truth-service.ts`
- `lib/services/enforcement-registry-service.test.ts`
- `lib/services/enforcement-cockpit-truth-service.test.ts`
- `scripts/verify-enforcement-contract.ts`
- `docs/build/enforcement-contract-spec.md`
- `docs/build/enforcement-registry.md`
- `docs/build/advisory-vs-enforced-classification-report.md`
- `docs/build/readiness-evidence-trust-rules.md`
- `docs/build/enforcement-hardening-implementation-report.md` (this file)

## Existing files updated

- `lib/domain/author-command-cockpit.ts` — cockpit enforcement truth types + optional bundle field.
- `lib/services/author-command-cockpit-service.ts` — populates `enforcementSemanticTruth`.
- `lib/services/runtime-authority-registry-service.ts` — canonical production entrypoints aligned with actual production path (LLM adapter vs engine bundle).
- `package.json` — `verify:enforcement-contract`.

## Enforcement contract model summary

`EnforcementClass` (10 values) + `SubsystemEnforcementDeclaration` + `EnforcementRegistry` with `semanticViolations`, `ambiguousSubsystems`, and validation helpers. Zod schema: `subsystemEnforcementDeclarationSchema`.

## Subsystem declaration summary

30+ subsystem rows covering canonical pipeline, LLM advisory contract, QA advisories, regeneration loop, narrative layers, cockpit, reports, verification, simulation, and deprecated surfaces. Each row sets participation in canonical runtime, output effect, blocking, demo safety, and deterministic/sample-seeded posture.

## Semantic validation summary

- `validateEnforcementRegistry` fails on error-level violations (e.g. hard-enforced without effect).
- `analyzeSubsystemEnforcementSemantics` supports custom lists.
- Warnings for edge cases (e.g. deterministic seeding on hard-enforced without waiver flag).

## Readiness evidence trust summary

`classifyReadinessEvidenceTrust` maps enforcement classes to trust tiers; advisory and cockpit/report surfaces do not qualify as runtime governance proof without explicit flags.

## Cockpit semantic truth summary

`buildCockpitEnforcementSemanticTruth` attaches per-panel enforcement metadata for populated cockpit sections; warns on non-canonical `runtimeId`, deterministic/sample-seeded panels, and non-demo-safe panels.

## Advisory-vs-enforced gap summary

See `advisory-vs-enforced-classification-report.md` for Cluster 3 promotion candidates and non-promotion constraints.

## Risks / deferred items

- `reports/enforcement-registry-snapshot.json` is generated; regenerate after declaration changes.
- Further wiring of subsystem declarations into individual JSON report envelopes (beyond cockpit) can be incremental.
- Full `tsc --noEmit` still reports pre-existing project errors unrelated to this pass.

## Exact next recommended implementation step (Cluster 3)

Pick **one** high-leverage subsystem from the promotion list (e.g. thread density or beat-chain invariants) and define concrete **production** hooks in `loadSceneGenerationInput` / `runSceneGeneration` with matching enforcement-class promotion and tests.
