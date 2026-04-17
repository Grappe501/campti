# Enforcement constraint shape fix (Book 1 character console)

## 1. Root cause

The character console simulation packet mixed two sources into `currentChapterLawConstraints`: chronology invariant rows (which already included `enforcement` from `chapter_law` JSON) and future-arc rows (which only have `mustPreserve` / `forbiddenResolution` in source state). When the normalized row type required `enforcement` on every element, any branch that mapped future-arc rows to `{ id, constraint }` alone failed TypeScript. Using `.concat()` also made inference easier to get wrong when the two branches differed. Separately, `currentSceneLawConstraints` only required `id` and `constraint`, so scene-level rows could ship without any enforcement classification even though chapter-level rows carried metadata.

## 2. Files audited

- `lib/services/book1-character-console-service.ts` (primary)
- Repository search for `currentChapterLawConstraints`, `currentSceneLawConstraints`, and normalized `{ id, constraint }` law rows in `lib/services` and `lib/domain`
- Related Book 1 services (`book1-law-console-service`, `book1-author-cockpit-simulation-service`, regeneration loop) — they consume raw `chapter_law` shapes, not this console packet normalization

## 3. Files created

- `lib/domain/book1-console-law-constraint.ts` — shared Zod schema, type, and normalization helpers
- `lib/domain/book1-console-law-constraint.test.ts` — regression tests for schema and merge behavior
- `docs/build/enforcement-constraint-shape-fix-report.md` — this report

## 4. Files updated

- `lib/services/book1-character-console-service.ts` — uses shared schema for both chapter and scene constraint arrays; builds chapter rows via helpers and spread (not `concat`); scene rows get `scene_law_constraint`
- `lib/services/book1-character-console-service.test.ts` — asserts every row has non-empty `enforcement` and checks `FA-1` uses `future_arc_constraint`

## 5. Current build error fix summary

- Future-arc normalization sets `enforcement: "future_arc_constraint"` with text from `mustPreserve` / `forbiddenResolution` in `constraint`.
- Chronology rows keep source `enforcement` strings (e.g. validator-facing text from artifacts).
- Chapter constraint list is typed as `Book1ConsoleLawConstraintRow[]` and built with `[...invariants, ...futureArc]` to keep a single inferred shape.

## 6. Similar issue audit summary

- No other call sites referenced `currentChapterLawConstraints` / `currentSceneLawConstraints` outside this service and its tests.
- No additional ad hoc `{ id, constraint }` packet builders were found for this cockpit shape.

## 7. Constraint standardization summary

- **Type + schema:** `Book1ConsoleLawConstraintRow` / `Book1ConsoleLawConstraintRowSchema` (`id`, `constraint`, `enforcement` all required).
- **Helpers:** `chronologyInvariantToConsoleConstraintRow`, `futureArcConstraintToConsoleConstraintRow`, `sceneLawConstraintToConsoleRow`.
- **Semantic labels:** `future_arc_constraint` (future arc), `scene_law_constraint` (scene outline/draft SL-* rows), otherwise passthrough from chronology invariant `enforcement` in source data.

## 8. Test / regression summary

- Domain tests: Zod rejects missing `enforcement`; helpers produce expected labels; merged arrays validate per row.
- Service test: packet chapter and scene constraint lists include enforcement consistently; future-arc id `FA-1` matches `future_arc_constraint`.

## 9. Verification results

- `npm run typecheck` — pass
- `npx tsx --test lib/domain/book1-console-law-constraint.test.ts lib/services/book1-character-console-service.test.ts` — pass
- `npm run build` — pass (Next.js production build + TypeScript step)

## 10. Remaining risks / deferred follow-ups

- **Naming:** `future_arc_constraint` / `scene_law_constraint` are console-surface classifications; they are not the same enum as `EnforcementClass` in `enforcement-contract.ts`. If you later want strict cross-linking, add an explicit mapping table rather than overloading subsystem enforcement enums.
- **Other surfaces:** Raw `chapter_law` artifacts and other services still use their own schemas; only the character console packet was unified. If another UI copies this pattern, import the same domain module.
