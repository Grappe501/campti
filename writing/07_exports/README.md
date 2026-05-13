# Exports (`07_exports`)

**Purpose:** **Assembled** artifacts for reading, sharing, or tooling — not authoritative canon by themselves. Prefer linking back to `03_epics/` chapter sources.

## Assembly rules

1. **Do not** silently edit canon from export files; edits flow `chapter → book → 01_canon/` as usual.
2. Regenerate or paste exports after meaningful chapter updates.
3. Label export snapshots with date + git SHA (optional) in each file’s header.

## Files

| File | Intended contents |
|------|-------------------|
| `book_01_manuscript.md` | Concatenated `draft.md` (or final) in chapter order |
| `book_01_outline_export.md` | Concatenated `outline.md` / beats |
| `book_01_chapter_packet_export.md` | Table of links or embedded briefs + exit conditions per chapter |

## Source of truth

- Chapters: `writing/03_epics/…/chapters/ch_###_<slug>/`
- Dashboard: `writing/04_production_dashboard/`
- Maps: `writing/05_maps/`
