# Chapter template (reference)

Copy the folder `03_epics/<epic>/books/<book>/chapters/ch_###_<slug>/` from `writing/00_system/folder_blueprints/chapter_blueprint/` (or duplicate `ch_001_placeholder` under `epic_01_placeholder`). Register the chapter in `book_chapter_manifest.md` and `writing/04_production_dashboard/chapter_status.md`.

## Required root files

- `README.md` — navigation, status, links to book/epic.
- `chapter_brief.md`
- `outline.md`
- `scenario_board.md`
- `draft.md`
- `revision_notes.md`

## Optional traceability files (recommended)

Copy from `writing/00_system/traceability_templates/`:

- `chapter_contract.md` — answers: purpose, sources, change, threads, canon deps, unresolved, review (`chapter_contract_template.md`).
- `chapter_exit_condition.md` — acceptable end state + carry + review flags (`chapter_exit_condition_template.md`).

## Required subfolders

Each subfolder has a `README.md` explaining its role for **this chapter only**.

| Folder | Role |
|--------|------|
| `characters/` | Who matters here; primary vs secondary vs mentions. |
| `settings/` | Where we are; sensory and environmental rules in play. |
| `history/` | Backstory and prior events that inform this chapter. |
| `data/` | Facts, timeline anchors, continuity requirements. |
| `arcs/` | Character, plot, emotional, mystery/reveal pressure. |
| `symbols/` | Recurring symbols, objects, motifs touched this chapter. |
| `themes/` | Thematic intent and moral/philosophical pressure. |
| `scenes/` | `scene_list.md` plus one file per scene as needed. |
| `source_matches/` | Bridge from `02_source_chunks/` to this chapter. |
| `continuity/` | Threads and contradictions for this chapter. |
| `dialogue/` | Voice notes and spare lines worth keeping. |
| `production/` | Quality pass, missing assets, next steps. |

## Upward links

In the chapter `README.md`, always link to:

- Book: `book_overview.md`, `book_chapter_manifest.md`, `book_spine.md`
- Epic: `epic_overview.md`, `epic_timeline.md` (when relevant)
- Maps: `writing/05_maps/` (braids + dependencies affecting this chapter)
- Traceability templates: `writing/00_system/traceability_templates/`
