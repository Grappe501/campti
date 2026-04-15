# CHUNK 4 Read-Model Consolidation Inventory

This document records the duplicated read-model mapping inventory and bounded consolidation completed for CHUNK 4.

## Scope and Boundaries

- Objective: reduce drift risk from duplicated session/turn read-model mapping logic.
- In scope: shared projection logic used by cockpit and observability services.
- Out of scope: service merges, payload redesign, contract architecture redesign, UI changes, moderation/resilience redesign.

## Task 1 Inventory: Duplicated / Near-Duplicated Mapping

| Area | Files / functions | Shape built | Duplication type | Drift risk | Consolidated now |
|---|---|---|---|---|---|
| Session metadata mapping | `lib/services/conversation-observer-service.ts` `toSessionMetadata`; `lib/services/reader-cockpit-payload-service.ts` `toSessionMetadata` | `ConversationSessionMetadata` | Identical | High (same fields, parallel edits can diverge) | Yes |
| Identity summary mapping | `conversation-observer-service.ts` `summarizeIdentity`; `reader-cockpit-payload-service.ts` `summarizeIdentity` | `ConversationIdentitySummary` | Identical | High | Yes |
| Turn observability projection | `conversation-observer-service.ts` `mapTurnsToObservability`; `reader-cockpit-payload-service.ts` `mapTurnsToObservability` and local knowledge-source parser | `ConversationTurnObservability[]` | Identical | High | Yes |
| Degraded interaction summary | Both services call `summarizeDegradedInteractionState` from shared module | `DegradedInteractionStateSummary` | Already shared | Low | N/A (already consolidated) |
| Emotional continuity extraction | Both services derive recent tones then call `deriveConversationEmotionalContinuity` | service-specific input shaping | Similar but context-specific | Medium | No (left separate intentionally) |
| Reader memory summary / guardrail / anchor drift | Observability-only | observability payload sections | Not overlapping responsibilities | Low | No (intentionally separate) |

## Task 2 Consolidation Seam

Chosen seam: `lib/services/conversation-read-model-mapper.ts`

Design constraints applied:

- Narrow and explicit API (three exported mappers only).
- Shared mapping logic only, no service orchestration.
- Payload intent remains separate:
  - observability keeps `recentTurns` ordering and guardrail/anchor logic.
  - cockpit keeps `latestTranscriptTurns` ordering (`reverse`) and cockpit-only aggregates.
- No giant abstraction, no service merger.

## Task 3 Implementation

Added shared mapper module:

- `mapConversationSessionMetadata(session)`
- `mapConversationIdentitySummary(snapshot)`
- `mapConversationTurnObservability(turns)`

Migrated callsites:

- `lib/services/conversation-observer-service.ts`
  - replaced local session/identity/turn mapper functions with shared mapper calls
- `lib/services/reader-cockpit-payload-service.ts`
  - replaced local session/identity/turn mapper functions with shared mapper calls

Removed duplicated local mapping functions from both services after migration.

## Task 4 Behavior Drift Protection

Added targeted seam verification:

- `lib/services/conversation-read-model-mapper.test.ts`
  - session metadata mapping stability
  - identity summary mapping stability
  - turn projection stability and valid character knowledge source mapping
  - invalid knowledge source omission

Added npm script:

- `verify:read-model-mappers` → `tsx --test lib/services/conversation-read-model-mapper.test.ts`

## Task 5 Remaining Duplication and Ownership

### Duplication removed

- Session metadata projection logic duplication.
- Identity summary projection logic duplication.
- Turn observability projection logic duplication (including knowledge-source extraction).

### Duplication intentionally left

- Emotional continuity recent-tone extraction in service bodies:
  - similar but kept local because each service slices/orders turns differently and emits different payload intent.
- Observability-only summarizers:
  - reader memory summary, latest guardrail assessment, anchor drift summaries remain owned by observability service.
- Cockpit-only assembly:
  - voice readiness, entitlement/balance, context preferences, and provider resilience remain cockpit-owned.

### Ownership boundary after consolidation

- Shared mapper module:
  - canonical projection for cross-surface session/identity/turn read-model fields.
- Cockpit payload service:
  - product-facing aggregate assembly and cockpit-specific ordering/optional sections.
- Observability service:
  - diagnostics/inspection assembly and observability-specific summaries.
- Author inspection:
  - remains separate; no overlapping mapper seam adopted in this chunk.

### Future consolidation strategy (deferred)

- If additional surfaces start projecting the same turn/session shape, keep extending the shared mapper module with narrowly-scoped pure functions.
- Avoid introducing service-level inheritance or centralized "super assembler"; keep shared pure mappers + explicit service-owned assembly.
