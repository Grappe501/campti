# Research workbench — implementation report (2026-04-18)

## Added

| Area | Path |
| --- | --- |
| Domain | `lib/domain/research-workbench.ts`, `lib/domain/research-workbench-validation.ts` |
| Services | `research-workbench-dashboard-load-service.ts`, `research-workbench-orchestration-service.ts`, `research-workbench-downstream-impact-service.ts` |
| Actions | `app/actions/research-workbench.ts` |
| UI | `app/admin/research/page.tsx`, `components/admin/research-workbench-client.tsx` |
| Ingestion | `ingestManualTextForTarget` on `ResearchSourceIngestionService` + `RICRE_MAX_MANUAL_SOURCE_CHARS` export |
| Tests | `lib/services/research-workbench.test.ts` |
| Verify | `scripts/verify-research-workbench.ts`, `npm run verify:research-workbench` |

## Updated

- `components/admin-nav.tsx`, `app/admin/narrative/page.tsx`, `components/admin/author-command-cockpit.tsx`, `app/admin/scenes/[id]/page.tsx`
- `package.json`

## Schema / migrations

**None** — uses existing Prisma RICRE models.

## Working end-to-end

- `/admin/research` dashboard with real aggregates, claim queue, contradiction-shaped list, recent decisions.
- Create target, manual ingest, URL ingest, extract, compare, decision submit (via `CanonReconciliationService`).
- Downstream impact summary for a target.
- Cockpit and nav integration.

## Advisory / deferred

- `merge_with_existing` UI and true merge-by-id.
- LLM extraction behind the same persistence boundary.
- Bulk multi-claim actions.
- Dedicated scene-detail tab (stub link only).
- Full RBAC (`TODO(auth)` in actions).

## Verification

```bash
npm run verify:research-workbench
```

## Next step

Optional: add query-param prefill (`?sceneId=`) on `/admin/research` to seed the scene id textarea when coming from scene admin.
