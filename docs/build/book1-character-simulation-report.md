# Book 1 — character simulation report (Cluster 8)

## Summary

Book 1 regeneration and DB production scene generation both flow through `CanonicalNarrativeGovernanceOrchestrationService`, which now attaches a **chapter-level character scene emergence plan** to every `CanonicalPreGenerationBundle`. On each `runSceneGeneration` call, **Cluster 8** derives a per-scene runtime artifact from:

- participating people on the scene contract (deterministic mind/voice seeds),
- the merged governance bundle (continuity + EEGS anchors),
- Cluster 6 human-gravity pressure (when enabled),
- relationship pairs among participants,
- constraint evaluation and evolution residue flags.

## Evidence that scenes emerge from characters

1. **Emergence digests** list `sceneNecessityReasons` and `conflictSources` derived from desire/fear collision and EEGS lines—not from empty structural roles alone.  
2. **Prompt lines** (`characterSimulationRuntime.promptInstructionLines`) are injected ahead of prose realism and the model user prompt under `CLUSTER8_CHARACTER_SIMULATION`.  
3. **Prose realism** boosts `voiceDistinctnessScore` when multiple simulation voice profiles are active, nudging craft scoring toward differentiation.  
4. **Cockpit** (admin narrative hub, scene scope) calls `buildCharacterSimulationCockpitPanelForScene`, surfacing live cognitive, relationship, and voice snapshots without a second generation path.

## Book 1–specific notes

Until dedicated author-authored mind rows exist in the database, Book 1 uses **deterministic seeds** from stable person ids so regeneration hashes and inspection panels remain reproducible. The architecture is ready to swap seeds for persisted profiles without changing the runtime contract shape.
