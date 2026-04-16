# Chapter Composition Engine Spec

## Purpose

The Chapter Composition Engine is the formal architecture layer between high-level chapter psychology/state planning and downstream beat/prose generation. It treats multi-scene composition as first-class and enforces narrative density, delayed convergence, route recurrence, and philosophy propagation in machine-usable form.

## Core Objects

Primary schema source: `lib/domain/chapter-composition.ts`.

### `ChapterCompositionPlan`

Required fields:

- `compositionPlanId`
- `chapterId`
- `parentBookId`
- `parentNarrativePsychologyId`
- `parentChapterStateId`
- `activeThreadIds`
- `latentThreadIds`
- `callbackThreadIds`
- `routeRequirementStatus`
- `philosophyRequirementStatus`
- `compositionMode`
- `sceneCountTarget` (2-6 default-capable)
- `sceneSequence`
- `sceneContrastProfile`
- `delayedConvergenceBindings`
- `callbackMarkers`
- `reinterpretationAnchors`
- `densityScore`
- `densityWarnings`
- `routeCoverageNotes`
- `continuityCarryForwardPlan`
- `unresolvedPressurePlan`
- `chapterClosureProfile`
- `validationFlags`

### `ComposedScenePlan`

Required fields:

- `scenePlanId`
- `chapterId`
- `sceneOrder`
- `sceneRole`
- `povCandidateWeights`
- `dominantThreadIds`
- `secondaryThreadIds`
- `latentThreadIds`
- `settingBindings`
- `routeBindings`
- `philosophyBindings`
- `callbackSeeds`
- `delayedConvergenceKeys`
- `requiredBeatBiases`
- `requiredStateBiases`
- `apparentConnectionLevel`
- `actualConnectionLevel`
- `transitionStrategy`
- `carryForwardPressureType`
- `sceneClosureType`
- `validationFlags`

## Composition Modes

- `braided_continuity`
- `signal_clustered`
- `contrast_composition`
- `delayed_convergence`
- `memory_echo`
- `route_braided`
- `relational_spread`
- `layered_pressure`
- `fracture_spread`
- `adaptation_braid`

## Scene Roles

- `grounding_scene`
- `route_signal_scene`
- `labor_scene`
- `relational_scene`
- `rumor_scene`
- `warning_scene`
- `memory_echo_scene`
- `setting_presence_scene`
- `philosophy_echo_scene`
- `fracture_scene`
- `convergence_scene`
- `callback_scene`
- `reentry_scene`
- `closure_scene`
- `displacement_prep_scene`

## Derivation Rules

Derivation implementation: `lib/services/chapter-composition-derivation-service.ts`.

Examples embedded in production logic:

- High `place_immersion` + route/location pressure increases grounding + route/setting scene roles.
- High `unresolved_pull` biases toward `delayed_convergence` mode and extra callback/convergence markers.
- High `relational_heat` injects `relational_scene`.
- High `external_awareness` requires route signal/rumor pathways.
- Active philosophy threads with explicitness ceiling route meaning through action/consequence/memory carriers.
- Missing location recurrence in ledger biases scene role sequence toward route signaling.

## Delayed Convergence and Callback Model

Delayed convergence object fields:

- `delayedConvergenceKey`
- `hiddenConvergenceBinding`
- `convergenceWindow`
- `convergencePayoffTarget`
- `connectionVisibilityNow`
- `connectionVisibilityLater`

Callback object fields:

- `callbackId`
- `sourceSceneId`
- `sourceThreadId`
- `callbackStrength`
- `callbackWindow`
- `callbackType`
- `laterTargetOptions`

## Multi-POV Reinterpretation Anchors

`ReinterpretationAnchor` fields:

- `reinterpretationAnchorId`
- `sourceSceneId`
- `sourceThreadIds`
- `originalPovId`
- `alternatePovCandidates`
- `reinterpretableElements`
- `likelyMeaningShift`
- `hiddenInformationDelta`
- `reentryEligibilityWindow`
- `validationFlags`

## Density and Thinness Rules

Implemented in `lib/services/chapter-composition-density-service.ts`.

Thinness checks include:

- single dominant thread family
- missing callback markers
- missing setting/route presence
- missing unresolved carry-forward
- repetitive scene roles
- no delayed convergence/echo path

Output:

- `densityScore`
- `densityWarnings`
- `hardThinChapterFlag`

## Route Recurrence Enforcement

Implemented in `lib/services/route-recurrence-ledger-service.ts`.

Book-level ledger:

- `locationId`
- `locationName`
- `currentBookId`
- `directPresenceCount`
- `indirectPresenceCount`
- `lastAppearanceChapter`
- `appearanceModesUsed`
- `associatedThreads`
- `recurrenceSatisfied`
- `nextRecommendedAppearanceWindow`

Rule: each major route location must have at least one meaningful direct or indirect presence event per book.

## Philosophy Propagation

Implemented in `lib/services/philosophy-propagation-service.ts`.

`PhilosophyPropagationPlan` tracks:

- active philosophy thread ids
- explicitness ceiling
- preferred carrier modes
- next echo opportunities
- scene-level placement suggestions
- delayed payoff potential

## Cockpit Integration

Authoritative cockpit receives chapter composition summary via:

- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `components/admin/author-command-cockpit.tsx`

No parallel cockpit/workbench is introduced.
