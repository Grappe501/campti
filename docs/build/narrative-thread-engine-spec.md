# Narrative Thread Engine Spec

## Purpose

The Narrative Thread Engine is a core architecture layer for persistent lines of meaning, tension, continuity, and delayed convergence across scenes, chapters, books, and cross-book arcs.

This engine is **not** a subplot list and **not** a note system. It is a machine-usable planning and runtime adapter layer integrated with:

- `chapter_state_model`
- beat profile recommendation and beat assembly chain
- multi-scene chapter composition
- Author Command Cockpit inspection surfaces

## Core Artifacts

- `narrative_thread` (domain object)
- `thread_node` / occurrence model
- `chapter_composition` (multi-scene thread binding model)
- `narrative_thread_chapter_state_influence`
- `narrative_thread_beat_influence`
- callback / reentry / delayed convergence events
- multi-POV reinterpretation records
- route/setting coverage report for Red River recurrence
- cockpit thread inspection payload

## Thread Object Contract

Implemented in `lib/domain/narrative-thread.ts`.

Required fields include:

- identity: `threadId`, `threadName`, `threadType`, `scaleLevel`
- origin: `originScope`, `originBookId`, `originChapterId`, `originSceneId`
- status: `currentStatus`, `currentVisibility`, `currentTensionLevel`, `currentMeaningLoad`
- continuity topology: `continuityRole`, `activeCarriers`, `hiddenFrom`, `knownBy`
- bindings: `locationBindings`, `philosophyBindings`, `relationshipBindings`
- dynamic potentials: `callbackPotential`, `reinterpretationPotential`, `convergencePotential`, `divergencePotential`
- control logic: `activationConditions`, `suppressionConditions`, `escalationRules`, `callbackRules`, `reentryRules`, `resolutionRules`, `handoffRules`
- memory/payoff: `memoryTraceStrength`, `payoffDelayProfile`
- validation/provenance: `validationFlags`, `provenance`

## Required Thread Types

Engine supports the required set:

1. `primary_plot_thread`
2. `secondary_plot_thread`
3. `character_arc_thread`
4. `relational_thread`
5. `memory_thread`
6. `continuity_thread`
7. `philosophy_thread`
8. `warning_thread`
9. `belief_worldview_thread`
10. `setting_thread`
11. `route_thread`
12. `rumor_signal_thread`
13. `trade_contact_thread`
14. `hidden_history_thread`
15. `identity_thread`
16. `place_attachment_thread`
17. `movement_thread`
18. `mystery_thread`
19. `revelation_thread`
20. `convergence_thread`

## Required Scales and States

Scale levels:

- `scene_scale`
- `chapter_scale`
- `book_scale`
- `epic_scale`
- `cross_book_scale`

States:

- `seeded`
- `active`
- `latent`
- `suppressed`
- `redirected`
- `converging`
- `diverging`
- `recalled`
- `reinterpreted`
- `resolved`
- `transformed`

## Thread Node (Occurrence) Model

`ThreadNode` captures concrete occurrences with required callback and delayed convergence support:

- identity and location: `threadNodeId`, `parentThreadId`, `chapterId`, `sceneId`
- function: `nodeType`, `nodeFunction`
- visibility and interpretation: `visibleToPov`, `visibleToReader`, `interpretiveClarity`
- callback and convergence: `callbackMarker`, `futureLinkHints`, `hiddenConvergenceKey`, `delayedConvergenceBinding`, `laterReentryTargets`
- shifts: `tensionShift`, `meaningShift`, `stateShift`
- anchors/bindings: `locationAnchor`, `characterAnchor`, `beatBindings`

## Multi-Scene Chapter Composition

`chapter_composition` enforces first-class multi-scene structure:

- `sceneSequence` (required)
- thread sets by function: `dominantThreads`, `latentThreads`, `callbackThreads`, `convergingThreads`
- transition surfaces: `sceneTransitions`, `sceneContrastLogic`
- carry surfaces: `chapterClosureProfile`, `chapterCarryForwardProfile`

Each scene independently supports activate/advance/suppress/distort/seed/echo and delayed convergence bindings.

## Chapter State Integration

`NarrativeThreadToChapterStateService` implements:

- thread -> chapter-state influence (`narrative_thread_chapter_state_influence`)
- chapter-state -> thread activation recommendations
- continuity projection into `activeContinuityThreads` / `threatenedContinuityThreads`

Mapped influences include:

- continuity/memory -> memory continuity and meaning load pressure
- relational suppression/strain -> relational heat and social cohesion deltas
- movement/route -> movement pressure + external awareness shifts
- philosophy/worldview -> meaning load and identity pressure deltas

## Beat Integration

`NarrativeThreadToBeatProfileService` implements thread-aware beat bias:

- relational -> social/relational interpretation beats
- memory -> memory comparison beats
- warning -> salience lock + consequence seed beats
- philosophy/worldview -> meaning trace emphasis
- setting/route -> environmental confirmation + route-link signal beats
- mystery/convergence -> deferred interpretation and callback carry-forward beats

Thread bias merges with chapter-state and narrative-psychology beat bias before chain assembly.

## Callback / Reentry / Reinterpretation

`ThreadCallbackReentryService` implements:

- callback extraction from markers + reentry targets
- delayed convergence event synthesis via shared hidden convergence keys
- multi-POV reinterpretation payloads (event anchor, source POV, target POV, reinterpretation delta, memory distortion factor)

## Red River Setting/Route System

`SettingThreadCoverageService` implements:

- `SettingThread`, `RouteThread`, `LocationPresenceRecord` support
- direct and indirect location appearance counting
- recurrence quality checks (`missingLocationIds`, `underrepresentedLocationIds`)
- recommendations for next appearance windows

Indirect mention modes count toward recurrence (rumor/report/memory/trade contact/etc.), not only direct scene placement.

## Philosophy / Idea Thread System

Philosophy and worldview lines are modeled as first-class threads with:

- explicit `philosophyBindings`
- low-to-high explicitness control at reinterpretation layer
- action-carried meaning transfer via thread nodes and beat bindings
- cross-scene and cross-book callback viability

## Cockpit Integration

Author Command Cockpit now includes an optional `narrativeThreads` inspection panel:

- active/latent/unresolved/resolved thread counts
- callback markers
- delayed convergence markers
- reinterpretation candidates
- philosophy propagation visibility
- scene-level density scores
- warnings for thin/isolated chapters

No duplicate cockpit/workbench was created.
