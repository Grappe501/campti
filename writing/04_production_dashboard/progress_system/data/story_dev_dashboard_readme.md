# Story dev dashboard JSON

Canon status: PROPOSED

## File

- **`story_dev_dashboard.json`** — lightweight snapshot for the **`/story-dev`** Netlify lane (see `app/story-dev/page.tsx`).

## How to update

1. Edit **`story_dev_dashboard.json`** after meaningful moves (samples, gates, sweep status, symbol research, chapter candidates, **epic_symbol_map**, **epic_war_conflict_engine**, **epic_arc_braid**, **language_doctrine** status).
2. Keep **`updated`** as an ISO date (`YYYY-MM-DD`).
3. **`top_blockers`** and **`next_actions`** should stay short strings (human-scannable).
4. Optional lists: **`top_active_symbols`**, **`top_active_arcs`**, **`symbolic_blockers`** — keep tight; rotate as work shifts.
5. Do **not** paste unverified history into `summary` fields — keep **PROPOSED** language.

Optional keys may include **`epic_war_conflict_engine`**, **`literary_control`** (path map), and **`symbol_series_seeds`** — see live JSON for the current shape.

## Source of truth hierarchy

1. Markdown charts under `writing/04_production_dashboard/progress_system/*_chart.md` remain authoritative for bar math.
2. JSON is a **rollup mirror** for the web lane — it can lag by hours; that is acceptable for MVP.

## Build / deploy

- The Next route reads this file from disk at request time (`dynamic = "force-dynamic"` on `app/story-dev`).
- No manual copy into `public/` is required for MVP.
