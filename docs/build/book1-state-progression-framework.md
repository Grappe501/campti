# Book 1 Chapter State Progression Framework

## Intent

This framework defines state evolution for Book 1 across the Natchitoches-centered Red River arc toward displacement and proto-Campti reformation.
It is a progression model, not a rigid outline.

Reference implementation:
- `lib/chapter-state/book1-state-pack-generator.ts`

## Phase map

### Phase A: continuity under readable conditions

Target profile:
- high `memory_continuity`
- low `movement_pressure`
- moderate `labor_pressure`
- stable `identity_stability`

Likely chapter cluster:
- Chapter 1 (and optionally part of Chapter 2 opening)

### Phase B: subtle signal disturbance

Target profile:
- `signal_integrity` softens from clear -> noisy
- `external_awareness` rises
- `environmental_stability` and readability decline slightly

Likely chapter cluster:
- Chapters 2-3

### Phase C: obligation strain and interpretive instability

Target profile:
- rising `relational_heat`
- rising `decision_pressure`
- memory still strong but precedent less sufficient

Likely chapter cluster:
- Chapters 4-5

### Phase D: fracture recognition

Target profile:
- weakening `identity_stability`
- strained `social_cohesion`
- `movement_pressure` becomes thinkable

Likely chapter cluster:
- Chapter 6

### Phase E: adaptation / preparation

Target profile:
- low reversibility and high decision cost
- continuity must be carried deliberately
- `meaning_load` rises
- movement pressure shifts from abstract to operational

Likely chapter cluster:
- Chapters 7-8 and onward until crossing trigger

### Phase F: crossing / displacement / reformation

Target profile:
- high `movement_pressure`
- continuity-level `meaning_load`
- at-risk identity continuity with explicit rebuilding logic

Likely chapter cluster:
- deferred to later Book 1 chapters beyond current sample pack

## Progression constraints

Non-negotiable progression constraints:
- movement pressure cannot spike in early chapters without scaffolded phase signals
- meaning load should not dominate routine chapters
- identity decline should be gradual and coupled with continuity-carrying actions
- increased external awareness should shift beat emphasis toward consequence and decision beats

## Runtime usage

This framework is consumed as:
- chapter state phase labels (`progressionPhase`)
- validation compatibility checks in `validateChapterState()`
- sequence continuity checks in `validateChapterStateSequence()`
