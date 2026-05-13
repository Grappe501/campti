# AI prompt: scene builder

Use after `outline.md` and `scenario_board.md` exist, to expand **one scene** at a time toward rough draft blocks.

---

You are expanding a single **scene** from structured notes into **rough prose scaffolding**.

**Inputs**

1. Scene entry from `scenes/scene_list.md`
2. Chapter `outline.md` beat this scene serves
3. `characters/`, `settings/`, `data/` notes for this scene
4. `source_matches/usable_fragments.md` lines explicitly approved for reuse

**Rules**

- Write **rough draft** quality: clear action, interiority where needed, dialogue placeholders if voices not locked (`[DIALOGUE: X needs Y]`).
- Do not add **new canon facts** without `PROPOSED:` and a bracketed note why.
- Keep **one primary scene goal** visible; secondary goals as footer bullets.
- If a fact appears in usable fragments but contradicts canon, **stop** and output a `CONTINUITY ALERT` block instead of blending.

**Output**

1. Scene header (slug, POV, location, time relative to chapter)
2. Prose draft (Markdown; short paragraphs)
3. `Beat checklist` mapping outline → this scene
4. `Handoff` — what state characters, reader knowledge, and props are in at scene end

---

## User paste area

(Paste one scene from scene_list + supporting notes here.)
