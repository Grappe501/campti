# Author Cockpit Audit (Phase 10+11 Workstream 1)

## Audit Scope

This audit covers existing author/admin/cockpit/workbench surfaces under `app/admin/*`, related author-facing routes, and service/action capabilities that imply author tooling ownership.

Reviewed primary UI authorities:

- `app/admin/layout.tsx`
- `components/admin-nav.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/narrative/page.tsx`
- `app/admin/scenes/[id]/workspace/page.tsx`
- `app/admin/scenes/[id]/observer/page.tsx`
- `app/admin/world-observer/page.tsx`
- `app/admin/narrative/books/[bookId]/page.tsx`
- `app/admin/narrative/chapters/[chapterId]/assembly/page.tsx`

Reviewed relevant capability backends:

- `app/actions/author-workflow.ts`
- `app/actions/author-inspection.ts`
- `lib/services/author-workflow-orchestration-service.ts`
- `lib/services/authorial-inspection-service.ts`
- `lib/services/ui-ownership-service.ts`
- `lib/services/operator-live-surface-service.ts`

## Current Authority Map

- **Current primary author workbench:** `app/admin/scenes/[id]/workspace/page.tsx`
  - Reason: only existing surface with centered narrative editing, contextual side tools, continuity/readiness rails, and direct author command actions.
- **Secondary workbench-like surfaces (overlap):**
  - `app/admin/dashboard/page.tsx` (broad command entry, but dashboard-style and fragmented)
  - `app/admin/narrative/page.tsx` (narrative hub but not command-centric)
  - `app/admin/narrative/books/[bookId]/page.tsx` (book planning slice)
  - `app/admin/narrative/chapters/[chapterId]/assembly/page.tsx` (chapter assembly preview slice)
- **Debug/internal surfaces:**
  - `app/admin/scenes/[id]/observer/page.tsx` (raw observer snapshot)
  - `app/admin/world-observer/page.tsx` (internal world snapshot by query params)
  - `components/admin-page-agent-panel.tsx` (specialist assistant overlay, internal support)
- **Operator/internal (not author cockpit):**
  - operator/service domain from `lib/services/operator-live-surface-service.ts` and operations depth services (operator-focused observability)

## Explicit Findings

1. **Duplicate or competing workbench surfaces:** Detected
   - Scene workspace is workbench-like while narrative hub/book planner/chapter assembly expose separate workbench-like fragments.
2. **Unclear ownership:** Detected
   - `components/admin-nav.tsx` presents many peers with equal weight; no explicit author cockpit authority declaration.
3. **Hidden capabilities not surfaced in unified UI:** Detected
   - `app/actions/author-workflow.ts` exposes orchestration capabilities (`scene`, `chapter`, `book`) but they are not unified in one cockpit shell.
4. **Surfaces to retire or merge from primary author workflow:** Detected
   - `admin/narrative/books/[bookId]` and `admin/narrative/chapters/[chapterId]/assembly` should be absorbed into a single cockpit context model.
5. **Reader-inappropriate but author-appropriate surfaces:** Detected
   - Scene observer payloads and author inspection internals are author-safe/internal-safe but must remain separate from reader routes.
6. **Admin/internal surfaces that should not become cockpit core:** Detected
   - World observer and operator dashboards are internal/debug/operator surfaces and should remain outside the author cockpit core.

## Risk Summary

- **Fragmentation risk:** High (multiple narrative management entry points).
- **Ownership ambiguity risk:** Medium (no declared authoritative cockpit route).
- **Governance risk:** Medium (capabilities exist in services without single command authority surface).
- **Reader leakage risk:** Low-to-medium if observer/debug payloads are accidentally promoted into reader-facing flows.

## Required Missing/Present Verification Commands

- Present relevant author/protection commands:
  - `verify:author-workflow`
  - `verify:authorial-inspection`
  - `verify:ui-ownership`
- Missing specific cockpit consolidation commands at audit time:
  - `verify:author-cockpit-consolidation` (to be added in Workstream 2)
  - `verify:cockpit-shell-architecture` (to be added in Workstream 3)
  - `verify:cockpit-scope-model` (to be added in Workstream 4)
  - `verify:tool-rail-system` (to be added in Workstream 5)
  - `verify:indicator-bank-model` (to be added in Workstream 6)
  - `verify:guided-signals` (to be added in Workstream 7)
  - `verify:author-command-cockpit` (to be added in Workstream 8)
