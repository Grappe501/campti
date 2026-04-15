# Phase 2 - Chunk 3 - Consequence Engine Core Inventory

## Scope executed

This chunk implemented a bounded, deterministic consequence engine that creates durable consequence records from observed events.

Out of scope and not implemented:

- memory activation selection
- temporal evolution/decay simulation
- prose generation behavior
- broad graph contagion
- UI integration

## Consequence domain model

Primary modules:

- `lib/domain/consequence-engine.ts`
- `lib/services/consequence-engine-service.ts`

Core consequence record includes:

- trigger reference (observed event id + source kind/type + anchors)
- affected entities
- category
- severity
- visibility
- immediacy
- duration
- lifecycle state
- reversibility
- propagation targets
- structured explanation metadata

## Categories and lifecycle

Bounded category set:

- relational
- emotional
- reputational
- material
- bodily
- social
- political
- spiritual
- legal_customary
- household_economic

Lifecycle set:

- active
- latent
- decaying
- resolved
- transformed

## Durable storage and trigger-bound creation

Minimal durability strategy without schema expansion:

- Canonical channel (`canonical_dyad`) stored under `consequenceEngineV1` in `CharacterRelationship.generatedDynamicSummary` JSON root.
- Reader-bond channel (`reader_bond_dyad`) stored under `dyadicConsequenceEngineV1` in `CharacterReaderMemory.relationshipNotes`.

Creation paths:

- `applyCanonicalConsequenceFromObservedEvent(...)`
- `applyReaderBondConsequenceFromObservedEvent(...)`

Both require valid observed trigger anchors (`observedEventId`, `occurredAtIso`) and reject free-floating consequence creation.

## Propagation basics implemented

Explicit minimal propagation rules:

- `public_disapproval` / `humiliation` propagate social risk pressure.
- `violence` propagates household/economic pressure and bodily caution signal.
- `betrayal` can propagate to linked relationships through explicit target refs.

No broad contagion engine or autonomous spread behavior.

## Output surfaces

`buildConsequenceOutputSurface(...)` produces structured bounded outputs for later chunks:

- active consequence summary
- relationship pressure modifiers
- memory salience modifiers
- future constraint signals

## Truth-plane separation

Strict channel boundaries:

- canonical consequence flow requires `canonical_truth -> canonical_truth`
- reader-bond consequence flow requires `reader_interaction_memory -> reader_interaction_memory`

Prohibited crossings fail explicitly through existing truth-firewall assertions.

## Verification

Added verification command:

- `verify:consequence-engine-core`

Coverage includes:

- trigger-anchor requirements
- category/lifecycle mapping correctness
- deterministic output surface shape
- propagation basics
- reader/canonical channel isolation
- explicit boundary rejection for prohibited crossings
