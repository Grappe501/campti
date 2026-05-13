# Where to view reviews — Book 01 (PROPOSED)

Canon status: PROPOSED

Use this file when you want a **single map** from “I need to review something” → **URL or path**.

---

## A. Story dev dashboard (rollup)

**What you see:** Current focus, Book 01 / epic scores, **symbol + arc tables**, **plot tracks**, **prose review queue** (every sample + gate path), **15-unit spine** one-liners, **Post-Fill Gate**, blockers, next actions, deep repo links.

| Environment | Open |
|---------------|------|
| **Local** | After `npm run dev` → [http://localhost:3000/story-dev](http://localhost:3000/story-dev) |
| **Netlify** | Same path on your deploy: `https://<your-site>.netlify.app/story-dev` |

**Data source (edit to change the page):**  
`writing/04_production_dashboard/progress_system/data/story_dev_dashboard.json`

---

## B. Readiness gate tables (human fills `TBD`)

All under **this folder** (`chapter_folder_readiness_gate/`):

| Review | File |
|--------|------|
| Overall readiness | `readiness_summary.md` |
| Per-unit spine (APPROVE / REVISE / HOLD) | `fifteen_unit_spine_review.md` |
| Sample 002 RevA | `revA_sample002_review.md` |
| Post-Fill Gate sign-off | `post_fill_gate_status.md` |
| Folder names when approved | `recommended_chapter_folder_names.md` |
| Still OPEN before mint | `remaining_open_decisions.md` |

Repo root relative base:

`writing/03_epics/epic_02_red_river_matrilineage/books/book_01_world_before_disruption/chapter_folder_readiness_gate/`

---

## C. Draft lab — prose samples + gates

Base:  
`writing/03_epics/epic_02_red_river_matrilineage/books/book_01_world_before_disruption/draft_lab/`

| Piece | Prose | Gate / notes |
|-------|--------|----------------|
| Tonal model decision | `prose_sample_001_tonal_model_decision.md` | Human call on RevB |
| Sample 001 RevB | `prose_sample_001_opening_matriarch_first_image_revB.md` | `prose_sample_001_revB_review_gate.md` |
| Sample 002 V0 | `prose_sample_002_granddaughter_first_image.md` | `prose_sample_002_review_gate.md` |
| Sample 002 RevA | `prose_sample_002_granddaughter_first_image_revA.md` | `prose_sample_002_revA_review_gate.md`, `prose_sample_002_revA_notes.md` |
| V0 freeze | `archive/prose_sample_002_original.md` | Snapshot only |

---

## D. Refinement pass (spine + Post-Fill Gate source)

`writing/03_epics/epic_02_red_river_matrilineage/books/book_01_world_before_disruption/book01_chapter_candidates_v0/refinement_pass_01/`

| Doc | Role |
|-----|------|
| `proposed_12_to_16_chapter_spine.md` | Full 15-unit table + dependency overlay |
| `recommendation_summary.md` | Strongest/weakest units + **Post-Fill Gate** |
| `candidate_review_gate.md` | Chapter-candidate gate (if used before folders) |

---

## E. Firewall + landscape (read before approving folders)

| Doc | Path |
|-----|------|
| Native-only firewall | `…/book01_native_only_firewall.md` |
| Great Raft landscape seed | `writing/03_epics/epic_02_red_river_matrilineage/research/red_river_great_raft/book01_landscape_seed.md` |
