# Stage 8 — Scene legality and readiness (Campti)

## What Stage 8 is

Stage 8 is **not** “run the scene,” simulation, dialogue generation, or branch execution. It is the **legality layer**: whether a scene is in a state where downstream systems can treat constraints as stable, and what the **constraint surface** is for this scene in a given world-era and focal cast choice.

Stage 8 **consumes** Stage 7 and 7.5 as its upstream contract; it does not redesign them.

### Upstream contract (frozen for consumers)

- `getCharacterBrainBundle(personId, worldStateId, sceneId, counterpartPersonId?)`
- `assembleCharacterBrainState` / `assembleCharacterSceneBrainState` in `brain-assembly-engine`
- `getSceneTimeBrainEvaluation` in `scene-brain-runner` actions
- Counterpart resolution order (explicit arg → scene JSON → character state JSON → scene heuristic)
- `SceneConstraintSummary` in `brain-assembly-types` as the normalized scene cue layer (including `Scene.structuredDataJson` patches)

## Hybrid: derived vs authored

**Best model: hybrid.**

| Source | Role |
|--------|------|
| **Derived** | Scene row, linked people/places/events/symbols, world-era character state, governance/pressure bundles via the brain bundle, and heuristics over scene copy. |
| **Editorial / admin** | `Scene.structuredDataJson` — **one patch surface** for Stage 7.5 and Stage 8. Shared keys: `revealBudgetScore`, `pressureTags`, `blockedActions`, `objective`, `forcedStillness`, `socialExposureScore`, `violenceProximityScore`, `immediateSignals`. Stage 8 extensions: `visibilityLegibility`, `historicalSupportRequired`, `focalPerceptionOverride`, `dominantInterpretationOverride`, `sceneClass` (readiness policy). |

Stage 8 adds **readiness judgment** (including **scene-class-aware** policy: public confrontation, intimate disclosure, travel/movement, historical anchor, ensemble, general) on top; it does not require new persisted columns for a first pass. Workspace **debug**: add `?debug=1` to the scene workspace URL to inspect parsed patch + readiness JSON.

## `SceneConstraintSet` (Campti)

A **derived snapshot** (in memory) that aggregates:

- **Upstream:** `SceneConstraintSummary` when present, preferably from `getCharacterBrainBundle` when `worldStateId` and a focal `personId` are known (Stage 7.5 path).
- **`stage8StructuredPatch` / `sceneReadinessClass`:** parsed `structuredDataJson` (7.5 + 8 keys) and scene class for readiness policy (`author` vs `inferred`).
- **`ScenePressureMap`:** active pressures (tone, **scene record visibility**, Stage 7.5 scores, linked **place setting/environment** profiles, events, optional **focal `runSceneTimeBrain`** salience / trace hints).
- **`ScenePerceptionMap`:** visible anchors vs gaps vs ambiguity vs misread risk, **visibility legibility**, **place sensory/terrain cues**, optional focal brain **dominant interpretation** + perception hints.
- **`SceneObjectiveMap`:** scene-level objective plus per-linked-person motivations from `CharacterState` when available.
- **`SceneRevealBudget`:** scalar + band from Stage 7.5 reveal score.
- **`SceneOutcomeEnvelope`:** coarse legal / costly / blocked outcome families (not a full branch table). Each line may carry a short optional **reason** (policy/cue provenance for debugging — not a full trace system).

### Stage 8.5 — tuning against real scenes

Regression fixtures live in `lib/stage8-outcome-envelope-fixtures.ts` and assert separation between buckets (e.g. costly vs blocked), class-specific lines, and regulation-based instability. Run:

`npm run verify:stage8-5`

Extend the fixture list as you review real scenes so heuristics stay sharp rather than merely complete.

### Ingestion packet 01 (vertical slice in DB)

Seeded reference data lives in `prisma/seed-ingestion-packet-01.ts` (invoked from `prisma/seed.ts` after continuity/relationship seeds). It anchors **world state** `seed-ws-ref-ws06` (Jim Crow rural), **focal person** `seed-person-alexis`, and **scene** `ing-pkt-01-scene-intimate-review` with `structuredDataJson.sceneClass: intimate_disclosure` and `VisibilityStatus.REVIEW`. The matching Stage 8.5 regression case is fixture id `campti-ingestion-packet-01-seeded-scene-ws06` in `lib/stage8-outcome-envelope-fixtures.ts` (same outcome separation as the generic intimate-disclosure × REVIEW case, documented for admin traceability).

Future types (`SceneState`, `SceneBranchTable`, `SceneSymbolBindings`, …) attach here without changing the core contract: **legality and readiness first**.

## Readiness: ready vs partial vs blocked

| Level | Meaning |
|-------|---------|
| **ready** | World state + focal path can use the brain bundle; linked anchors exist; no blocking issues. |
| **partial** | Warnings (e.g. heuristic-only constraints, empty draft, tight reveal budget). |
| **blocked** | Missing cast or no linked entities such that constraint surface is undefined for narrative work. |

Exact rules live in `evaluateSceneReadiness` (policy buckets: **blocking**, **warnings**, **info**) and may evolve; the **semantics** stay: readiness is about **inputs**, not prose quality.

## Build order (implementation)

1. Types — `lib/scene-constraint-types.ts`
2. Derived assembly + readiness — `lib/scene-constraint-engine.ts`
3. Server entry — `app/actions/scene-constraints.ts`
4. Admin UI — `components/scene-readiness-panel.tsx` on scene workspace
5. Persistence only if proven necessary (start derived-only)

## Deferred

Full branch tables, symbol binding automation, dialogue, simulation loops, reciprocal multi-actor solvers — later stages.
