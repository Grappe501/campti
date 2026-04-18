# Scene run output delta model (bounded)

## Type: `SceneRunBoundedOutputDiff`

Defined in `lib/domain/scene-run-output-linkage.ts`. Produced by `computeBoundedSceneRunOutputDiff` / `buildBoundedOutputDiffForLedgerKeys` (`lib/services/scene-run-output-delta-service.ts`).

## Sections

### Existence

- Whether text A/B is non-empty after load. Empty is still compared honestly (no fabricated prose).

### Length

- Character delta and paragraph-count delta (blank-line paragraph heuristic).
- **Material length** uses ratio (12% of longer) or absolute (≥400 chars) thresholds — labeled as factual thresholds, not “importance.”

### Opening / ending

- Compared via **fingerprints** stored at persist time (normalized slice hashes), not free-form excerpt dumps in the default UI.
- Summaries are categorical: fingerprint matches or differs.

### Structure

- Paragraph count change.
- **Beat-like markers:** lightweight regex for headings / `BEAT:` / `SCENE:` style prefixes — heuristic, approximate.

### Entity mentions

- See `scene-run-output-entity-mention-model.md`.

### Signals

- Flat list (`SceneRunOutputSignal`) for UI and analytics: each has `derivation: "fact" | "heuristic"`.

## Integration

- **`SceneRunOutputDelta.boundedComparison`** in `lib/domain/scene-run-diff-analytics.ts`.
- Server action `loadSceneRunStructuredDiffAction` loads bounded diff when **both** entries report `linked_output`.

## Honesty when comparison is missing

- One or both runs not `linked_output` → no bounded panel; audit-level output delta still compares linkage fields.
- Both linked but DB read returns fewer than two rows → `buildBoundedOutputDiffForLedgerKeys` returns `null`; diff service marks comparison partial.

## Out of scope

- Subjective quality, tone, or “better” verdicts.
- Heavy NLP coreference or embedding distance.
