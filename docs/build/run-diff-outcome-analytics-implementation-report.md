# Run Diff + Outcome Analytics — Implementation Report

**Date:** 2026-04-18  
**Scope:** Canonical structured comparison and scene-level outcome analytics on top of the Run Ledger.

## What was added

### Domain

- `lib/domain/scene-run-diff-analytics.ts` — diff VM, deltas, completeness, heuristics, analytics VM, trend/pressure types.
- `lib/domain/scene-run-analytics-validation.ts` — Zod schemas for diff and analytics requests.

### Services

- `lib/services/scene-run-diff-service.ts` — `buildSceneRunDiffViewModel`, default comparison suggestions, governance / preflight / execution / output assembly, advisory heuristics (chronological stability interpretation).
- `lib/services/scene-run-outcome-analytics-service.ts` — `buildSceneRunOutcomeAnalytics`, instability signals, pressure summaries, trend slices, replay audit counting where applicable.

### Server actions

- `app/actions/scene-run-analytics.ts` — `loadSceneRunOutcomeAnalyticsAction`, `loadSceneRunStructuredDiffAction` (Zod-validated; diff reloads ledger server-side so comparisons are not client-assembled).

### UI

- `components/admin/scene-run-ledger-client.tsx` — outcome analytics panel, structured diff blocks, comparison presets, advisory copy for guarded replay.
- `components/admin/scene-run-ledger-tab-section.tsx` — loads initial analytics alongside ledger.

### Verification & tests

- `scripts/verify-run-diff-outcome-analytics.ts` — static checks that services and UI expose the subsystem.
- `package.json` — `verify:run-diff-analytics` script.
- `lib/services/scene-run-diff-service.test.ts`
- `lib/services/scene-run-outcome-analytics-service.test.ts`

### Docs

- `docs/build/run-diff-outcome-analytics-spec.md`
- `docs/build/scene-run-diff-model.md`
- `docs/build/scene-run-outcome-analytics-model.md`
- `docs/build/scene-run-instability-signals.md`
- This report.

## Files updated (naming / integration)

- `lib/domain/scene-run-ledger.ts` — `SceneRunFlatDiffSummary` naming to avoid clash with structured diff summary.
- `lib/services/scene-run-comparison-service.ts` — returns flat diff type.
- `app/admin/narrative/page.tsx` — quick link label for ledger + diff + analytics.

## Schema / migrations

- **None** for this pass; analytics computed from existing ledger and related reads.

## What comparisons are visible

- Side-by-side structured sections: governance, preflight (proxy), execution, output (honest about linkage), replay eligibility notes, advisory heuristics.
- Presets: latest vs previous; latest interactive vs latest machine (when both exist).

## What analytics are visible

- Scene-level: allowance distribution, launch class/source, repair/revision/replay counts, failures/incompletes, average blocker/risk/advisory, instability list, pressure source summary, short trend summary, current generation text context where loaded.

## Deferred / risks

- **Per-run prose diff** — requires durable per-run artifact linkage; until then output delta stays explicitly partial.
- **Chapter/narrative-wide trend cockpit** — modest extension possible; not required for canonical scene-level path.
- **Deeper text semantics** — intentionally not built; length/structure/entity heuristics only where cheap and honest.

## Verification commands

```bash
npm run verify:run-diff-analytics
npm run verify:run-ledger-replay
npm run typecheck
```

## Recommended next step

Add per-run output artifact keys on ledger assembly when generation persists versioned prose per execution, then extend `SceneRunOutputDelta` with bounded text diff (opening/ending/entity mention deltas) without semantic scoring.
