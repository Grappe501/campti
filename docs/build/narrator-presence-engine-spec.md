# Narrator Presence Engine / Convergence Engine Spec

## Purpose
This specification defines the Narrator Presence Engine / Convergence Engine (NPE/NCE) as a continuity-bearing subsystem for Campti. The narrator is modeled as a formal narrative force, not a style overlay.

## Narrator Identity Contract
The canonical narrator is modeled in `NarratorIdentityProfile` as Steve Grappe (author-guide around 2026), with explicit lineage proximity growth and a trigger-bound path to first-person presence.

Required identity fields:
- `narratorId`
- `narratorName`
- `narratorTemporalPosition`
- `narratorCulturalPosition`
- `narratorVoiceRoot`
- `narratorRelationshipToEpic`
- `narratorRelationshipToLineage`
- `narratorKnowledgeModes`
- `narratorAuthorityModes`
- `narratorStakeTrajectory`
- `narratorConvergenceTriggers`
- `narratorModeTimeline`
- `validationFlags`

## Presence Levels
`NarratorPresenceLevel` is formalized as:
- `invisible`
- `subtle`
- `guiding`
- `interpretive`
- `reflective`
- `personal`
- `intimate`
- `first_person`

Presence is derived per chapter and scene via `NarratorPresencePlan`.

## Mode Model
`NarratorModeProfile` governs:
- visibility and distance behavior (`currentPresenceLevel`, `proseDistanceEffect`)
- authority and certainty (`authorityMode`, `knowledgeMode`, `certaintyMode`)
- emotional load (`emotionalStakeLevel`)
- intervention guardrails (`permittedInterventions`, `forbiddenInterventions`)
- continuity function (`hookContinuityRole`)

## Convergence Model
`NarratorConvergenceProfile` defines gradual convergence stages:
1. `distant_observer`
2. `lineage_aware_guide`
3. `emotionally_invested_interpreter`
4. `family_near_witness`
5. `inherited_memory_carrier`
6. `threshold_of_self`
7. `first_person_presence`

Trigger families include grandfather, father, self-line thresholds, plus direct memory and direct witness thresholds.

## Era Bridging
`NarratorEraBridgeProfile` enforces continuity across era jumps with:
- reassurance signals
- required active mode constraints
- allowed/prohibited tone shifts
- distance-without-dislocation rules
- hook and epic-question continuity plans

## Downstream Integrations
`NarratorDownstreamIntegrationMap` maps narrator constraints into:
- ENCS
- EEGS
- HCEL/hook declarations
- Narrative Psychology
- Sequence Architecture
- Chapter Composition
- Scene Generation
- Prose constraints
- Literary device allowances
- POV boundary governance

## Validation
`NarratorPresenceValidationResult` evaluates:
- abrupt mode shifts without trigger chains
- narrator overpowering character-native cognition
- continuity drop from narrator disappearance in risky transitions
- premature first-person entry
- missing bridge anchors in era dislocation
- stake/proximity mismatch
- adjacent voice inconsistency

Outputs include hard failures, soft warnings, convergence score, and suggested repairs.

## Cockpit Surface
`NarratorCockpitSummary` surfaces:
- presence level
- authority mode
- knowledge mode
- convergence stage
- upcoming triggers
- hook continuity contribution
- narrator/character boundary warnings
- temporal bridge status
- first-person readiness
- voice-shift risks
