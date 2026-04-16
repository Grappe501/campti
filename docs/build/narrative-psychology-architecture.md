# Narrative Psychology Architecture

## Scope
- Adds a machine-usable emotional design layer at `epic`, `book`, and `chapter` scale.
- Constrains chapter-state biasing, beat emphasis, prose constraints, and carry-forward tension.
- Preserves native-cognition-first and historical grounding boundaries.

## Core Contracts
- `lib/domain/narrative-psychology.ts`
  - `EpicNarrativePsychology`
  - `BookNarrativePsychology`
  - `ChapterNarrativePsychology`
  - `NarrativePullProfile`
  - `NarrativePsychologyChapterStateBias`
  - `NarrativePsychologyBeatBias`
  - `NarrativePsychologyArchitecture`

## Axes
- `attachment_intensity`
- `curiosity_tension`
- `continuity_investment`
- `identity_pressure`
- `place_immersion`
- `relational_heat`
- `interpretive_instability`
- `anticipatory_dread`
- `recovery_breathing_room`
- `revelation_pressure`
- `unresolved_pull`
- `meaning_depth`

## Runtime Flow
1. Build architecture (`NarrativePsychologyDerivationService`).
2. Validate architecture (`validateNarrativePsychologyArchitecture`).
3. Select chapter profile by sequence.
4. Derive chapter-state bias (`mapNarrativePsychologyToChapterState`).
5. Derive beat bias (`mapNarrativePsychologyToBeatProfile`).
6. Feed beat bias into state-driven beat assembly.

## Reader Pull Model
- Pull is computed per chapter as `NarrativePullProfile`.
- Pull is explicitly sourced from:
  - attachment + uncertainty,
  - continuity investment + threat,
  - place immersion + subtle unreadability,
  - relational tension + delayed interpretation,
  - local state update + unresolved larger pressure.
- Cliffhanger-only logic is disallowed by validation policy.
