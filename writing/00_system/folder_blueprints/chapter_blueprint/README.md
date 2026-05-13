TEMPLATE ONLY — duplicate and rename before using for real story content.

# Chapter blueprint (`ch_###_<slug>`)

This tree is a **structural duplicate** of `writing/03_epics/epic_01_placeholder/books/book_01_placeholder/chapters/ch_001_placeholder/`.

## How to use

1. Copy this entire `chapter_blueprint/` directory to your book’s `chapters/` folder.
2. Rename the folder to `ch_###_<slug>` (zero-padded chapter number + slug).
3. Fix **upward links** in this file: they assume the chapter lives at  
   `writing/03_epics/<epic>/books/<book>/chapters/<this folder>/`.
4. Register the chapter in:
   - `book_chapter_manifest.md` (book folder)
   - `writing/04_production_dashboard/chapter_status.md`
5. Set pipeline status to `Not started` until work begins.

## Upward links (correct when placed under a real book)

- Book overview: `../../book_overview.md`
- Book spine: `../../book_spine.md`
- Book chapter manifest: `../../book_chapter_manifest.md`
- Epic overview: `../../../../epic_overview.md`
- Canon: `../../../../../01_canon/`

## Pipeline status

| Step | File | Status |
|------|------|--------|
| 1 Brief | `chapter_brief.md` | |
| 2 Outline | `outline.md` | |
| 3 Scenario board | `scenario_board.md` | |
| 4 Source matching | `source_matches/candidate_chunks.md` | |
| 5 Scene list | `scenes/scene_list.md` | |
| 6 Draft | `draft.md` | |
| 7 Continuity | `continuity/` | |
| 8 Production | `production/quality_pass.md` | |

## Folder map

This chapter is **self-contained**: all working notes for this unit live here. Promote `CONFIRMED` facts to `01_canon/` when stable. Inferred material stays `PROPOSED` until promoted.
