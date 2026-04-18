# Character Simulation — conflict model

## Source of truth for comparisons

Conflicts are computed in `character-simulation-workbench-conflict-service.ts` by comparing **author partials** to the **deterministic seed** (`CharacterMindSeedService` builds). This is intentionally **heuristic and explainable**, not a duplicate merge engine.

## Categories

| Category | Typical signal |
| --- | --- |
| `worldview_conflict` | High token divergence between author `worldviewFrame` and seed. |
| `motivation_conflict` | Author `coreDesire` far from seed desire. |
| `temperament_conflict` | Opposing conflict style keywords (explosive vs frozen). |
| `stress_response_conflict` | Suppression style vs seed fear avoidance choreography. |
| `voice_register_conflict` | `vocabularyRange` change plus monologue texture clash. |
| `speech_pattern_mismatch` | Conflict speech pattern divergence. |
| `identity_anchor_conflict` | Identity narrative divergence. |
| `timeline_truth_conflict` | Impossible `Person` birth/death ordering — **blocking**. |
| `merged_profile_instability` | Hollow belief patch, oversized brittle lists, cleared taboos, or corrupted merged structures — may be **blocking**. |

## Severities

- **advisory** — disclose; optional operator acknowledgement.
- **warning** — downgrade risk; inspect before treating cast as clean.
- **blocking** — readiness impact `blocked` until repaired.

## Acknowledgement

`acceptedConflictIds` in `workbenchMetaJson` marks **advisory** items the operator accepts. **Blocking** conflicts ignore acknowledgement for readiness purposes.
