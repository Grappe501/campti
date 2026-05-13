# Scene stability memory model (v1)

**Purpose:** A compact, **scene-scoped** read model of recent operational behavior so Decision Assist and operators can reason about churn without a separate persistence table.

**Source:** `lib/domain/scene-stability-operating.ts` (`SceneStabilityMemorySummary`) and builder `buildSceneStabilityMemorySummary` in `lib/services/scene-stability-operating-service.ts`.

## Inputs

- Run outcome analytics summary (allowance distribution, replay/repair counts, failures, legacy/partial counts).
- Preflight summary (primary blocker/risk counts).
- Research tab (blocking contradiction count when loaded).
- Character simulation workbench rollup (blocked readiness count when loaded).
- Output churn hints from durable linkage path (`SceneRunOutputChurnHint`).
- Optional bounded latest-pair diff (`SceneRunBoundedOutputDiff`) for opening/ending/length signals.

## Fields (conceptual)

- **Launch distribution:** risky / blocked counts, failed generations, window run count.
- **Operational churn:** replay audit count, repair/revision count.
- **Truth pressure:** blocking research contradictions (null if research not loaded).
- **Simulation pressure:** blocked persons (null if rollup missing).
- **Output movement:** length oscillation, opening/ending shift, repeated blocked-save outputs — from hints and/or bounded diff signals.
- **Output churn persistence:** `outputChurnPersistentDrift`, `linkedOutputMaterialPairCount`, `linkedOutputPairsCompared` — from `computeLinkedOutputChurnPersistence` over recent `SceneRunGenerationOutput` rows (≥3 snapshots; ≥2 material adjacent transitions ⇒ persistent drift).
- **Completeness notes:** explicit caveats when research or simulation inputs were omitted.

## Principles

- **Honest sparsity:** missing subsystems are called out, not silently treated as zero.
- **Advisory:** memory does not change launch policy.
- **Traceable:** every boolean/count is derivable from named inputs above.
