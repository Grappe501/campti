# Character Simulation Workbench — specification

## Purpose

The Character Simulation Workbench is the **authoritative admin surface** for Cluster-8 simulation truth that is persisted on `Person` via `CharacterSimulationAuthorBundle`. It replaces ad-hoc JSON editing in Prisma Studio for the canonical mind/voice shapes defined in:

- `lib/domain/character-mind.ts` — `CharacterMindProfile` (+ Zod)
- `lib/domain/character-voice.ts` — simulation `CharacterVoiceProfile` (+ Zod)

## Authority model

| Layer | Meaning |
| --- | --- |
| **Author bundle** | Partial JSON merged by `CharacterMindSeedService.mergeMindProfile` / `mergeVoiceProfile` before runtime derivation. |
| **Derived (seed)** | Deterministic baseline from `CharacterMindSeedService.buildMindProfile` / `buildVoiceProfile`. |
| **Merged** | What canonical scene generation consumes after merge — same path as `loadPersistedCharacterSimulationProfilesForPersonIds` + runtime services. |
| **Workbench meta** | `workbenchMetaJson` on the bundle: `authorNotes`, `acceptedConflictIds` (advisory acknowledgements only). |

There is **no parallel simulation schema**. Guided forms edit the same partial objects that Prisma stores.

## Surfaces

- **Route:** `/admin/people/[id]/simulation-workbench`
- **Cockpit:** Author Cockpit (`/admin/narrative`) shows a cast rollup and quick link to the first scene participant’s workbench.

## Persistence

- `CharacterSimulationAuthorBundle.simulationMindProfileJson` / `simulationVoiceProfileJson`
- `CharacterSimulationAuthorBundle.workbenchMetaJson` (notes + accepted advisory conflict ids)
- `CharacterSimulationAuditLog` — append-only audit for saves and conflict acknowledgements

## Non-goals

- The Preview Lab does **not** call `runSceneGeneration` or any LLM adapter.
- The workbench does **not** mutate `FinalExecutionPackage` directly; callers may attach `characterSimulationWorkbenchSummary` when assembling Cluster 9 evidence.

## Deferred / honest limits

- Field-level diff visualization and per-leaf provenance are **group-level** today (`buildCharacterSimulationFieldStatuses`).
- Deep nested mind objects (fear/wound maps) are seed-backed until extended guided editors land; operators can still rely on comparison JSON for inspection.
