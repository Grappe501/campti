# Epic Narrative Continuity System (ENCS) Spec

## Purpose

ENCS is the formal continuity and meaning architecture that keeps the Campti story one living epic across radical era, setting, language, and generational shifts.

## Scope

ENCS operates across:

- Epic
- Series/Trilogy
- Book
- Chapter
- Scene
- Recall/Memory/Reinterpretation events

## Core Contracts

Machine-usable contracts are defined in `lib/domain/epic-narrative-continuity.ts`:

- `EpicNarrativeContinuityProfile`
- `SeriesContinuityPlan`
- `BookContinuityPlan`
- `EpicQuestionProfile`
- `NarrativeAnchorRegistry` / `NarrativeAnchor`
- `IdentityPersistenceProfile`
- `MeaningEscalationProfile`
- `ReaderMemoryStrategy`
- `HookOrchestrationProfile`
- `TemporalTransitionContinuityProfile`
- `EpicContinuityDownstreamBias`
- `EpicContinuityCockpitSummary`
- `CamptiEpicContinuityPack`

## Continuity Laws

1. One recognizable central human question must persist.
2. Era difference is required, disconnection is forbidden.
3. Continuity must be emotional, symbolic, structural, and philosophical.
4. Anchors recur in transformed form, not static duplication.
5. Identity persistence tracks retained, fractured, forgotten, and recovered lines.
6. Recurrence must escalate meaning.
7. Reader memory is intentionally designed and rewarded.
8. Hooks are layered across curiosity, attachment, structure, and philosophy.
9. Every book and every major era transition must explicitly declare:
   - hook continuity score
   - emotional attachment drivers
   - attachment continuity signals
   - reader carry declaration:
     - what the reader is emotionally carrying
     - what the reader is trying to understand
     - what the reader is waiting to see resolved
     - what reassures the reader they remain inside the same epic
   - structural curiosity drivers
   - philosophical engagement drivers
   - unresolved continuity pressure carry-forward

## Anti-Dropoff Validation Rule

A book boundary or era transition hard-fails validation when:

- `hookContinuityScore` is below threshold, and
- any one of the following is absent:
  - attachment continuity
  - anchor continuity
  - unresolved continuity pressure carry-forward

## Derivation + Validation Pipeline

- `EpicContinuityDerivationService` builds full continuity pack and downstream bias map.
- `EpicContinuityValidationService` scores the pack and emits risks/warnings.
- Pack includes diagnostics and cockpit summary for operational visibility.

## Downstream Integration Contracts

ENCS emits explicit bias directives for:

- Narrative psychology
- Chapter state
- Narrative thread priority
- Chapter composition
- Sequence architecture
- Route recurrence
- Literary device allowances
- Hook/closure/carry-forward logic

## Cockpit Integration

The authoritative cockpit (`author-command-cockpit`) is extended with `epicContinuity`:

- Current epic question expression
- Active anchors
- Anchor recurrence health
- Identity persistence status
- Meaning escalation status
- Reader memory targets
- Hook layer status
- Temporal transition health
- Disconnection warnings and unresolved risks
