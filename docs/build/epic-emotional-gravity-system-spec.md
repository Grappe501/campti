# Epic Emotional Gravity System (EEGS) Spec

## Purpose

EEGS is the formal emotional-weight architecture for Campti. It keeps reader attachment, consequence, and pressure continuity alive across centuries, settings, and tonal shifts.

## Scope

EEGS operates across:

- Epic
- Series/Trilogy
- Book
- Chapter
- Scene
- Character
- Relationship
- Generational pattern

## Core Contracts

Machine-usable contracts are defined in `lib/domain/epic-emotional-gravity.ts`:

- `EpicEmotionalGravityProfile`
- `SeriesEmotionalGravityPlan`
- `BookEmotionalGravityPlan`
- `ChapterEmotionalGravityPlan`
- `SceneEmotionalGravityPlan`
- `CharacterAttachmentProfile` and bond primitives
- `ConsequenceProfile` and irreversibility primitives
- `FateAgencyProfile`
- `RelationalStakeProfile`
- `GenerationalBurdenProfile`
- `EmotionalCarryForwardProfile`
- `TemporalEmotionalContinuityProfile`
- `EpicEmotionalGravityDownstreamBias`
- `EpicEmotionalGravityCockpitSummary`
- `CamptiEpicEmotionalGravityPack`

## Non-Negotiable Laws

1. Attachment is built, never assumed.
2. Consequence is durable, not resettable.
3. Fate vs agency tension remains active.
4. Emotional continuity survives era shifts.
5. Greatness comes from pressure + attachment + consequence.
6. Relational stakes are explicit and machine-usable.
7. Generational inheritance stays active.
8. Hope and dread coexist.
9. Cockpit remains singular and authoritative.
10. Historical/cultural integrity overrides generic melodrama defaults.

## Anti-Thin Emotion Rule

A chapter/segment is invalid if it has no meaningful:

- vulnerability exposure
- fear/desire line
- relational risk
- carry-forward residue
- consequence shadow

## Emotional Continuity Rule

A major era transition is invalid if it does not preserve at least:

- one attachment mode
- one burden line
- one consequence shadow
- one fate/agency tension line
- one carry-forward residue

## Engine Responsibilities

- `CharacterAttachmentEngineService`
  - Builds bond vectors from desire/fear/vulnerability/contradiction
  - Emits POV/prose/literary/hook bias
- `IrreversibilityConsequenceService`
  - Tracks irreversible identity/relationship/loss changes
  - Classifies reversibility spectrum
- `FateAgencyEngineService`
  - Models repeating patterns, break attempts, divergence windows
- `RelationalStakesService`
  - Formalizes who matters, why, and what is at risk
- `GenerationalBurdenService`
  - Models burden/gift/warning/silence/reclamation inheritance logic
- `EmotionalCarryForwardService`
  - Tracks chapter/book/era emotional residue
- `TemporalEmotionalContinuityService`
  - Enforces difference-without-dislocation transitions
- `EpicEmotionalGravityDerivationService`
  - Builds complete EEGS pack + downstream bias map + cockpit summary
- `EpicEmotionalGravityValidationService`
  - Scores and validates anti-thin + temporal continuity rules

## Downstream Integration Map

EEGS emits explicit bias directives for:

- Narrative psychology
- Chapter state
- Narrative thread priorities
- Sequence architecture
- Chapter composition requirements
- Scene generation priorities
- Prose constraints
- Literary device allowances
- Hook/carry-forward design
- POV weighting

## Cockpit Integration

The authoritative cockpit (`author-command-cockpit`) is extended with `emotionalGravity`:

- Attachment status by character line
- Active fear/desire/vulnerability lines
- Irreversibility markers
- Fate vs agency pressure map
- Relational stakes map
- Generational burden status
- Carry-forward summary
- Temporal emotional continuity health
- Emotionally thin/reset-heavy warnings
- Epic emotional gravity score/diagnostics
