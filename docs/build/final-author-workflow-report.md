# Final author workflow report (Cluster 9)

## Summary

Authors now have a **single coherent path**: inspect on the Author Cockpit (read-only bundle), adjust durable inputs in the database or via API nudges, rerun canonical scene generation from Scenes admin, and judge save/presentation using **Cluster 7** truth.

## Step sequence (canonical)

The ordered machine report is produced by `buildFinalAuthorWorkflowReport` in `lib/services/final-author-workflow-service.ts` (also embedded in `reports/cluster9-demo-runbook.snapshot.json` after a dry run).

1. **Select scope** — scene/chapter/book/epic on `/admin/narrative`.
2. **Inspect continuity / emotional / narrator / hooks** — cockpit panels + `/admin/continuity`.
3. **Inspect prose realism and human gravity** — cockpit; treat warnings as craft targets.
4. **Inspect character simulation** — note `profileTruth`; edit **CharacterSimulationAuthorBundle** JSON on `Person` when stable mind/voice is required (Cluster 8 domain shapes).
5. **Apply nudges** — `characterSimulationAuthorNudge` on `SceneGenerationInput` for bounded deltas (API path); never “demo flags”.
6. **Rerun generation** — `runSceneGeneration` from admin actions.
7. **Review certification** — Cluster 7 strip or envelope on the run result.
8. **Save / export / print** — only when `saveEligible` and operator intent align.

## Persistence decisions (minimum viable)

- **Implemented:** `CharacterSimulationAuthorBundle` for author-owned Cluster-8 mind/voice JSON.
- **Deferred (explicit):** Admin UI form for editing bundle JSON (operators may use Prisma Studio or a follow-up admin form); relationship graph still synthetic in Cluster 8 where not modeled in DB.

## Coherence improvements shipped

- Cockpit **quick links** to Scenes, Chapters, Continuity, People, Readiness.
- **Profile truth** label removes ambiguity between DB-backed and hash-seeded simulation inputs.
