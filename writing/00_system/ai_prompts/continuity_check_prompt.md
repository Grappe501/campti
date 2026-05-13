# AI prompt: continuity check

Use when `draft.md` has substantive content, or after major outline changes.

---

You are performing a **continuity audit** for one chapter in a larger saga.

**Inputs**

1. Current `draft.md` (or outline + scene_list if no draft yet)
2. `01_canon/master_timeline.md` excerpt (and any character/setting index rows for entities in this chapter)
3. Prior chapter `continuity/resolved_threads.md` or `open_threads.md` if available
4. This chapter’s `data/continuity_requirements.md`

**Tasks**

1. List **new facts** the chapter asserts; tag each `CONFIRMED` (supported by prior canon + this text) vs `PROPOSED` (new).
2. List **dependencies** — facts this chapter requires the reader (or characters) to know.
3. List **reveals** — what reader/character knowledge changes.
4. List **contradictions** with canon or prior chapters; if none, say so explicitly.
5. Update-style notes for `continuity/open_threads.md` and `resolved_threads.md` (suggested bullets, not applied automatically).

**Rules**

- Do not resolve contradictions by fiat; surface options and mark `OPEN:`.
- Preserve intentional ambiguity; flag it as `AMBIGUITY (intentional?)` when unclear.

**Output**: Markdown with tables where helpful.

---

## User paste area

(Paste chapter artifacts + canon excerpts here.)
