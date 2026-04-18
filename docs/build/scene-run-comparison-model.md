# Scene Run Comparison — Model

## API

- **`compareSceneRunEntries(a, b)`** — pure diff of summarized audit fields (allowance, class, source, counts, digest prefix, hash preview, output flags, `cluster7RunId`, replay eligibility).
- **`compareSceneRunsForScene`** — async helper when entries must be loaded by key (optional).

## Scope (v1)

Structured field deltas only — **no** full `generationText` diff (artifacts not uniformly keyed by run in DB).

## UX

Scene **Runs** tab: two dropdowns + **Compare** → one-line summary + changed field list (via `summaryLine`).
