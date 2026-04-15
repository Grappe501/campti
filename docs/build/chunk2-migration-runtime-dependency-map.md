# Chunk 2 — Migration/Runtime Dependency Map

Date: 2026-04-15  
Scope: DB-critical runtime dependency hardening for certification/operator truthfulness.

## Critical Path Dependency Map

| Subsystem path | Entrypoint(s) | Required tables/models | Previous absent-schema behavior | Hardening in this chunk |
|---|---|---|---|---|
| conversation sessions / turns / re-entry | `app/actions/reader-cockpit.ts`, `app/actions/story-reentry.ts`, `lib/services/character-conversation-session-service.ts`, `lib/services/character-conversation-turn-service.ts`, `lib/services/story-reentry-continuity-service.ts` | `CharacterConversationSession`, `CharacterConversationTurn`, `CharacterReaderMemory`, `Scene`, `Person` | Mixed explicit errors + raw Prisma failures depending on call path | No broad behavior redesign; improved harness/certification dependency signaling for this path |
| reader cockpit command flow | `lib/services/reader-cockpit-command-service.ts` + UI action entrypoint | `CharacterConversationSession`, `CharacterConversationTurn`, `ReaderInteractionBalance`, `ReaderEntitlement`, `ReaderInteractionLedgerEntry`, `ReaderContextPreference`, `CharacterTtsVoiceProfile`, `CharacterReaderMemory` | Some mapped API failures (`balance_unavailable`), other schema issues surfaced as internal/raw Prisma strings | Preserved behavior; strengthened upstream certification/harness dependency detection to reduce false-green interpretations |
| entitlements / balances / ledger | `lib/services/reader-entitlement-service.ts`, `lib/services/reader-interaction-balance-service.ts`, `lib/services/reader-interaction-ledger-service.ts` | `ReaderEntitlement`, `ReaderInteractionBalance`, `ReaderInteractionLedgerEntry`, `CharacterConversationSession` (FK/validation paths) | Balance path had explicit schema-unavailable handling; entitlement/ledger more raw | Certification and integration-test signaling hardened; no change to core billing/ledger logic |
| deterministic interaction harness | `scripts/run-deterministic-interaction-harness.ts`, `lib/testing/interaction-harness.ts` | `Scene`, `Person`, `CharacterStateSnapshot(characterId)`, `CharacterReaderMemory`, `CharacterConversationSession`, `CharacterConversationTurn`, `ReaderInteractionLedgerEntry` | Generic harness error text often raw Prisma; schema missing and seed missing conflated upstream | Added explicit DB dependency preflight + failure-kind classification (`schema_dependency_missing`, `seed_data_missing`, `runtime_failure`) |
| background maintenance | `scripts/run-background-maintenance.ts`, `lib/services/background-maintenance-service.ts` | `CharacterConversationSession`, `ReaderInteractionLedgerEntry` | Raw Prisma failure on missing tables | Added explicit runtime dependency assertion and actionable operator error prefix |
| author inspection (session/turn dependent path) | `app/actions/author-inspection.ts`, `lib/services/authorial-inspection-service.ts` | `CharacterConversationSession`, `CharacterConversationTurn` (+ identity snapshot dependencies) | Explicit auth/session checks + raw Prisma for schema mismatch | Mapped for operator awareness; no behavior change in this chunk |

## Certification/Operator Safety Notes

- Certification-critical paths now distinguish schema dependency failures from seed/data readiness and generic logic/runtime failures.
- Operational background script now fails with explicit dependency diagnostics before executing destructive maintenance calls.
- Deterministic harness now emits explicit dependency-preflight evidence in step output.

## Hardening Changes in This Chunk

1. Added shared runtime dependency guard/classifier:
   - `lib/services/runtime-dependency-guard.ts`
2. Added targeted dependency preflight:
   - `scripts/run-background-maintenance.ts`
   - `lib/testing/interaction-harness.ts`
3. Reduced misleading certification pass semantics:
   - `lib/testing/prelaunch-verification-harness.ts` now skips only schema-dependency failures; seed-data readiness no longer treated as schema skip.
4. Reduced misleading DB-test pass semantics for certification-adjacent path:
   - `lib/services/reader-entitlement-service.test.ts` now uses explicit test skipping (`t.skip`) instead of pass-by-assert pattern.

## Remaining Risks (Out of This Chunk Scope)

- Some DB-backed integration tests outside certification paths still use tolerant patterns.
- Several runtime services still surface raw Prisma errors directly; this chunk intentionally targeted operational/certification/harness entrypoints rather than broad error-contract redesign.
