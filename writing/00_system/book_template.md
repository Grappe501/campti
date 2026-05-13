# Book template (reference)

## Book folder layout

Under `03_epics/<epic>/books/book_##_<slug>/`:

| File | Purpose |
|------|---------|
| `book_overview.md` | Premise, audience, tone, scope, relation to epic. |
| `book_spine.md` | Macro acts / movements; major twists; subplot ledger. |
| `book_timeline.md` | In-world chronology for this book’s events. |
| `book_character_arcs.md` | Per major character: start → end pressure for this book. |
| `book_symbol_map.md` | Motifs and symbols introduced, developed, paid off. |
| `book_chapter_manifest.md` | Chapter list, order, slug, pipeline status (sync with `writing/04_production_dashboard/chapter_status.md`), one-line purpose. |

## Folder

- `chapters/` — one folder per chapter using `ch_###_<slug>/` pattern.

## Discipline

- Book files summarize; **do not** duplicate full chapter drafts here.
- When a chapter updates facts, either update book-level files in the same commit/session or leave an explicit TODO in `book_chapter_manifest.md` for that chapter row.
