# Scene run output linkage model

## Domain types

- **`SceneRunOutputLinkageStatus`** — `lib/domain/scene-run-output-linkage.ts`
- **`SceneRunOutputSummary`** (per ledger row) — `lib/domain/scene-run-ledger.ts`  
  Includes: `linkageStatus`, `outputArtifactId`, `storedCharacterCount`, `storedParagraphCount`, `outputCompleteness`, `sceneGenerationTextSynced`, `openingFingerprint`, `endingFingerprint`, plus execution flags (`generationFinished`, `cluster7RunId`, etc.).

## Artifact reference

**`SceneRunOutputArtifactRef`** describes a persisted row:

- `artifactId` (DB id)
- `ledgerRunKey`, `sceneId`
- `outputCompleteness`, `sceneGenerationTextSynced`
- Counts and fingerprints
- `cluster7RunId`, `createdAtIso`

## Assembly rules

1. **From audits:** `buildOutputSummary` sets baseline status (`legacy_output_unknown` for old successful completions without DB proof, `unlinked_output` for orphans/failures).

2. **Merge from DB:** `attachPersistedOutputs` loads `SceneRunGenerationOutput` for all ledger keys in the window. When a row exists, the entry becomes `linked_output` and summary fields are filled from the row.

3. **Rehearsal / non-persist:** Rows built from `rehearsal_non_launch_evaluated` use `output_not_persisted_by_policy`.

## Run correlation

- Writes occur on the canonical guarded completion path (launch guard service), using the same `ledgerRunKey` recorded in completion audit meta where applicable.

## UX contract

- Ledger table **Output** column: short linkage label + optional char/paragraph counts when linked.
- Run diff: **Bounded prose comparison** panel only when both runs are `linked_output` **and** both DB rows load successfully.
