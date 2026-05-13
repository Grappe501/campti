# Writing system (`00_system`)

This folder defines **how** the manuscript is produced: workflow, naming, targets, reusable templates, and AI-assisted prompts.

## Purpose

- Keep epic → book → chapter structure consistent.
- Encode the pipeline so chapters can reach **~75% draft quality** before polish.
- Separate **confirmed canon** from **proposed** material everywhere downstream.

## Quick links

| Document | Use |
|----------|-----|
| `workflow.md` | End-to-end chapter and book production sequence |
| `naming_conventions.md` | Folder and file naming rules |
| `production_targets.md` | What “done enough” means at each stage |
| `*_template.md` | Copy-paste scaffolds for new epics, books, chapters |
| `ai_prompts/` | Prompts for scaffold, scenes, continuity, source matching |
| `folder_blueprints/` | Copy-first epic / book / chapter folder layouts |
| `chapter_manifest_template.md` | Wide table for chapter tracking (sync with dashboard) |
| `canon_status_labels.md` | `CONFIRMED` / `PROPOSED` / `OPEN` / `DEPRECATED` rules |
| `traceability_templates/` | Chapter contract, braid tables, scene cards, canon/contradiction records |

## Relationship to other roots

- **`01_canon/`** — authoritative indexes and unresolved questions (story bible level).
- **`02_source_chunks/`** — raw and semi-sorted source material (not flattened into one narrative); **`intake/`** is the inbox before sorting.
- **`03_epics/`** — working production tree: epics, books, chapters, each chapter self-contained.
- **`04_production_dashboard/`** — epic / book / chapter / source / questions pipeline status.
- **`05_maps/`** — cross-chapter braids: timelines, arcs, symbols, dependencies, narrator knowledge.
- **`06_audits/`** — repeatable audit checklists (continuity, POV, canon labels, pacing, etc.).
- **`07_exports/`** — assembled manuscript / outline / chapter packets (generated or pasted).

When in doubt: **structure first**, prose later. Unknowns go to canon `unresolved_questions.md` or a chapter’s `production/missing_assets.md`.
