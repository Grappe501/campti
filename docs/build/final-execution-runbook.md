# Final execution runbook (canonical Book / Chapter / Scene)

This runbook describes the **real** Campti canonical stack. Labels distinguish **cockpit inspection** from **production scene generation**.

## 1. Preconditions

- Database migrations applied through at least `20260418100000_character_simulation_author_bundle_cluster9` for persisted simulation JSON (otherwise the loader falls back to deterministic seeds only).
- `OPENAI_API_KEY` set when you intend to run the LLM step (otherwise rehearsal stops before a Cluster 7 envelope from a fresh generation).

## 2. Operator entry points

| Goal | Where |
|------|--------|
| Inspect governance, realism, human gravity, character simulation | Admin → **Author Cockpit** (`/admin/narrative`) |
| Run or save prose | Admin → **Scenes** — actions calling `runSceneGeneration` |
| Author simulation JSON | Admin → **People** — `CharacterSimulationAuthorBundle` rows (via Prisma Studio, API, or future admin form) |

## 3. Canonical scene generation path (truth order)

1. `loadSceneGenerationInput`
2. `prepareCanonicalPreGenerationBundleForScene` (Cluster 4 governance merge when enabled)
3. Human gravity derivation (Cluster 6)
4. Load `CharacterSimulationAuthorBundle` per participating person → merge into seeds → Cluster 8 derive
5. Prose realism (Cluster 5)
6. `generateSceneProseWithModel` (LLM)
7. Validations + `buildCluster7RuntimeTruthEnvelope`

## 4. Save eligibility

Follow the **Cluster 7** strip on the cockpit: `saveEligible`, `saveBlockedReasons`, override flags. Do not present model JSON as reader-canonical.

## 5. Rehearsal command

```bash
npx tsx scripts/cluster9-final-dry-run.ts
```

Artifacts land under `reports/`. If the script reports `rehearsal_incomplete`, treat readiness as **not** execution-ready until a full run with Cluster 7 is captured.
