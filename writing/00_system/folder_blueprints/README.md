# Folder blueprints

**Purpose:** Pristine, **copy-first** layouts for a new epic, book, or chapter without editing the reference placeholder tree under `writing/03_epics/epic_01_placeholder/`.

## Rules

- **`03_epics/epic_01_placeholder/…`** remains the in-repo **worked example** (still `TEMPLATE ONLY` on its READMEs — duplicate before real use).
- **`folder_blueprints/`** holds **structural duplicates** you can copy into `03_epics/` and rename.
- Do not treat blueprint copies as canon. Promote facts only via `01_canon/` with explicit `CONFIRMED` labeling elsewhere.

## Contents

| Path | Use |
|------|-----|
| `epic_blueprint/` | Four epic root files + `README.md` |
| `book_blueprint/` | Six book root files + `chapters/` (empty except `README.md`) |
| `chapter_blueprint/` | Full chapter subtree (mirrors `ch_001_placeholder`) |

## Instantiate a new chapter

1. Copy `chapter_blueprint/` → `writing/03_epics/<epic>/books/<book>/chapters/ch_###_<slug>/`.
2. Find/replace `placeholder` / `001` / path depth in `README.md` upward links if your nesting differs.
3. Register the chapter in the book’s `book_chapter_manifest.md` and `writing/04_production_dashboard/chapter_status.md`.

## Instantiate a new book or epic

1. Copy `book_blueprint/` or `epic_blueprint/` into `03_epics/` (create `books/` under epic as needed).
2. Rename folders to `epic_##_<slug>` / `book_##_<slug>`.
3. Update `04_production_dashboard/` status files.
