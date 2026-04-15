# Full-System Certification Audit (P0-X)

Date: 2026-04-15  
Scope: Repo-wide certification and hardening-readiness audit before any story expansion.

## 1) Executive Summary

Current state: the architecture is ambitious and mostly well-layered, with strong service decomposition around scene generation, interaction loops, and policy-aware degraded behavior. Core verification scripts pass broadly, but the runtime database is materially behind the schema/migration baseline, causing critical harness and operational paths to fail or silently downgrade to "skipped" checks.

Story expansion should **not** proceed now.

Top 10 blockers / upgrade priorities:

1. **Migration drift is severe**: `npx prisma migrate status` reports 30 unapplied migrations (including conversation, ledger, balance, entitlement, and cockpit-era tables).
2. **Deterministic interaction harness is blocked**: `npm run verify:deterministic-interaction-harness` fails with missing `ReaderInteractionLedgerEntry` table (`P2021`).
3. **Prelaunch can pass while skipping critical DB checks**: `verify:prelaunch` returns success even when entitlement/harness checks skip due missing tables.
4. **Operational maintenance script fails in current env**: `npm run ops:background-maintenance` fails on missing `CharacterConversationSession`.
5. **Contract governance coverage is partial**: registry has 15 contracts, but key payloads (`ReaderCockpitPayload`, `AuthorInspectionPayload`, observability bridge summary) are outside registry governance.
6. **Validation depth is uneven**: many registry schemas are `passthrough` and allow shape drift beyond version tag checks.
7. **Duplicate read-model logic exists**: `conversation-observer-service` and `reader-cockpit-payload-service` duplicate mapping helpers and can drift.
8. **Boundary firewall enforcement is narrow**: `assertMemoryBoundary` is implemented but only used in select paths, not globally enforced at all write boundaries.
9. **Large uncommitted core surface**: many new action/domain/service files are still untracked in the current working snapshot, reducing certifiability and release traceability.
10. **Moderation and resilience policies are mostly heuristic**: workable for now, but still simplistic and vulnerable to bypass/edge cases before scale.

## 2) System Inventory

Status legend: `premier` / `acceptable` / `provisional` / `duplicate` / `deprecated`.

| Subsystem family | Role | Primary files | Key contracts/models | Status |
|---|---|---|---|---|
| truth/genealogy/source ingestion | Temporal truth firewall for narrative sources | `lib/services/narrative-source-service.ts`, `lib/services/scene-generation-input-loader.ts` | `NarrativeSource`, `worldStateFallsWithinChronologyWindow` | acceptable |
| world-state chronology | Canonical chronology index resolution and ordering | `lib/services/world-state-chronology.ts`, `lib/domain/world-state-chronology.ts` | `WorldStateReference.chronologyIndex` | acceptable |
| epic spine / book mapping | Book/world-state alignment and overlap prevention | `lib/services/epic-book-service.ts`, `lib/services/world-book-mapper.ts` | `EpicBook`, `Book.movementIndex` mapping | acceptable |
| scene generation | Deterministic input load/hash + model generation + contract validation | `lib/services/scene-generation-service.ts`, `lib/scene-generation/canonical-scene-generation-hash.ts`, `lib/scene-generation/scene-generation-llm-adapter.ts` | `sceneGenerationInput`, `sceneGenerationOutput` | premier |
| repair/revision/job execution | Plan + execute repair; queue-backed revision jobs | `lib/services/scene-repair-planning-service.ts`, `lib/services/scene-repair-execution-service.ts`, `lib/services/revision-job-runner.ts` | `SceneRepairPlan`, `RevisionJob` payloads | acceptable |
| cognition / knowledge boundary | Bounded character knowledge and identity snapshot policy | `lib/services/conversational-identity-refresh-service.ts`, `lib/services/interaction-truth-firewall-service.ts` | `ConversationalIdentitySnapshot`, `NarrativeMemoryPlane` | acceptable |
| reader memory / relationship progression | Reader-character dyadic memory and progression | `lib/services/reader-memory-writeback-service.ts`, `lib/services/reader-relationship-progression-service.ts` | `CharacterReaderMemory`, `ReaderRelationshipProgression` | acceptable |
| emotional continuity / drift | Continuity tracking and anchor drift summaries | `lib/services/conversation-emotional-continuity-service.ts`, `lib/services/conversation-anchor-service.ts` | `ConversationEmotionalContinuity` | acceptable |
| conversation sessions / turns / re-entry | Persisted session lifecycle and turn ledgering | `lib/services/character-conversation-session-service.ts`, `lib/services/character-conversation-turn-service.ts`, `lib/services/story-reentry-continuity-service.ts` | `CharacterConversationSession`, `CharacterConversationTurn` | premier (code), provisional (runtime DB not migrated) |
| response generation / guardrails | Turn generation, assembly, policy checks | `lib/services/character-reply-generation-service.ts`, `lib/services/character-response-assembly-service.ts`, `lib/services/character-response-guardrail-service.ts` | `characterResponse`, `conversationalTurnInput` | premier |
| voice presentation / synthesis | Voice readiness payload and provider adapter | `lib/voice/voice-presentation-service.ts`, `lib/voice/elevenlabs-adapter.ts` | `VoicePresentationPayload`, `voiceSynthesisRequest` | acceptable |
| cockpit backend / UI | Reader command orchestration + shell UI | `lib/services/reader-cockpit-command-service.ts`, `lib/services/reader-cockpit-payload-service.ts`, `app/read/cockpit/page.tsx`, `components/read/reader-cockpit-shell.tsx` | `ReaderCockpitPayload` | acceptable backend, provisional UI (new/untracked in current snapshot) |
| entitlements / balances / unit economy | Plan gating, balance, ledger, cost accounting | `lib/services/reader-entitlement-service.ts`, `lib/services/reader-interaction-balance-service.ts`, `lib/services/reader-interaction-ledger-service.ts` | `ReaderEntitlement`, `ReaderInteractionBalance`, `ReaderInteractionLedgerEntry` | acceptable design, provisional runtime (schema not applied) |
| degraded mode / provider resilience | Policy fallback under schema/provider failures | `lib/services/degraded-interaction-policy-service.ts`, `lib/services/provider-resilience-service.ts` | `DegradedInteractionPolicy` | acceptable |
| observability / analytics | Session observability and non-canonical bridge summaries | `lib/services/conversation-observer-service.ts`, `lib/services/narrative-interaction-observability-bridge.ts`, `lib/services/engagement-analytics-service.ts` | `ConversationObservabilitySnapshot`, `InteractionObservabilitySummary` | acceptable |
| author/God mode | Author-only inspection surface, separate from reader path | `lib/services/authorial-inspection-service.ts`, `app/actions/author-inspection.ts` | `AuthorInspectionPayload`, narration modes | acceptable |
| contracts / registries / validation | Version governance and payload validation | `lib/contracts/contract-registry.ts`, `scripts/check-contract-registry-drift.ts` | 15 registered contracts | acceptable (coverage gaps remain) |
| migrations / operational dependencies | Prisma schema, migrations, runtime table availability | `prisma/schema.prisma`, `prisma/migrations/*` | Conversation/ledger/balance/entitlement tables | provisional |
| permissions / moderation | Role matrix + moderation policy | `lib/services/permission-service.ts`, `lib/services/moderation-service.ts` | `ProductRole`, moderation actions | acceptable |
| performance / background work | Maintenance cleanup and retention compaction | `lib/services/background-maintenance-service.ts`, `scripts/run-background-maintenance.ts` | Session and ledger tables | provisional (fails without migrations) |
| test harnesses / verification scripts | Deterministic harness + prelaunch/full-system verification | `lib/testing/interaction-harness.ts`, `lib/testing/prelaunch-verification-harness.ts`, `scripts/verify-prelaunch.ts`, `scripts/verify-full-system.ts` | Harness summary payloads | acceptable (but skip behavior masks migration gaps) |

## 3) Wiring Map (Actual Critical Paths)

### Scene generation

Start: `app/actions/scene-generation.ts` -> `runSceneGeneration`  
Flow: `loadSceneGenerationInput` -> `assertWorldStateMatchesBook` -> `computeSceneGenerationInputHash` -> `generateSceneProseWithModel` -> `validateRegisteredContractPayload("sceneGenerationOutput")` -> optional `registerSceneGenerationDependencies`  
Persistence/contracts: `Scene.generationText` (optional), dependency edges, `sceneGenerationInput` + `sceneGenerationOutput`.

### Scene repair

Start: `app/actions/scene-repair.ts` -> `executeSceneRepair` / `planSceneRepair`  
Flow: `buildSceneRepairPlan` -> repair mode branch (`generateSceneDraft`/`rewriteSceneDraft`/`repairSceneContinuity`) or `assembleChapterReaderText` -> mark `narrativeAssemblyStatus` current  
Persistence/contracts: `Scene.generationText`, `Scene.narrativeAssemblyStatus`, optional `RevisionJob` via `scene-repair-revision-service`.

### Source filtering

Start points: scene input loader, cockpit payload scene context, scene interaction entry  
Flow: `resolveEffectiveWorldStateForScene` -> `getSourcesForWorldState(worldStateId, year?)`  
Persistence/contracts: `NarrativeSource` with chronology/year filters; uses `WorldStateReference.chronologyIndex`.

### Conversational turn loop

Start: `cockpitSubmitReaderTurn` (`reader-cockpit-command-service`)  
Flow: validate `conversationalTurnInput` -> moderation -> entitlement/balance checks -> append reader turn -> refresh identity snapshot -> generate reply -> guardrails/fallback -> append character turn -> session memory compression  
Persistence/contracts: `CharacterConversationTurn.payloadJson` (`conversationalTurnInput`/`characterResponse`), `CharacterConversationSession` counters/metadata, balance + debit + ledger models.

### Cockpit command flow

Start: `app/read/cockpit/page.tsx` + `ReaderCockpitShell` calling server actions in `app/actions/reader-cockpit.ts`  
Flow: start (`startInteractivePauseSession`) / fetch (`buildReaderCockpitPayload`) / pause-resume-end (`interaction-session-orchestration-service`)  
Persistence/contracts: session row status, orchestration metadata JSON, cockpit payload read model.

### Voice flow

Start: successful character turn in cockpit command service  
Flow: `getCharacterVoiceProfile` -> `buildVoicePresentationPayload` (presentation only) -> optional downstream synthesis path via `elevenlabs-adapter`  
Persistence/contracts: `CharacterTtsVoiceProfile`, `voiceSynthesisRequest`, voice presentation payload (not raw audio persistence here).

### Token/balance flow

Start: submit turn path and maintenance scripts  
Flow: `getOrCreateReaderEntitlement` -> `getOrCreateReaderBalance` -> `estimate*CostUnits` -> `debitReaderInteractionUnits` -> `createLedgerEntry`  
Persistence/contracts: `ReaderEntitlement`, `ReaderInteractionBalance`, `ReaderInteractionLedgerEntry`.

### Degraded-mode flow

Start: balance unavailable/provider failure branches in cockpit submit path  
Flow: `getReaderInteractionBalanceUnavailableReason` -> `resolveDegradedInteractionPolicy` -> conservative fallback response and metadata updates  
Persistence/contracts: degraded state in `CharacterConversationSession.metadataJson`, degraded summaries in payload/observability.

### Author/God inspection flow

Start: `app/actions/author-inspection.ts` -> `runAuthorialInspection`  
Flow: role gate (`canAccessAuthorMode`) -> optional session/turn inspection -> identity snapshot + drift analysis -> author payload assembly  
Persistence/contracts: reads from session/turn tables; emits `AuthorInspectionPayload` (separate from reader cockpit payload).

## 4) Script / Harness Execution Matrix

Machine-readable evidence: `reports/script-execution-matrix.json`.

Executed in this audit:

| Script/command | Purpose | Result | Notes |
|---|---|---|---|
| `npm run typecheck` | TS compile integrity | passed | clean |
| `npm run verify:contracts` | contract registry + validation tests | passed | 14/14 tests |
| `npm run verify:contract-drift` | literal token drift heuristic | passed | warns itself as heuristic |
| `npm run verify:generation-hash` | canonical generation hash determinism | passed | clean |
| `npm run verify:revision-job-policy` | requeue/terminal job policy | passed | clean |
| `npm run verify:conversational-turn-input` | input contract schema tests | passed | clean |
| `npm run verify:character-reply-generation` | reply generation + bounded fallback | passed | clean |
| `npm run verify:character-conversation-session` | session service integration | passed | clean |
| `npm run verify:character-conversation-turn` | turn service integration | passed | logs missing table in cleanup path but suite still passes |
| `npm run verify:reader-cockpit-payload` | cockpit payload assembly integration | passed | logs missing table in cleanup path but suite still passes |
| `npm run verify:reader-cockpit-command` | command flow + degraded debit policy | passed | clean |
| `npm run verify:voice-presentation` | voice formatting/presentation | passed | clean |
| `npm run verify:degraded-interaction-policy` | degraded policy mapping | passed | clean |
| `npm run verify:interaction-truth-firewall` | boundary contamination checks | passed | clean |
| `npm run verify:deterministic-interaction-harness` | e2e deterministic DB-backed loop | blocked | `P2021` missing `ReaderInteractionLedgerEntry` |
| `npm run verify:prelaunch` | prelaunch summary harness | passed (with skips) | entitlement check skipped due missing table |
| `npm run verify:full-system` | prelaunch + selected scripts | passed | inherits prelaunch skip semantics |
| `npm run ops:background-maintenance` | retention/compaction ops | failed | missing `CharacterConversationSession` table |
| `npx prisma migrate status` | migration application state | failed | 30 unapplied migrations detected |

Scripts that appear redundant/overlapping:

- `verify:full-system` wraps `verify:prelaunch` then runs five verify scripts; overlaps with direct execution of those scripts.
- `verify:prelaunch` internally calls deterministic harness; running both may duplicate coverage while still inheriting skip behavior.

Critical areas with weak/no direct script coverage in `package.json` commands:

- World-state chronology enforcement and edge-case ordering.
- Epic book mapping enforcement under mixed calibrated/provisional states.
- Contract coverage for non-registered payloads (cockpit/author/observability bridge).
- End-to-end migration readiness gate (no hard fail precheck before running prelaunch/full-system).

## 5) Migration / Schema Dependency Audit

Hard evidence:

- `npx prisma migrate status` reports 42 migrations total and 30 unapplied in current DB.
- Unapplied set includes interaction-era migrations: session, turn, tts voice profile, ledger, balance, context preference, entitlement.
- Harness and ops failures confirm runtime dependency:
  - Missing `ReaderInteractionLedgerEntry` blocks deterministic harness.
  - Missing `CharacterConversationSession` blocks background maintenance.

Runtime paths requiring those migrations:

- Conversation session/turn write/read services.
- Cockpit command + payload services.
- Balance/ledger/entitlement services.
- Background maintenance cleanup/compaction.
- Deterministic interaction harness and parts of prelaunch harness.

Where tests/scripts mask schema drift:

- `prelaunch-verification-harness` explicitly marks some DB-dependent checks as `skipped` when errors match `does not exist|P2021`.
- Some integration tests log Prisma table-missing errors yet still pass (cleanup is tolerant).

Tables/models added but currently lightly exercised (relative to criticality):

- `CharacterTtsVoiceProfile` (voice assignment path appears narrower than core turn loop).
- `ReaderContextPreference` (product preference path; less critical than session/turn/ledger for core interaction).

Operational dependencies before release:

- Apply migrations to target DB (`prisma migrate deploy` path).
- Ensure required seed anchors exist for deterministic harness (`Scene` + `Person`).
- Resolve Prisma config deprecation (`package.json#prisma` warning).

## 6) Contract / JSON Governance Audit

Current state:

- Central registry exists (`lib/contracts/contract-registry.ts`) with finalize-at-bootstrap behavior.
- Registry count: 15 contracts.
- Drift check script exists and currently passes.

Gaps and risks:

- Registry does not cover all payloads carrying `contractVersion` (notably cockpit, author inspection, conversation observability summary bridge).
- Validation often uses `schemaByVersion` with `passthrough`, so shape drift can bypass strict checks.
- Drift checker only validates version token membership, not contract-name-to-payload correctness.
- Raw JSON surfaces remain broad (`payloadJson`, `metadataJson`, `knownFacts`, multiple `JSON.parse` adapters).

Hardening implication: governance is directionally strong, but not yet complete enough for expansion-scale schema evolution.

## 7) Duplication / Drift Audit

Findings:

- `conversation-observer-service` and `reader-cockpit-payload-service` duplicate turn/session summary logic (`toSessionMetadata`, identity summarization, turn mapping), increasing drift risk.
- Thin duplicate action wrapper surface (`app/actions/reader-cockpit.ts`) is intentional but should stay tightly versioned with service exports.
- Multiple payload families independently use `contractVersion: "1"` semantics without a single contract authority.
- Deprecated contract helper aliases still exported in registry (`assertValidContractVersion`, `assertContractVersionOrThrow`).

## 8) Safety / Boundary Audit

Separation strengths:

- Strong intent and explicit comments in source/services for canonical truth separation and bounded mode.
- `interaction-truth-firewall-service` codifies key prohibited plane transitions.
- Author inspection explicitly separated from reader cockpit modes and role-gated.

Weak/blurred points:

- Boundary firewall is not globally enforced at all persistence write boundaries.
- Firewall key-based contamination detection is heuristic (substring-based) and potentially bypassable.
- Product/account and interaction metadata share JSON-rich paths; separation is policy-driven, not schema-isolated.
- Author/God mode is scaffolding-separated, but uses neighboring contracts/data planes that require strict ongoing discipline.

## 9) Production Readiness Scorecard

| Subsystem family | Status | Confidence | Why | Needed to be story-ready |
|---|---|---:|---|---|
| truth/genealogy/source ingestion | acceptable | medium | strong temporal firewall comments/logic | add explicit end-to-end coverage for source-window edge cases |
| world-state chronology | acceptable | medium | canonical chronology service exists | add dedicated verification script and migration gating |
| epic spine / book mapping | acceptable | medium | overlap checks and timeline enforcement present | add dedicated verify command + calibrated data assertions |
| scene generation | premier | high | hash + contract validation + deterministic checks | keep stable; add migration readiness precheck in full-system |
| repair/revision/jobs | acceptable | medium | explicit planning/execution and job runner policy tests | operational scheduler + more integration tests |
| cognition/knowledge boundary | acceptable | medium | identity policy and firewall exist | broaden runtime enforcement coverage |
| reader memory/progression | acceptable | medium | dedicated services and models | stricter schema governance for memory JSON |
| emotional continuity/drift | acceptable | medium | continuity and anchor drift services present | stress-test with long sessions |
| session/turn/re-entry | provisional | medium-low | code strong, DB behind | apply migrations and enforce non-skippable DB harness |
| response generation/guardrails | premier | high | robust service/test coverage | add adversarial prompts at integration level |
| voice presentation/synthesis | acceptable | medium | clear separation between presentation and provider | expand provider failure + profile coverage |
| cockpit backend/UI | acceptable/provisional | medium-low | command service solid, UI new/untracked snapshot | stabilize/commit UI and add auth + UX verification |
| entitlements/balances/economy | provisional | low | schema-dependent runtime currently unavailable | migrate DB + add non-skippable entitlement checks |
| degraded mode/resilience | acceptable | medium | policy and resilience layers are explicit | tighten policy tuning and observability signals |
| observability/analytics | acceptable | medium | structured snapshots and bridge | register/validate observability contracts centrally |
| author/God mode | acceptable | medium | explicit separation and role gate | enforce stronger payload governance + audit logging |
| contracts/registry/validation | acceptable | medium | centralized registry + drift tooling | expand registry coverage + strict schemas |
| migrations/ops dependencies | provisional | low | major unapplied migration drift | apply/verify migrations in CI and runtime checks |
| permissions/moderation | acceptable | medium | clear role matrix and moderation service | strengthen moderation policy sophistication |
| performance/background work | provisional | low | maintenance script currently fails in env | migrate DB + add defensive fallback behavior |
| test harnesses/verification | acceptable | medium | broad script coverage exists | remove skip masking for certification runs |

## 10) Story-Expansion Readiness

Is the system ready for story expansion now? **No.**

Hardening required first:

1. Apply all pending migrations in the target runtime DB and verify with deterministic harness + maintenance scripts.
2. Make certification scripts fail hard on skipped critical checks (especially prelaunch/full-system DB-dependent checks).
3. Close contract governance gaps for cockpit/author/observability payload families.
4. Reduce duplicate read-model logic and centralize shared mappers.
5. Expand boundary enforcement from selective services to all relevant write paths.

## 11) Prioritized Upgrade Backlog

### P0 — Must fix before story expansion

1. **Apply and verify migration baseline**
   - Affected subsystem: migrations/ops, sessions/turns, economy
   - Why: runtime table absence currently blocks harness and ops
   - Direction: run migration deploy, add CI/runtime migration status gate, re-run deterministic harness and ops script

2. **Make prelaunch/full-system certification non-skippable for critical DB checks**
   - Affected subsystem: harnesses/verification
   - Why: current "pass with skips" can mask release blockers
   - Direction: treat entitlement/harness skip as failure in certification mode

3. **Unify and register all contractVersion payload families**
   - Affected subsystem: contracts/governance
   - Why: partial governance increases drift and compatibility risk
   - Direction: register cockpit, author inspection, observability bridge payloads with schema enforcement

4. **Fix operational script reliability post-migration**
   - Affected subsystem: performance/background work
   - Why: maintenance job currently fails in real environment
   - Direction: enforce preflight table checks or fail-fast messaging + post-migration verification

5. **Stabilize provisional/untracked core surfaces**
   - Affected subsystem: cockpit/actions/new interaction services
   - Why: release traceability and code ownership are unclear while core files remain untracked
   - Direction: commit, review, and gate by CI before expansion work

### P1 — Strongly recommended before story expansion

1. **Eliminate duplicate session/turn observability mappers**
   - Affected subsystem: cockpit + observability
   - Why: high drift risk between user-facing and observability representations
   - Direction: central shared mapper module with tests

2. **Strengthen boundary firewall enforcement coverage**
   - Affected subsystem: safety/boundary
   - Why: selective usage leaves unguarded write paths
   - Direction: enforce at persistence boundaries and service entrypoints

3. **Harden contract schemas from passthrough to strict where possible**
   - Affected subsystem: contracts/validation
   - Why: schema laxity can let shape drift into persistent JSON
   - Direction: progressively replace `passthrough` with explicit object shapes for high-risk contracts

4. **Add explicit verification commands for chronology and epic mapping**
   - Affected subsystem: world-state chronology, epic spine
   - Why: critical logic lacks first-class verify script in package command surface
   - Direction: add deterministic tests and include in full-system runner

5. **Upgrade moderation policy depth**
   - Affected subsystem: permissions/moderation
   - Why: regex-only policy is brittle
   - Direction: layered policy engine with configurable ruleset + telemetry

### P2 — Can wait (after pre-expansion hardening)

1. **Prisma config modernization**
   - Affected subsystem: operational dependencies
   - Why: deprecation warning (`package.json#prisma`) should be resolved before Prisma 7
   - Direction: move to `prisma.config.ts`

2. **Expand voice-provider integration resilience and monitoring**
   - Affected subsystem: voice
   - Why: adapter path is still thin for production fault classes
   - Direction: add retries/timeout/error taxonomy tests beyond current adapter checks

3. **Refine subsystem score automation**
   - Affected subsystem: audit/reporting
   - Why: current scorecard is manual certification artifact
   - Direction: generate scorecard from script + inventory metadata for repeatable audits

---

## Appendix: Evidence Highlights

- Verification matrix and output tails: `reports/script-execution-matrix.json`
- Migration drift command: `npx prisma migrate status`
- Deterministic harness/ops failures: `verify:deterministic-interaction-harness`, `ops:background-maintenance`
- Core architecture and spine references: `docs/build/master-build-spine.md`, `docs/build/p4-prelaunch-readiness-checklist.md`
