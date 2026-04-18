# Durable run output linkage — implementation report

## What was added

1. **Prisma model `SceneRunGenerationOutput`** with unique `ledgerRunKey` per scene, prose snapshot, fingerprints, counts, completeness, sync flag, and correlation fields (migration `20260418220000_scene_run_generation_output`).

2. **Persist service** `persistSceneRunGenerationOutputRecord` — invoked from the guarded launch completion path after successful generation.

3. **Shared `computeSceneLedgerRunKey`** — `lib/utils/scene-ledger-run-key.ts` (aligned with ledger assembly).

4. **Ledger merge** — `attachPersistedOutputs` / `mergeOutputRow` upgrade entries to `linked_output` when a row exists; honest statuses when not.

5. **Bounded delta service** — `scene-run-output-delta-service.ts` (structure, entity lexicon, `computeBoundedSceneRunOutputDiff`, `buildBoundedOutputDiffForLedgerKeys`).

6. **Run diff** — `buildSceneRunDiffViewModel` accepts optional `SceneRunBoundedOutputDiff`; output delta and heuristics use it when present.

7. **Server action** — `loadSceneRunStructuredDiffAction` loads bounded diff when both runs are linked.

8. **UI** — Run ledger: **Output** column; structured diff **Bounded prose comparison** panel; decision assist shows **output churn hints** when loaded.

9. **Churn hints service** — `loadSceneRunOutputChurnHints` for decision assist (`summary.outputChurnHints`).

10. **Tests** — `scene-run-output-delta-service.test.ts`, extended `scene-run-diff-service.test.ts` and `scene-run-ledger-assembly.test.ts`.

11. **Verification** — `scripts/verify-durable-run-output-linkage.ts`, npm script `verify:durable-run-output-linkage`.

12. **Docs** — this file plus spec/model documents in `docs/build/`.

## Key files touched (non-exhaustive)

- `prisma/schema.prisma`, migration SQL
- `lib/services/scene-launch-guard-service.ts`, `scene-launch-audit-service.ts`
- `lib/services/scene-run-ledger-service.ts`
- `lib/services/scene-run-diff-service.ts`
- `lib/domain/scene-run-ledger.ts`, `scene-run-diff-analytics.ts`, `scene-run-output-linkage.ts`, `scene-decision-assist.ts`
- `app/actions/scene-run-analytics.ts`
- `components/admin/scene-run-ledger-client.tsx`, `scene-decision-assist-client.tsx`

## What operators see

- **Ledger:** per-run linkage label; when linked, compact char/paragraph counts and completeness label.
- **Run diff:** governance/preflight/execution/output fields plus, when available, bounded signals (length, opening/ending fingerprints, structure, entity mention list).

## Deferred / follow-ups

- Async **material diff** in decision assist could await bounded diff for the latest pair (currently sync governance-only slice).
- Explicit Zod action for “load artifact by run key” only if a dedicated UI endpoint is needed.
- `linked_output_missing_artifact` if we detect row/prose inconsistency and want to surface it explicitly.

## Verification

```bash
npm run verify:durable-run-output-linkage
```

Includes static script plus unit tests for delta, diff, and ledger assembly.

## Risks

- **Substring entity counts** can mislead on short names; lexicon quality matters.
- **Fingerprint thresholds** for “material” length are tunable — document changes if adjusted.
