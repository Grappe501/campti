# Scene Run Ledger — Model

## Types (`lib/domain/scene-run-ledger.ts`)

- **`SceneRunLedgerViewModel`** — summary counts + `entries[]`.
- **`SceneRunLedgerEntry`** — one logical run: `ledgerRunKey`, timestamps, `historyCompleteness`, historical guard/preflight snapshots, audit linkage, output summary, **replay eligibility** + notes.

## `ledgerRunKey`

Stable short key: sha256(sceneId, startAuditId, startTimeMs) truncated — identifies a run in URLs/actions without leaking DB ordering assumptions.

## History completeness

| Value | Meaning |
|-------|---------|
| `full` | Digest + launch classification present |
| `partial` | Missing digest or incomplete terminal audit |
| `legacy` | Predates `launchClass` / `launchSource` columns |
| `insufficient` | Reserved for unrecoverable linkage |

## Assembly (`groupAuditRowsIntoLedgerEntries`)

- **Pair:** `launch_confirmed_and_started` → terminal (`launch_allowed_*_completed` | `launch_generation_failed`).
- **Standalone:** `rehearsal_non_launch_evaluated`.
- **Orphan:** start without terminal (incomplete run).

## Service

- `loadSceneRunLedger(sceneId, limit)`
- `loadSceneRunLedgerEntry(sceneId, ledgerRunKey)`
- `loadSceneRunDetail` — entry + current preflight contrast + feasibility notes
- `loadRecentSceneRunLedgers` — optional multi-scene slice for future panels
