# Character Simulation Workbench — operator guide

## Where to open it

1. **People → Workbench:** `/admin/people` table includes a **Simulation → Workbench** link per person.
2. **Person detail:** link at the top: **Character Simulation Workbench**.
3. **Author Cockpit:** `/admin/narrative` in scene scope shows a **Character Simulation Workbench** quick link (first cast member) plus a **cast rollup** listing readiness impact per participant.

## Editing workflow

1. Open the workbench for the correct `Person` id.
2. Use **Mind profile** and **Voice profile** tabs for guided partials (strings, enums, list fields).
3. Review **Author · seed · merged** for coarse provenance and whether a group differs from seed.
4. Run **Preview lab** for deterministic posture text (not scene prose).
5. Resolve **advisory** conflicts via **Acknowledge advisory** (persists accepted conflict ids in `workbenchMetaJson`). **Blocking** conflicts cannot be acknowledged away — fix data (for example person years or hollow belief patches).
6. **Save author bundle** persists merged partials onto `CharacterSimulationAuthorBundle` and appends an audit row when the audit table exists.

## When migration is missing

If `workbenchMetaJson` or `CharacterSimulationAuditLog` is not migrated, the UI shows a **migration required** banner. Load still returns **seed-only inspection** so the page stays honest. Run `npx prisma migrate deploy` in the target environment.

## Readiness badges

- **ready** — no blocking issues at this layer; advisory items may still exist.
- **advisory_warning** — open advisory drift or migration note.
- **downgrade_risk** — open warning-severity heuristics.
- **blocked** — blocking contradictions or failed validation.

## Security note

Server actions follow the existing **trusted admin** model. A `TODO(auth)` marker remains in `app/actions/character-simulation-workbench.ts` until RBAC is wired for production tenants.
