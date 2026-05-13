# Story development dashboard (repo spec)

Canon status: PROPOSED

## Purpose

Lightweight **author / producer lane** specs for the Netlify-deployed **`/story-dev`** route in the Next app. This folder is **not** the runtime dashboard; the page reads `writing/04_production_dashboard/progress_system/data/story_dev_dashboard.json`.

## Runtime (V1)

- **`app/story-dev/layout.tsx`** forces a **dark zinc** surface so the route is readable on top of the global light `--campti-paper` body (fixes light-on-light Tailwind `stone-*` text).
- **`app/story-dev/page.tsx`** renders **symbols**, **arcs**, **plot tracks**, **prose review queue**, **15-unit spine snapshot**, and **Post-Fill Gate** from JSON — see `story_dev_dashboard_readme.md` for optional keys (`build_lens`, `symbols_detailed`, etc.).

## Principles

- **Do not** block novel work on dashboard polish.
- **Do not** duplicate long prose from `writing/` into JSON — summaries only.
- Production reader UX remains separate (`/read`, etc.).

## See also

- `dashboard_spec.md`
- `data_sources.md`
- `route_plan.md`
- `component_plan.md`
- `build_notes.md`
- `story_dev_mvp_checklist.md`
