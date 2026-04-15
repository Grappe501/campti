# CHUNK 5 Truth-Boundary Enforcement Inventory

This report documents write-boundary inventory, selected high-risk boundaries, and hardening outcomes for CHUNK 5.

## Scope

- Goal: strengthen truth-plane separation at write boundaries.
- Planes considered:
  - canonical story truth
  - character-bounded knowledge/belief
  - reader interaction memory
  - product/account truth
  - author/god inspection notes
- Out of scope: feature expansion, architecture redesign, broad schema/storage redesign.

## Task 1 Inventory: Write Boundaries with Cross-Plane Risk

| Boundary | Entrypoint/service | Source plane(s) | Target plane(s) | Current protection before chunk | Risk level | Hardened now |
|---|---|---|---|---|---|---|
| Reader memory writeback | `updateReaderMemoryFromTurn` (`lib/services/reader-memory-writeback-service.ts`) | reader interaction memory | reader interaction memory persistence (`CharacterReaderMemory`) | explicit boundary assertion + conservative extraction; key-space still mostly heuristic | High | Yes |
| Session create metadata write | `createConversationSession` (`lib/services/character-conversation-session-service.ts`) | scene/cockpit/orchestration inputs | session metadata (`CharacterConversationSession.metadataJson`) | minimal validation (accepted arbitrary JSON) | High | Yes |
| Orchestration metadata write | `persistOrchestration` (`lib/services/interaction-session-orchestration-service.ts`) | reader interaction orchestration | session metadata | no explicit truth-firewall assertion at write site | High | Yes |
| Cockpit degraded-state metadata write | `persistDegradedInteractionState` + `incrementDegradedFreeTurnCount` (`lib/services/reader-cockpit-command-service.ts`) | degraded interaction state (operational, partly product-adjacent) | session metadata | no explicit write-boundary assertion at metadata write | High | Yes |
| Cockpit presentation preference metadata write | `cockpitSetPresentationPlaybackPreference` (`lib/services/reader-cockpit-command-service.ts`) | reader preference | session metadata | role gate existed; no explicit metadata boundary assertion | Medium | Yes |
| Session memory summary metadata write | `buildAndPersistSessionMemorySummary` (`lib/services/session-memory-compression-service.ts`) | interaction summary | session metadata | deterministic builder; no explicit boundary assertion at write | Medium | Yes |
| Conversation turn persistence | `appendReaderTurn` / `appendCharacterTurn` (`lib/services/character-conversation-turn-service.ts`) | reader input / character response | turn payload JSON | contract write validation present | Medium | No (already explicit) |
| Relationship progression derivation | `deriveReaderRelationshipProgression` (`lib/services/reader-relationship-progression-service.ts`) | reader memory + summary | derived payload only | no persistence write path in this service | Low | No |
| Observability payload emission | conversation observer / interaction summary services | interaction summaries | action/service boundary outputs | registry-governed write validation present | Medium | No (already explicit for this phase scope) |
| Author inspection payload emission | `runAuthorialInspection` | author notes + bounded snapshot | author inspection payload output | explicit boundary assertions and registry write validation present | Medium | No (already explicit) |

## Task 2 Selected High-Risk Boundaries

Selected for this chunk:

1. Session metadata write boundaries (`CharacterConversationSession.metadataJson`) across:
   - session creation
   - orchestration persistence
   - degraded interaction metadata updates
   - playback preference updates
   - session memory summary persistence

Why selected:

- Shared mutable metadata surface touched by multiple subsystems.
- Highest drift/cross-plane contamination risk due to broad JSON shape and repeated writers.
- Prior enforcement was inconsistent and mostly convention-based at these specific write points.

2. Reader memory writeback patch key-space.

Why selected:

- Reader memory is a core trust plane.
- Existing extraction was conservative, but no explicit key whitelist check prevented accidental new key injection from future edits.

## Task 3/4 Hardening Implemented

- Expanded truth-firewall coverage in `lib/services/interaction-truth-firewall-service.ts`:
  - added product/account plane handling (`product_account_truth`)
  - added product/account contamination checks for reader memory and canonical targets
  - added canonical-field contamination checks for reader memory target
  - deep key normalization (nested object keys included, not just top-level)
  - added explicit session metadata patch boundary helper:
    - `assertSessionMetadataPatchWriteBoundary`
    - default allowed key set (`SESSION_METADATA_ALLOWED_KEYS`)

- Added explicit write-boundary assertions at selected metadata writes:
  - `lib/services/character-conversation-session-service.ts`:
    - `normalizeCreateSessionMetadataInput` enforces metadata object shape and allowed keys (`source` only at creation boundary)
  - `lib/services/interaction-session-orchestration-service.ts`:
    - boundary assertion before writing orchestration/anchor patch
  - `lib/services/reader-cockpit-command-service.ts`:
    - boundary assertions before writing degradedInteraction patch
    - boundary assertions before writing presentationPlaybackPreference
  - `lib/services/session-memory-compression-service.ts`:
    - boundary assertion before writing sessionMemorySummary patch

- Reduced heuristic-only dependency for reader-memory writeback:
  - `lib/services/reader-memory-writeback-service.ts`:
    - added explicit allowed disclosure key whitelist (`assertAllowedReaderDisclosurePatch`)

## Task 5 Verification Additions

Added/updated targeted tests:

- `lib/services/interaction-truth-firewall-service.test.ts`
  - product/account field contamination blocked for reader memory
  - product->canonical mutation blocked
  - disallowed session metadata patch key rejection
- `lib/services/character-conversation-session-service.test.ts`
  - unit tests for metadata normalization/boundary enforcement helper
- `lib/services/reader-memory-writeback-service.test.ts`
  - disallowed disclosure key rejection

## Task 6 Remaining Weak Boundaries and Ownership

### Hardened in this chunk

- session metadata writes at selected high-risk write boundaries
- reader-memory disclosure patch key-space
- firewall detection of product/account contamination signals

### Remaining partial/heuristic boundaries

- Product/account contamination detection still relies on explicit key-pattern heuristics (not semantic classification).
- Session metadata remains JSON and can still carry legacy unknown keys in pre-existing rows; enforcement is strongest on newly written patches.
- Contract/read-path validation remains separate from write-boundary plane enforcement by design.

### Intentionally deferred

- Broad semantic classification engine for payload meaning across all services.
- Global storage-model redesign for strict typed metadata columns.
- Cross-service enforcement abstraction merger beyond small shared helper.

### Ownership boundary after this chunk

- Truth-plane write enforcement primitives:
  - `lib/services/interaction-truth-firewall-service.ts`
- Session metadata writers:
  - `character-conversation-session-service`
  - `interaction-session-orchestration-service`
  - `reader-cockpit-command-service`
  - `session-memory-compression-service`
- Reader-memory patch derivation and key restrictions:
  - `reader-memory-writeback-service`

### Duplication/conflict callout

- Multiple services still invoke boundary assertions at their own write sites (intentional per-boundary explicitness).
- Consolidation strategy (deferred): add a tiny shared session-metadata write helper wrapper only if writer count and duplication grow further, while keeping per-service boundary ownership explicit.
