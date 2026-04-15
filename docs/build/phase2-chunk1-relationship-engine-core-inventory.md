# Phase 2 - Chunk 1 - Relationship Engine Core Inventory

## Scope executed

Bounded structural relationship-core implementation only:

- Core dyadic relationship domain model
- Bounded relationship axes and normalization
- First-version relationship types and event taxonomy
- Deterministic event-driven update primitives
- Deterministic posture derivation
- Focused verification surface

No persistence integration, no scene-generation integration, no memory activation, no temporal drift logic, no prose behavior.

## Core model

Primary modules:

- `lib/domain/dyadic-relationship.ts`
- `lib/services/dyadic-relationship-engine-service.ts`

Core state includes:

- dyadic identity (`relationshipId`, participant A/B)
- relationship type and origin
- lifecycle (`active` / `inactive`)
- contextual anchor (`worldStateId`, `sceneId`)
- bounded axes object
- derived posture
- update timestamp

## Bounded axes

Shared bounded scale: **0..100** (integer normalization, default 50).

Axes:

- trust
- affection
- fear
- duty
- resentment
- dependence
- admiration
- shameExposure
- socialRisk
- stability

## Types and event inputs

Relationship types:

- spouse
- promised_courtship
- parent_child
- siblings
- elder_younger
- ally
- rival
- authority_subject
- reader_bond

Relationship event types:

- comfort
- neglect
- betrayal
- protection
- humiliation
- sacrifice
- secrecy
- confession
- violence
- support
- public_disapproval
- duty_fulfilled
- duty_broken

Event input supports:

- event type
- intensity (1..3)
- direction (`symmetric`, `participant_a_to_b`, `participant_b_to_a`)
- occurrence timestamp
- optional truth-plane boundary context (`sourcePlane`, `targetPlane`) for boundary assertions

## Deterministic update primitives

Update flow (`applyDyadicRelationshipEvent`):

1. validate active lifecycle
2. optional truth-boundary assertion when plane context is provided
3. apply explicit per-event axis deltas
4. apply deterministic intensity and direction scaling
5. clamp/normalize axes
6. derive posture
7. return updated state + structured explanation bundle

Structured explanation is code-like (event type, deltas, posture transition reason codes) and contains no prose payload fields.

## Posture derivation

Deterministic posture helper (`deriveDyadicRelationshipPosture`) supports:

- bonded
- strained
- unstable
- dutiful_but_cold
- fearful_attachment
- grieving_attachment
- broken_but_unresolved

Each posture output includes deterministic reason codes.

## Verification

Added test surface:

- `lib/services/dyadic-relationship-engine-service.test.ts`
- script: `npm run verify:relationship-engine-core`

Covers:

- axis bounds/normalization
- deterministic updates
- posture consistency
- symmetry/asymmetry direction handling
- no prose payload leakage in explanation shape
- no truth-plane contamination (asserted via truth-firewall context path)
