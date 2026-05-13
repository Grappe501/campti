# Production workflow

## Principles

1. **Do not flatten complexity** — the system holds parallel threads, symbols, and lore; the narrative earns them through structure.
2. **Do not invent canon** unless explicitly labeled **PROPOSED** (see naming conventions).
3. **Every chapter folder is self-contained** — someone can open one chapter and see brief, outline, scenes, draft, continuity, and production status.
4. **Every chapter links upward** — book manifest, book spine, epic overview stay in sync when chapter plans change.

## Dashboard status (rolling)

Track coarse chapter position in **`writing/04_production_dashboard/chapter_status.md`** (and book/epic tables there). Use these **exact** strings:

`Not started` · `Brief started` · `Outline started` · `Scenario board started` · `Source matching started` · `Scene list started` · `Draft started` · `Continuity pass` · `Production pass` · `Ready for Ernie/User review`

Mirror the same value in the book’s `book_chapter_manifest.md` for the chapter row.

## Chapter pipeline (target: ~75% draft before polish)

Chapters move through this sequence in order. Earlier steps can be revised when later steps surface new facts.

| Step | Artifact | Goal |
|------|----------|------|
| 1 | `chapter_brief.md` | State what the chapter **must** accomplish for plot, character, theme, and reader experience. |
| 2 | `outline.md` | Structural beats: setup, escalation, turn, resolution (or intentional non-resolution). |
| 3 | `scenario_board.md` | Explore **options**: scenes, tensions, reveals, reversals, emotional beats — not yet committed order. |
| 4 | Source matching | `source_matches/candidate_chunks.md` (+ usable/rejected) — map `02_source_chunks/` and canon to this chapter. |
| 5 | `scenes/scene_list.md` | **Ordered** scene plan derived from outline + scenario board + available source. |
| 6 | `draft.md` | Rough prose from approved scaffold; may be fragmentary; prioritize clarity of intent over polish. |
| 7 | `continuity/` | What this chapter changes, reveals, contradicts, or depends on — book and epic wide. |
| 8 | `production/quality_pass.md` | Gap analysis: what is missing before the chapter can move toward final. |

Each chapter should be able to answer: **what it is doing**, **what sources support it**, **what changes by the end**, **what threads it carries**, **what canon it depends on**, **what stays unresolved**, and **what needs human review** — use `writing/00_system/traceability_templates/chapter_contract_template.md` and `chapter_exit_condition_template.md` (optional files in the chapter folder).

## Book-level loop

1. Maintain `book_spine.md` (macro structure) and `book_chapter_manifest.md` (chapter list + status).
2. After material chapter work, update `book_timeline.md`, `book_character_arcs.md`, and `book_symbol_map.md` when facts or motifs shift.
3. Roll up epic-level `epic_timeline.md` and `epic_arc.md` when milestones land.

## Canon maintenance

- **Confirmed** facts live in `01_canon/` master files.
- **Proposed** additions start in chapter or epic notes with `PROPOSED:` headers until promoted.
- Label rules: `writing/00_system/canon_status_labels.md`.
- Conflicts surface in chapter `continuity/contradictions.md` and resolve via explicit decisions recorded in canon or `unresolved_questions.md`.

## Experience build

Narrative tooling in this repo is **writing-first** until you unpause the experience build. Keep game/experience notes in `02_source_chunks/data/` or chapter `data/` as needed, but do not block manuscript work on it.
