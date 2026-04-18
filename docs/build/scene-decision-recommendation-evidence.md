# Scene Decision Recommendation — Evidence & Traceability

## Principles

1. Every recommendation has a **basis summary** and at least one **trigger** describing what fired.
2. **Factual evidence** lines quote or summarize fields from: preflight VM, research tab VM, simulation rollup, analytics summary, ledger entry (for run focus).
3. **Heuristic notes** are separate bullets with `noteStrength` — they must not read as measured truth.
4. **Partial / unavailable** kinds are used when research tab is missing, rollup absent (no cast), or run key not in ledger window.

## Example evidence patterns

| Pattern | Source |
|---------|--------|
| “Launch allowance: blocked” | `SceneGenerationPreflightSummary` |
| “Blocking-shaped contradictions: N” | `SceneResearchTabViewModel.contradictions` |
| “Cast blocking count (rollup): N” | `CharacterSimulationWorkbenchSceneRollup.perPerson` |
| “Repair/revision-sourced runs: N” | `SceneRunAnalyticsSummary` |
| “Structured run diff: material change…” | `buildSceneRunDiffViewModel` field change counts |

## Actions (affordances)

- **scene_tab** → `/admin/scenes/:id?tab=preflight|research|runs|assist`
- **href** → research workbench with `sceneId`, people list, or per-person simulation workbench URLs from rollup
- **advisory_only** — explanation text only when no safe link exists

No action triggers server mutation from this layer.

## Honesty banner

The view model always includes short copy: advisory-only, no policy override, facts vs heuristics labeled.
