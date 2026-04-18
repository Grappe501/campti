# Scene Generation Preflight — Specification

## Purpose

Scene Generation Preflight is the **canonical read-only readiness and risk surface** immediately before model-backed scene generation. It answers, using the same loaders and merge path as production hashing:

- Whether launch is **allowed**, **allowed with documented downgrade risk**, or **blocked**
- Per-subsystem readiness (scene input, hash, governance, human gravity, character simulation, research canon, prompt assembly, execution environment, final execution truth)
- Blockers, downgrade risks, advisories, and observational notes with remediation links where applicable

It does **not** call the LLM, mutate prose, or mint a FinalExecutionPackage / Cluster 7 envelope.

## Architecture

| Layer | Responsibility |
|--------|----------------|
| `lib/domain/scene-generation-preflight.ts` | View models, subsystem keys, readiness classes |
| `lib/domain/scene-generation-preflight-rules.ts` | Pure launch allowance and overall readiness derivation |
| `lib/services/scene-generation-preflight-service.ts` | Assembles truth from `loadSceneGenerationInput`, governance merge, hash, enforcement registry, human gravity, character simulation workbench rollup, RICRE summary, env |
| `app/actions/scene-generation-preflight.ts` | Server actions: load, recompute (revalidate), optional launch gate |
| `app/admin/scenes/[id]/page.tsx` | **Preflight** tab + Details inline strip |
| `components/admin/scene-preflight-tab-*.tsx` | Author-facing panel |

## Subsystems (minimum)

1. **scene_input** — `loadSceneGenerationInput` + canonical pre-generation merge + runtime attachments
2. **canonical_hash** — `computeSceneGenerationInputHash` on merged snapshot
3. **governance** — `buildEnforcementRegistry()` semantic violations
4. **human_gravity** — runtime derivation + influence truth flags
5. **character_simulation** — `buildCharacterSimulationWorkbenchSceneRollup` + persisted profile coverage advisory
6. **research_canon** — `summarizeRicreForScene` (contradictions, open claims)
7. **prompt_assembly** — high-level prerequisites + RICRE bundle presence vs canon row count
8. **execution_environment** — `OPENAI_API_KEY` presence (hard blocker when missing)
9. **final_execution_truth** — **observational only**: preflight does not run generation; post-run reports remain authoritative for execution-grade truth

## Non-goals

- Shadow scoring disconnected from the above services
- Persisted preflight history (deferred unless product requires trend dashboards)
- Replacing Cluster 7 / final execution scorecards after a run
