# Run Ledger + Replay Panel — Implementation Report

**Date:** 2026-04-18

## Added

- **Domain:** `lib/domain/scene-run-ledger.ts`, `scene-run-ledger-validation.ts`, `scene-run-replay-policy.ts`
- **Services:** `scene-run-ledger-service.ts`, `scene-run-comparison-service.ts`
- **Actions:** `app/actions/scene-run-ledger.ts` — `replaySceneRunAction`
- **UI:** `scene-run-ledger-tab-section.tsx`, `scene-run-ledger-client.tsx`; scene **`Runs`** tab; cockpit quick link
- **Tests:** `scene-run-ledger-assembly.test.ts`, `scene-run-replay-policy.test.ts`, `scene-run-comparison-service.test.ts`
- **Verify:** `scripts/verify-run-ledger-replay-panel.ts`, `npm run verify:run-ledger-replay`
- **Docs:** this file + `run-ledger-replay-panel-spec.md`, `scene-run-ledger-model.md`, `scene-run-replay-policy.md`, `scene-run-comparison-model.md`

## Updated

- `lib/domain/scene-guarded-launch.ts` — `run_ledger_replay` source, `replay_interactive_guard` policy mode
- `app/admin/scenes/[id]/page.tsx`, `app/admin/narrative/page.tsx`

## Schema

- None required for v1; replay uses existing `SceneLaunchAuditLog` + new `eventType` string values.

## Historical facts visible

- Time range, launch class/source/modes (when present), allowance, counts, digest/hash preview, terminal outcome, `cluster7RunId` when completion meta included, completeness label.

## Replay behavior

- Governed interactive guard path, **no** `generationText` persistence, server-chosen intent from history.

## Deferred

- Full preflight snapshot persistence per run; durable output artifact linkage; rich global explorer.

## Verification

```bash
npm run verify:run-ledger-replay
npm run typecheck
```
