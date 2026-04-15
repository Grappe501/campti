# Phase 2 — Chunk 4 Inventory: Memory Activation Engine

## Scope Completed

This chunk introduces a bounded, deterministic memory activation layer that selects and scores which memory references become active in the current moment, with explicit mode outcomes and strict truth-plane boundaries.

Implemented scope:

- Memory activation domain contract (input candidates + bounded output summary)
- Allowed source definitions for activation
- Deterministic activation scoring model
- Explicit distortion/avoidance outcomes
- Compact orchestration-ready activation summary (no raw memory payload dump)
- Targeted verification for restrictions, determinism, activation modes, and boundary safety

Out-of-scope (not implemented in this chunk):

- Temporal evolution / decay updates
- Prose generation changes
- UI integration
- Global memory storage redesign
- Unbounded semantic retrieval

## Domain Model

New contract file: `lib/domain/memory-activation.ts`

- `MEMORY_ACTIVATION_CONTRACT_VERSION = "1"`
- Source types:
  - `canonical_lived_event`
  - `character_bounded_remembered_event`
  - `reader_interaction_memory`
  - `active_unresolved_consequence`
  - `emotional_continuity_anchor`
- Activation modes:
  - `clear_recall`
  - `partial_recall`
  - `bodily_recollection`
  - `defensive_avoidance`
  - `misattributed_association`
  - `repetitive_fixation`
- Context modes:
  - `scene_mode`
  - `interaction_mode`
- Channels:
  - `canonical_dyad`
  - `reader_bond_dyad`
- Candidate shape includes bounded scoring dimensions only (0-100 style numeric inputs) plus compact `summaryToken`.
- Output shape (`MemoryActivationSummary`) contains only compact activated references and explainability tags.

## Service Implementation

New service file: `lib/services/memory-activation-engine-service.ts`

Primary API:

- `buildActivationCandidatesFromSources(...)`
  - Builds normalized candidate references from allowed memory sources.
  - Assigns source-plane metadata and bounded scoring dimensions.
- `activateBoundedMemories(...)`
  - Enforces source restrictions by context/channel.
  - Validates plane boundaries through `assertMemoryBoundary(...)`.
  - Computes deterministic activation weights.
  - Produces bounded activation modes (including avoidance/distortion states).
  - Caps output to a fixed maximum (`MAX_ACTIVATED_MEMORIES = 6`).

Scoring dimensions implemented:

- contextual relevance
- emotional intensity
- unresolved status
- relationship linkage
- recency
- shame/fear salience
- repetition
- suppression pressure

## Source Restriction / Boundary Rules

- `scene_mode` blocks `reader_interaction_memory` activation for canonical channel.
- `interaction_mode` allows broader bounded sources, but `canonical_dyad` still blocks reader-memory source usage.
- Each accepted candidate is boundary-checked to `character_bounded_knowledge` influence target.
- Product/account truth sources remain blocked by existing firewall constraints.

## Distortion and Avoidance Support

Activation mode selection explicitly supports non-clean recall outcomes:

- `defensive_avoidance` when suppression is high against relevant memory
- `misattributed_association` when distortion pressure is high
- `bodily_recollection` for high affect / weak contextual linkage
- `repetitive_fixation` for repetitive unresolved loops
- fallback modes: `clear_recall`, `partial_recall`

These outputs remain structural only (no prose behavior).

## Output Surface for Later Orchestration

`MemoryActivationSummary` includes:

- compact list of activated memory references
- activation reasons
- activation weight
- emotional color
- disclosure risk
- distortion likelihood
- activation mode
- cap and block diagnostics (`memorySalienceCapApplied`, `blockedSourceRefs`)

No large payload blobs are emitted.

## Verification Additions

New test file: `lib/services/memory-activation-engine-service.test.ts`

Coverage:

- source restriction enforcement by context/channel
- deterministic scoring/output repeatability
- activation mode correctness for avoidance/distortion cases
- prohibited truth-plane crossing rejection
- bounded output capping and compact token behavior

New script added:

- `verify:memory-activation-engine`

