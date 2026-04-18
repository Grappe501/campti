# Final readiness scorecard (human summary)

Machine JSON: `reports/final-readiness-scorecard.json` (from `buildFinalReadinessScorecard`).

## Dimensions

| Flag | Meaning |
|------|---------|
| `canonicalRuntimeReady` | `FinalExecutionPackage.readinessStatus` is neither `blocked` nor `rehearsal_incomplete`. |
| `cockpitReady` | Cockpit bundles are structurally complete for inspection (always true when services return). |
| `authorWorkflowReady` | Linked admin surfaces exist for select → inspect → rerun → certify (always true in this build). |
| `persistenceReady` | Author simulation persistence **schema** ships; operators choose when to populate rows. |
| `outputTrustReady` | Execution-ready or execution-ready-with-warnings (Cluster 7-derived package). |
| `demonstrationReady` | Output trust **and** no blocked/downgrade reasons on the package (strict demo bar). |

## Honest risks (2026-04 rehearsal)

- **LLM availability:** Without `OPENAI_API_KEY`, dry run emits `rehearsal_incomplete` — not a failure of governance code, but **not** production evidence.
- **Migration drift:** If `CharacterSimulationAuthorBundle` is missing in a database, the loader falls back to seed-only (`P2021` handled); demos should disclose “seed-only cast” when `profileTruth` is `deterministic_seed_only` or `mixed`.
- **Remote migrate state:** If `prisma migrate deploy` stops on an unrelated migration, apply DBA recovery before relying on new tables in that environment.

## Next polish (recommended)

- Admin form: edit `simulationMindProfileJson` / `simulationVoiceProfileJson` with JSON schema validation UI.
- Optional: persist relationship simulation profiles when the narrative model gains stable relationship ids for scenes.
