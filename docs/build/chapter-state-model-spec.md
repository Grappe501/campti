# Chapter State Model Spec

## Purpose

This model formalizes chapter conditions so chapter structure is derived from live state instead of cloned chapter templates.
It is built to satisfy the principle: **replicate the system, not the chapter**.

Runtime consequence:
- Beat taxonomy and validation stay reusable.
- Chapter-level beat weighting and transition bias are derived from pressure state.
- Meaning intensity is bounded by continuity pressure instead of random insertion.

Primary implementation:
- `lib/domain/chapter-state.ts`
- `lib/chapter-state/chapter-state-derivation.ts`
- `lib/chapter-state/chapter-state-validation.ts`
- `lib/chapter-state/chapter-state-to-beat-profile.ts`

## A. Chapter State Axes

All axes are explicitly represented in `ChapterState.stateAxes`:

1. `environmental_stability`
2. `food_security`
3. `social_cohesion`
4. `external_awareness`
5. `memory_continuity`
6. `identity_stability`
7. `labor_pressure`
8. `signal_integrity`
9. `decision_pressure`
10. `movement_pressure`
11. `relational_heat`
12. `meaning_load`

Each axis stores:
- `score` (0-100)
- `intensityBand` (`low` | `moderate` | `high`)
- `stateBand` (`stable` | `unstable` | `volatile`) where applicable
- `readabilityBand` (`clear` | `noisy` | `contradictory`) for signal axis
- `direction` (`falling` | `flat` | `rising`)
- `rationale` (grounded explanation)

## B. Chapter State Object Model

`ChapterState` fields include:
- identity and chronology: `chapterId`, `bookId`, `sequenceNumber`, `era`, `timePosition`, `seasonPhase`, `locationProfile`, `progressionPhase`
- cognition carriers: `povWeightingCandidates`
- pressure model: `stateAxes`, `dominantPressures`, `suppressedPressures`
- continuity model: `activeContinuityThreads`, `threatenedContinuityThreads`
- derived chapter behavior: `chapterMode`, `chapterStateSummary`, `allowedMeaningIntensity`
- beat integration: `recommendedBeatWeights`, `beatTransitionBiases`
- runtime bounds: `visibilityRules`, `memoryAccessProfile`, `decisionUrgencyProfile`
- governance: `chapterRiskFlags`, `validationFlags`, `provenance`

## C. State Bands and Value Logic

Value logic:
- Numeric axis score: `0-100`
- Intensity bands:
  - `low`: `< 35`
  - `moderate`: `35-69`
  - `high`: `>= 70`
- Signal readability:
  - `clear`: `>= 70`
  - `noisy`: `40-69`
  - `contradictory`: `< 40`

Semantics:
- Stability axes (`environmental_stability`, `food_security`, `social_cohesion`, `memory_continuity`, `identity_stability`) invert pressure meaning (low score = high danger).
- Pressure axes (`labor_pressure`, `decision_pressure`, `movement_pressure`, `relational_heat`, `meaning_load`) increase danger with higher score.

## D. State Interaction Rules

Implemented interaction logic:
- Low `signal_integrity` + high `memory_continuity` => increased `memory_comparison_beat`.
- High `labor_pressure` + low `food_security` => increased `micro_decision_beat` and `pressure_escalation_beat`.
- Rising `movement_pressure` + low `identity_stability` => increased `consequence_seed_beat` and `meaning_trace_beat`.
- High `social_cohesion` buffers `relational_heat`; if both are high, validator raises contradiction warning.
- Low `environmental_stability` boosts `salience_lock_beat` and `environmental_confirmation_beat`.

## E. Chapter-Type Derivation

Derived chapter modes:
- `continuity_chapter`
- `signal_disturbance_chapter`
- `obligation_strain_chapter`
- `fracture_chapter`
- `adaptation_chapter`
- `crossing_preparation_chapter`
- `movement_chapter`
- `reformation_chapter`

Mode derivation is state-driven in `deriveChapterMode()` and uses movement, identity, decision, social, signal, and relational axes.

## F. Beat-Weight Derivation Rules

`deriveChapterStateBeatInfluence()` applies weighted contributions from axes into beat profile output:
- environmental instability -> salience + environmental confirmation
- social strain + relational heat -> social signal + relational interpretation
- meaning and identity stress -> meaning trace
- decision pressure -> micro decision + state update
- movement pressure -> consequence seed + pressure escalation

Transition biases are also derived (e.g. `pressure_escalation_beat -> consequence_seed_beat` rises with movement pressure).

## G. Validation Rules

`validateChapterState()` and `validateChapterStateSequence()` enforce:
- contradiction checks without grounding rationale
- beat profile mismatch against state conditions
- historical phase compatibility (`phase_a`..`phase_f`)
- premature movement spikes
- meaning overload in low-pressure chapters
- POV pressure-carrier alignment checks
- progression continuity checks across chapter sequence

## H. Runtime and Authoring Boundaries

Runtime responsibilities:
- produce state-conditioned beat weights and transition biases
- expose memory/visibility/urgency constraints to composition layers
- support continuity monitoring through chapter risk flags

Cockpit and authoring responsibilities:
- inspect state assumptions and validation output
- compare state snapshots across chapters
- adjust axis assumptions with strict re-validation before usage

Explicitly out-of-scope:
- direct prose writing
- injecting non-runtime metaphysical simulation layers into chapter generation
