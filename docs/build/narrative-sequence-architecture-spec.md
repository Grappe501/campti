# Narrative Sequence Architecture System (NSAS)

## Purpose

NSAS is the conductor layer that governs narrative sequencing across epic, book, and chapter scopes. It enforces functional chapter ordering, cadence scheduling, delayed convergence, route recurrence, philosophy propagation, recall/reframing windows, and reader-energy shaping.

## Core Contracts

- `EpicSequencePlan`
  - `epicId`
  - `emotionalNorthStar`
  - `longArcPhases`
  - `continuityThemes`
  - `identityPressureTrajectory`
  - `routeExpansionTrajectory`
  - `generationalPatternRules`
  - `convergenceStrategy`
  - `finalTransformationLogic`
- `BookSequencePlan`
  - `bookId`, `parentEpicId`
  - `motionFramework`
  - `chapterFunctionSequence`
  - `threadCadencePlans`
  - `routeCadencePlan`
  - `philosophyCadencePlan`
  - `expansionContractionPattern`
  - `fracturePoints`
  - `convergenceWindows`
  - `recallWindows`
  - `endingCarryForwardProfile`
- `ChapterSequencePlan`
  - `chapterId`
  - `dominantFunction`, `secondaryFunctions`
  - `readerEnergyRole`
  - `threadRole`, `routeRole`, `philosophyRole`
  - `recallRole`, `convergenceRole`, `closureRole`
  - `nextChapterSetup`
  - `delayBindings`
  - `validationFlags`

## Chapter Function Matrix

- Opening window: `grounding`, `disturbance`, `widening`
- Complication window: `doubling`, `concealment`, `relay`, `route_expansion`
- Fracture window: `fracture`, `reversal`, `compression`
- Convergence window: `echo`, `memory_return`, `convergence`, `cost`, `revelation`, `aftermath`

## Book Motion Framework

Default framework supports:

- Phase progression: `ground -> disturb -> fracture -> converge -> transform`
- Allowed transitions:
  - `ground->disturb`
  - `disturb->widen`
  - `widen->fracture`
  - `fracture->echo`
  - `echo->convergence`
  - `convergence->revelation`
- Forbidden transitions:
  - `ground->revelation`
  - `disturb->aftermath`
  - `fracture->grounding`

## Cadence Schedulers

- Thread cadence enforces:
  - intro windows
  - recurrence intervals
  - latent windows
  - convergence and reinterpretation windows
  - disappearance allowance
  - payoff windows
- Route cadence enforces:
  - direct and indirect location windows
  - required recurrence per book
  - associated thread bindings and narrative role
- Philosophy cadence enforces:
  - recurrence by window
  - carrier mode rotation
  - explicitness ceiling
  - deepening rule

## Scene Order Grammar

Grammar includes:

- allowed transitions
- contrast rules
- escalation rules
- interruption rules
- echo placement rules

Disconnected adjacency is permitted only when delayed convergence keys are scheduled.

## Recall / Reframing

`RecallReframingPlan` captures:

- original chapter
- recall and reinterpretation windows
- POV shift options
- meaning-shift rules
- memory distortion allowance

## Validation

`SequenceValidationReport` emits:

- `sequenceScore`
- `sequenceWarnings`
- `structuralWeaknessFlags`

Flags include repeated function clustering, thread overexposure, missing route presence, missing delayed convergence, no recall events, flat energy profile, flat expansion/contraction pattern, and over-linear motion.

## Cockpit Integration

Author cockpit now surfaces:

- chapter function timeline
- convergence and recall windows
- sequence warnings and sequence score
- generated-scene runtime count and role order
- transition strategy list
- callback/delayed-convergence/reinterpretation markers
- runtime density summary

