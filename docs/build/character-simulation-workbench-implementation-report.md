# Character Simulation Workbench — implementation report (2026-04-18)

## Summary

Delivered a production-oriented **Character Simulation Workbench** integrated with the existing Cluster-8/9 stack: domain contracts, Zod + semantic validation, load/save/conflict/preview/provenance/audit/readiness services, admin UI, Author Cockpit rollup, optional `FinalExecutionPackage.characterSimulationWorkbenchSummary`, tests, verification script, and operator documentation.

## Added files (high level)

| Area | Path |
| --- | --- |
| Domain | `lib/domain/character-simulation-workbench.ts`, `lib/domain/character-simulation-workbench-validation.ts` |
| Services | `lib/services/character-simulation-workbench-*.ts` (load, save, conflict, preview, provenance, audit, readiness, scene aggregate) |
| Actions | `app/actions/character-simulation-workbench.ts` |
| UI | `app/admin/people/[id]/simulation-workbench/page.tsx`, `components/admin/character-simulation-workbench-client.tsx` |
| Tests | `lib/services/character-simulation-workbench.test.ts` |
| Verify | `scripts/verify-character-simulation-workbench.ts` |
| Docs | Six `docs/build/character-simulation-*.md` files (this report included) |
| Migration | `prisma/migrations/20260418180000_character_simulation_workbench_audit/migration.sql` |

## Updated files

- `prisma/schema.prisma` — `workbenchMetaJson`, `CharacterSimulationAuditLog`, `Person` relation
- `lib/domain/author-command-cockpit.ts` — optional rollup on `operatorExecutionSummary`
- `lib/domain/final-execution-package.ts` — optional `characterSimulationWorkbenchSummary`
- `lib/services/final-execution-package-service.ts`, `final-readiness-scorecard-service.ts`, `scripts/cluster9-final-dry-run.ts`
- `app/admin/narrative/page.tsx`, `components/admin/author-command-cockpit.tsx`, `app/admin/people/page.tsx`, `app/admin/people/[id]/page.tsx`
- `package.json` — `verify:character-simulation-workbench`

## Schema / migration

- Adds `CharacterSimulationAuthorBundle.workbenchMetaJson`.
- Adds `CharacterSimulationAuditLog` with foreign key to `Person`.

Apply with `npx prisma migrate deploy` (or project standard) before expecting saves/audit to succeed against Postgres.

## Verification

```bash
npm run verify:character-simulation-workbench
```

Runs the verification script plus `node:test` suite for the workbench.

## Fully working

- Guided mind/voice editing with validated saves onto the canonical bundle path.
- Deterministic preview lab and conflict heuristics.
- Cockpit cast rollup + quick link.
- Optional final execution summary wiring from `cluster9-final-dry-run.ts`.

## Advisory / deferred

- RBAC beyond trusted admin (`TODO` in server actions).
- Deeper guided editors for nested fear/wound maps (JSON comparison available today).
- Per-leaf provenance (currently **field-group** level).
- Stretch: diff tooltips, bulk readiness grid, voice clone — not implemented.

## Risks / follow-ups

- Cast rollup performs **parallel full loads** per person; very large casts may need caching or a slimmer aggregate query.
- Prisma errors during verification when migration is missing are expected; operators should migrate before production use.
