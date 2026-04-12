/**
 * Phase 6 — Staleness & regeneration (design contract for Phase 6.1 / 6.2 workers).
 * Not an executable loop here: `RevisionJob` + `NarrativeDependencyEdge` are the durable spine.
 */
export const STALENESS_AND_REGENERATION = {
  edges:
    "Each generation pass registers `NarrativeDependencyEdge` rows with consumer (SCENE + sceneId) and producers: GENEALOGICAL_ASSERTION, PERSON, WORLD_STATE_REFERENCE, PLACE, EPIC, BOOK, CHAPTER (HARD), plus optional SIMULATION_SCENARIO and COGNITION_SESSION (SOFT). Reverse lookups find scenes to invalidate when a producer changes.",

  revisionJobs:
    "`RevisionJob` kinds (REGENERATE_SCENE_AI, REEVALUATE_SCENE, CONTINUITY_CHECK) enqueue work per scene; workers may call `runSceneGeneration` and write only `Scene.generationText`, never `authoringText` / `publishedReaderText` without an explicit promotion step.",

  genealogicalAssertionChanged:
    "When an assertion is revised, consumers with producer GENEALOGICAL_ASSERTION should receive jobs; `narrative-revision-service` patterns apply. Scene `narrativeAssemblyStatus` / `continuityState` may flip to STALE / triage.",

  worldStateChanged:
    "Consumers tied to WORLD_STATE_REFERENCE rerun when era slice or inheritance changes; effective world-state id is re-resolved per scene before regen.",

  pinnedCognitionChanged:
    "COGNITION_SESSION edges are SOFT: PINNED session updates suggest optional regen; author triggers `runSceneGeneration` or promotion workflow.",

  simulationPromoted:
    "When a simulation result is promoted into authoring inputs, register/update SIMULATION_SCENARIO edges and optionally enqueue REGENERATE_SCENE_AI; still no auto-overwrite of human prose.",

  chapterRollups:
    "Chapter `NarrativeAssemblyStatus` aggregates child scenes; book/epic assembly follows existing compile pipeline (Phase 6.2).",
} as const;
