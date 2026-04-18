# Scene Detail Research Tab — Implementation Report

## Added

| Area | Files |
|------|--------|
| Domain | `lib/domain/scene-research-tab.ts`, `lib/domain/scene-research-tab-validation.ts`, `lib/domain/research-workbench-nav.ts`, `lib/domain/scene-research-relevance.ts` (pure relevance + grouping) |
| Resolution | `lib/services/research-target-scene-graph-service.ts` |
| Loader | `lib/services/scene-research-tab-loader-service.ts` |
| Workbench routing | `lib/services/research-workbench-route-load-service.ts` |
| UI | `components/admin/scene-research-tab-section.tsx`, `components/admin/scene-research-tab-client.tsx` |
| Actions | `app/actions/scene-research-tab.ts` |
| Scene page | `app/admin/scenes/[id]/page.tsx` — **Details / Research** tabs |
| Research page | `app/admin/research/page.tsx` — query-param narrowing |
| Dashboard | `research-workbench-dashboard-load-service.ts` — optional narrow + queue filter; `research-workbench.ts` — `narrowContext` |
| Cockpit | `research-workbench-client.tsx` — narrow banner |
| RICRE | `ricre-canon-knowledge-loader-service.ts` — `summarizeRicreForScene` uses graph resolution; chapter included in accepted-canon count |
| Tests / verify | `lib/services/scene-research-tab.test.ts`, `lib/domain/scene-research-relevance.test.ts`, `scripts/verify-scene-detail-research-tab.ts` (async `main` + dynamic loader import), `package.json` script |
| Docs | `docs/build/scene-detail-research-tab-*.md`, `scene-research-*.md` (this file) |

## Schema / migrations

**None** — reuses existing Prisma RICRE models.

## Working

- Scene detail **Research** tab: summary, **accepted canon grouped by target type** with **last author decision timestamp** per row (when `AuthorCanonDecision.resultingCanonRecordId` matches), linked targets (workbench jump), open claims with **evidence snippet** and **prior decision count**, contradiction panel with **severity gloss**, entity impact, **`RICRE_ACCEPTED_CANON`** prompt/hash legibility, **advanced drawer** (provenance hashes for in-scope sources).
- Scene-scoped server actions with Zod + **target/source/claim graph assertions** before orchestration.
- `/admin/research?sceneId=…&queue=…` narrowing and narrow banner.
- **Unit tests** for relevance classification (“unrelated” person id on target does not classify as `person_link`) and grouping helper.

## Advisory / deferred

- **RBAC**: `TODO(auth)` on scene actions (trusted admin).
- **merge_with_existing**: unchanged — not exposed here.
- **DB**: Loader requires migrated RICRE tables; local DB without migration shows Prisma errors until `prisma migrate deploy`.

## Verification

```bash
npm run verify:scene-research-tab
npm run typecheck
```

## Next step

Wire **admin RBAC** on `scene-research-tab` and `research-workbench` actions, then add an optional **Prisma-backed integration test** when a CI database is available.
