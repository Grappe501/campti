# Chunk 8 - Traceability / Ownership / Repo Hygiene Inventory

## Task 1 - Core hardened surfaces and ownership map

| Surface | Primary owning modules | Authoritative for | Explicitly not authoritative for | Depends on | Deferred consolidation points | Ownership ambiguity |
|---|---|---|---|---|---|---|
| Certification enforcement | `lib/certification/certification-enforcement.ts`, `lib/certification/certification-mode.ts` | strict/default certification result semantics, critical skip handling, command/check aggregation | executing subsystem checks, migration probing internals | `scripts/verify-prelaunch.ts`, `scripts/verify-full-system.ts`, verify commands | none required now | low |
| Migration readiness / runtime dependency truth | `lib/certification/migration-readiness-check.ts`, `scripts/verify-migration-readiness.ts`, `lib/services/runtime-dependency-guard.ts` | migration drift classification, dependency schema checks, readiness gating signals | applying migrations, seed orchestration, app feature behavior | Prisma CLI, runtime dependency guard tests, prelaunch harness | keep migration and dependency checks separate but clearly mapped | low |
| Contract governance / registry authority | `lib/contracts/contract-registry.ts`, `scripts/check-contract-registry-drift.ts` | registered contract/version authority, read/write version validation, optional schema parsing | payload business logic semantics, full payload meaning beyond schema | domain contract modules, emitting services | schema strictness on remaining `unknown/passthrough` sections | medium |
| Shared read-model mapping | `lib/services/conversation-read-model-mapper.ts` | canonical mapping of session metadata, identity summary, turn observability | cockpit-specific assembly policy, observability-only fields | cockpit payload service, conversation observer service | possible extraction of additional shared tone/degraded adapters later | low |
| Truth-boundary enforcement | `lib/services/interaction-truth-firewall-service.ts` | plane contamination assertions, session metadata allowed-key gate | persistence orchestration, domain-level policy tuning | write-boundary services, tests, cockpit/session services | optional shared serializer/parsers around session metadata patches | medium |
| Degraded/resilience/moderation policy ownership | `lib/services/degraded-interaction-policy-service.ts`, `lib/services/provider-resilience-service.ts`, `lib/services/moderation-service.ts`, `lib/services/reader-cockpit-command-service.ts` | degraded policy resolution, provider retry/fallback behavior, moderation classification, turn-time enforcement and debit gating | narrative content semantics, entitlement model definition | balance/entitlement services, cockpit payload, observability projection | further decomposition of cockpit orchestration policy branches | medium |
| Full-system verification umbrella | `scripts/verify-full-system.ts` | release umbrella execution ordering and certification aggregation | subsystem test intent/details, local dev workflows | verify scripts in `package.json`, certification enforcement | command catalog/coverage mapping doc upkeep | low |
| Cockpit orchestration ownership | `lib/services/reader-cockpit-command-service.ts` | turn lifecycle orchestration, moderation/degraded/debit interaction policy routing, session command envelopes | raw persistence schema ownership, contract registry authority | session/turn/balance/entitlement/moderation/resilience services | split policy routing helpers from orchestration host if complexity grows | medium |
| Observability ownership | `lib/services/conversation-observer-service.ts`, `lib/services/narrative-interaction-observability-bridge.ts`, `lib/services/degraded-interaction-observability-service.ts` | non-canonical observability snapshots/summaries, degraded-state projection | canonical truth writes, story generation decisions | read-model mapper, identity refresh, truth firewall | optional consolidation of degraded metadata serialization/parsing | medium |
| Author inspection ownership | `lib/services/authorial-inspection-service.ts`, `app/actions/author-inspection.ts` | author-only inspection payload assembly and role-gated boundary | reader-cockpit behavior, canonical truth mutation | identity snapshot, anchor comparison, permission service, contract registry | none required now | low |

## Task 2 - High-value ownership ambiguities tightened now

1. **Migration-readiness duplication**  
   - Fixed by introducing shared authority module `lib/certification/migration-readiness-check.ts`.
   - `verify:migrations` and prelaunch certification now use the same migration readiness logic.

2. **Umbrella-vs-proof-point clarity for full-system verification**  
   - Clarified in `scripts/verify-full-system.ts` comment that umbrella orchestration does not replace subsystem-local verify ownership.

3. **Build artifact intent in repo docs**  
   - Added `docs/build/README.md` to clarify committed evidence vs runtime source-of-truth code boundaries.

## Task 3 - Release traceability improvements

- Migration readiness now has one authoritative evaluator reused by both direct migration verification and prelaunch certification.
- Build-doc artifact intent is explicit and scoped.
- Ownership/authority table in this document provides release-facing traceability for hardened surfaces.

## Task 4 - Artifact hygiene review

- Intended committed evidence artifacts:
  - `docs/build/chunk*.md`
  - `docs/build/full-system-certification-audit.md`
  - `docs/build/p4-prelaunch-readiness-checklist.md`
  - `docs/build/master-build-spine.md`
- Hygiene clarification added:
  - `docs/build/README.md` explicitly classifies `docs/build` as audit/supporting docs, not runtime behavior authority.
- No broad deletion performed in this phase.

## Task 5 - Duplicated governance/traceability signals

| Signal duplication | Status | Why | Strategy |
|---|---|---|---|
| Migration-readiness regex/check logic in `verify-prelaunch` and `verify-migration-readiness` | **Fixed now** | duplicated authority path risked drift in strict behavior | shared module (`lib/certification/migration-readiness-check.ts`) now authoritative |
| Contract drift signal vs registry schema enforcement | acceptable intentional | drift script is heuristic token scan; registry is runtime authority | keep both; drift script remains advisory detection |
| Degraded metadata write-shape in cockpit vs read-shape in degraded observability | acceptable but medium risk | duplicated key knowledge (`degradedInteraction`) could drift | future small shared serializer/parser helper |
| Write-boundary assertion calls repeated across services | acceptable intentional | boundary checks are explicit at write points | possible thin wrappers per bounded context later |
| Full-system umbrella verification vs subsystem verify scripts | acceptable intentional | umbrella is release gate, subsystem scripts are proof points | keep explicit mapping in docs; avoid hidden checks |

## Unresolved ownership ambiguities still remaining

1. Cockpit command service still centralizes several policy branches (moderation + degraded + cost + debit), increasing long-term ownership density.
2. Degraded metadata contract remains partially implicit across write/read paths.
3. Contract schemas still include selected `unknown`/`passthrough` zones where operational shape authority is weaker than ideal.

