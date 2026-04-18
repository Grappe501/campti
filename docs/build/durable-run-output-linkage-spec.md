# Durable run output linkage — specification

## Purpose

Guarded scene generation produces **runs** (audit trail + execution ids) and **output** (prose). This subsystem **durably links** each completed run to the snapshot of prose it produced so operators can answer:

- Which artifact belongs to run *R*?
- How did bounded, factual traits of the prose change between runs *A* and *B*?

It is **not** a prose-quality oracle. There is no universal writing score.

## Linkage basis

- **Primary key:** `ledgerRunKey` — stable hash of `sceneId`, launch start audit id, and start timestamp (see `lib/utils/scene-ledger-run-key.ts`). Same key is used in the Run Ledger and in `SceneRunGenerationOutput.ledgerRunKey` (unique per scene/run).

- **No timing-only inference:** If no row exists, the ledger does not pretend a run “probably” used current `generationText`.

## Persistence

- Model: `SceneRunGenerationOutput` (Prisma). Stores prose snapshot, fingerprints, counts, completeness, sync flags, and correlation metadata written on successful guarded completion.

## Linkage statuses (honest)

| Status | Meaning |
|--------|---------|
| `linked_output` | A `SceneRunGenerationOutput` row exists for this `ledgerRunKey`. |
| `unlinked_output` | Run did not finish successfully, was interrupted, or otherwise has no durable snapshot. |
| `legacy_output_unknown` | Run completed before linkage was written, or no row was ever stored — **unknown** pairing. |
| `output_not_persisted_by_policy` | Path intentionally does not persist prose (e.g. certain rehearsal / non-launch evaluations). |
| `linked_output_missing_artifact` | Reserved for broken pointers; surface when row integrity fails. |

## Bounded output delta (companion)

See `scene-run-output-delta-model.md` and `scene-run-output-entity-mention-model.md`. Signals are length, paragraph structure heuristics, opening/ending **fingerprints** (hashes of normalized slices), and **scene-linked** entity mention counts — not literary judgment.

## Out of scope (this pass)

- Deep semantic or embedding-based “better prose” comparison.
- New launch or replay paths.
- Second prose store parallel to existing scene storage; snapshots complement the canonical persist path.

## Related code

- `lib/services/scene-run-generation-output-persist-service.ts`
- `lib/services/scene-run-ledger-service.ts` (`attachPersistedOutputs`, `mergeOutputRow`)
- `lib/services/scene-run-output-delta-service.ts`
- `app/actions/scene-run-analytics.ts`
