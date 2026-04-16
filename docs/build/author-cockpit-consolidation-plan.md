# Author Cockpit Consolidation Plan (Workstream 2)

## Authority Decision

- **Single authoritative author command cockpit route:** `/admin/narrative`
- This route is promoted as the sole cockpit authority for scene/chapter/book/epic command context.

## Surface Disposition

- **Absorb into cockpit authority**
  - `/admin/scenes/[id]/workspace` -> scene scope inside `/admin/narrative`
  - `/admin/narrative/books/[bookId]` -> book scope inside `/admin/narrative`
  - `/admin/narrative/chapters/[chapterId]/assembly` -> chapter scope inside `/admin/narrative`
- **Keep as admin utilities (not cockpit authority)**
  - `/admin/dashboard`
  - `/admin/scenes`, `/admin/chapters`, and record CRUD index/detail pages
- **Keep as internal/debug (explicitly non-cockpit)**
  - `/admin/scenes/[id]/observer`
  - `/admin/world-observer`

## Applied In-Place Consolidation Changes

1. Declared cockpit ownership model in `lib/services/author-cockpit-consolidation-service.ts`.
2. Added legacy-route redirect resolution for absorbed workbench pages.
3. Rewired:
   - `app/admin/narrative/books/[bookId]/page.tsx` -> redirect to cockpit book scope
   - `app/admin/narrative/chapters/[chapterId]/assembly/page.tsx` -> redirect to cockpit chapter scope
4. Updated links pointing to legacy scene workspace:
   - `app/admin/scenes/[id]/page.tsx`
   - `app/admin/brain/page.tsx`
5. Elevated cockpit visibility in navigation:
   - `components/admin-nav.tsx` adds `Author Cockpit` link.

## Guardrails

- No second top-level cockpit route introduced.
- Debug/internal observer surfaces are explicitly outside cockpit authority.
- Reader cockpit remains separate and unchanged.

## Verification

- Added `verify:author-cockpit-consolidation` command to ensure:
  - exactly one authoritative cockpit route,
  - absorbed legacy routes are declared,
  - ownership invariants hold.
