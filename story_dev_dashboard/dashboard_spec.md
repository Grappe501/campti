# Dashboard spec — Story Dev MVP

Canon status: PROPOSED

## Route

- **`/story-dev`** — Next.js App Router page: `app/story-dev/page.tsx`.

## Data

- Primary snapshot: `writing/04_production_dashboard/progress_system/data/story_dev_dashboard.json`
- Update guide: `story_dev_dashboard_readme.md` (same folder)

## MVP panels (10)

1. Epic progress (score + bar + summary)
2. Book 01 progress (score + bar + summary)
3. Current focus string
4. Next actions list
5. Top blockers list
6. Prose tonal model + Sample 002 status + repo paths
7. Character packet status + path
8. Symbol braid + series symbols paths
9. Research status (sassafras/gumbo lane)
10. Alignment sweep status (`alignment_sweep_001`)

## Future (non-blocking)

- Pull selected markdown tables at build time (scripted) instead of JSON summaries.
- Add “open in repo” deep links if a stable Git remote is defined.
