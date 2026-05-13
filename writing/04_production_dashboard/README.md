# Production dashboard

**Purpose:** Single place to see where every epic, book, chapter, source intake, and open question sits in the pipeline — **without opening each folder**.

## Pipeline stages (chapters)

Use these exact strings in tables so rows stay sortable and greppable:

1. `Not started`
2. `Brief started`
3. `Outline started`
4. `Scenario board started`
5. `Source matching started`
6. `Scene list started`
7. `Draft started`
8. `Continuity pass`
9. `Production pass`
10. `Ready for Ernie/User review`

## How to keep this honest

- Update dashboard rows when a chapter file moves meaningfully (e.g. first real bullets in `outline.md` → `Outline started`).
- When book/epic **progress scores** move, update `progress_system/*_chart.md` (and `progress_system/data/*.csv` if you use CSV import); follow `progress_system/update_rules.md`.
- Mirror chapter rows in the book’s `book_chapter_manifest.md` (see `writing/00_system/chapter_manifest_template.md`).
- **Canon:** use `CONFIRMED` / `PROPOSED` / `OPEN` / `DEPRECATED` per `writing/00_system/canon_status_labels.md`. Nothing promotes silently.

## Files

| File | Tracks |
|------|--------|
| `epic_status.md` | Epics |
| `book_status.md` | Books |
| `chapter_status.md` | Chapters (flattened across books) |
| `progress_system/` | KPIs, bars, roll-ups, `story_dev_dashboard.json` |
| Story dev lane | `/story-dev` (Next route; see `story_dev_dashboard/`) |
| `source_sorting_status.md` | `02_source_chunks/` + `intake/` |
| `open_questions_status.md` | Canon + epic questions roll-up |
| `next_actions.md` | Immediate human decisions / tasks |
| `numbering_decision.md` | OPEN: `epic_02` vs future `epic_01` rename for production |

## Related

- Workflow: `writing/00_system/workflow.md`
- Blueprints: `writing/00_system/folder_blueprints/`
- Traceability templates (contracts, braids, scene cards): `writing/00_system/traceability_templates/`
- Braid / dependency maps (cross-chapter): `writing/05_maps/`
- Formal audits: `writing/06_audits/`
- Assembled exports (outline / manuscript packets): `writing/07_exports/`
- Placeholder example tree: `writing/03_epics/epic_01_placeholder/`
