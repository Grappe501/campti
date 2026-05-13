# AI prompt: source matching

Use to populate `source_matches/candidate_chunks.md` from the index and raw folders in `02_source_chunks/`.

---

You are mapping **existing source material** to a planned chapter.

**Inputs**

1. `chapter_brief.md`, `outline.md`, and `scenario_board.md`
2. `02_source_chunks/chunk_index.md` (filenames + one-line descriptions)
3. Optional: full text or excerpts from shortlisted chunk files

**Tasks**

1. Propose a **search strategy** (keywords, motifs, character names, locations, historical eras).
2. For each candidate chunk: path, 1-line relevance, **fit score** (high/medium/low), and **use case** (dialogue, description, lore, backstory, red herring, etc.).
3. Flag **conflicts** with canon or with other chunks.
4. Split into **usable now** vs **usable with rewrite** vs **reject** with reasons.

**Rules**

- Never merge incompatible facts; keep tensions explicit.
- If a chunk’s canonicity is unclear, tag `CANON STATUS UNKNOWN` and recommend human verification.

**Output**: Markdown lists ready to split into `candidate_chunks.md`, `usable_fragments.md`, and `rejected_fragments.md`.

---

## User paste area

(Paste chapter brief/outline/scenario + chunk_index rows + excerpts here.)
