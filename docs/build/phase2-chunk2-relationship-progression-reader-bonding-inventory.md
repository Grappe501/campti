# Phase 2 - Chunk 2 - Relationship Progression + Reader Bonding Inventory

## Scope executed

This chunk implemented durable relationship progression and reader-character bonding without consequence propagation, memory activation, temporal evolution, UI work, or prose behavior.

## Durable progression storage shape

Minimal durable storage was implemented without schema expansion:

- Canonical person-person progression:
  - persisted in `CharacterRelationship.generatedDynamicSummary` as a structured JSON envelope string
  - channel: `canonical_dyad`
- Reader-character bond progression:
  - persisted in `CharacterReaderMemory.relationshipNotes.dyadicRelationshipProgressionV1`
  - channel: `reader_bond_dyad`

Envelope includes:

- snapshot
- recent event records (bounded ring, max 12)
- contract version (`1`)

## Progression update path

New service:

- `lib/services/relationship-progression-service.ts`

Core apply functions:

- `applyCanonicalRelationshipObservedEvent(...)`
- `applyReaderBondObservedEvent(...)`

Both paths:

- consume structured event input
- apply deterministic event deltas via Chunk 1 engine
- compute derived progression signals
- persist updated snapshot + bounded event history
- return bounded explanation metadata for author/debug use

## Reader-bond model summary

Reader bond is modeled as:

- relationship type: `reader_bond`
- channel: `reader_bond_dyad`
- durability in reader-memory plane (`CharacterReaderMemory.relationshipNotes`)

Derived and persisted using same bounded relationship principles (axes/posture/event logic), while structurally separated from canonical person-person relationship truth.

## Derived progression signals

Deterministic signals implemented:

- trend: `warming | cooling | unstable | flat`
- ruptureRisk: `low | elevated | high`
- disclosureLikelihoodShift: `decreasing | steady | increasing`
- attachmentPressure: `low | moderate | high`
- reconciliationAvailability: `open | guarded | closed`

## Truth-plane separation

Channel boundary enforcement:

- canonical progression requires `canonical_truth -> canonical_truth`
- reader-bond progression requires `reader_interaction_memory -> reader_interaction_memory`
- prohibited crossings fail explicitly

No reader-bond data is written into canonical relationship channel.

## Verification

Added targeted verification command:

- `verify:relationship-progression`

Coverage includes:

- durable snapshot persistence (canonical + reader-bond)
- repeated event update progression
- explainability output shape
- channel/plane crossing rejection
- merge integrity for existing relationship note keys
