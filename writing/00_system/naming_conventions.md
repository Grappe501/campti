# Naming conventions

## Folder prefixes

| Level | Pattern | Example |
|-------|---------|---------|
| Epic | `epic_##_<slug>/` | `epic_01_placeholder/` |
| Book | `book_##_<slug>/` | `book_01_placeholder/` |
| Chapter | `ch_###_<slug>/` | `ch_001_placeholder/` |

- `##` / `###` are zero-padded sequence numbers.
- `<slug>` is lowercase with underscores; no spaces; ASCII preferred for cross-tool compatibility.
- Rename slugs when working titles stabilize; keep numeric prefixes stable to preserve sort order.

## Status labels in prose (use consistently)

Use these exact prefixes in Markdown when material is not yet canon:

| Label | Meaning |
|-------|---------|
| `CONFIRMED:` | Matches `01_canon/` or explicitly agreed decisions. |
| `PROPOSED:` | Speculative; not yet promoted to canon. |
| `DEPRECATED:` | Was used; superseded — keep for audit trail. |
| `OPEN:` | Question or fork not decided. |

See consolidated rules + promotion discipline in **`canon_status_labels.md`**.

- Use `snake_case.md` for machine-friendly consistency.
- Chapter-facing narrative files: `chapter_brief.md`, `outline.md`, `scenario_board.md`, `draft.md`.
- Indexes: `*_index.md`, `*_manifest.md`, `*_map.md` per existing patterns.

## Cross-references

When pointing to another artifact, use a repo-relative path from `writing/`, for example:

`../../01_canon/master_story_bible.md`

or from chapter to book:

`../../../book_chapter_manifest.md`

## AI and tooling

- Prompts live in `ai_prompts/`; version them by editing the file (Git history is the changelog).
- Generated output should be pasted into the appropriate chapter file with a short header noting date and tool if useful for audit.
