# Build notes — story dev lane

Canon status: PROPOSED

## Local

- `npm run dev` → visit `http://localhost:3000/story-dev`
- JSON must exist at `writing/04_production_dashboard/progress_system/data/story_dev_dashboard.json` (repo root relative).

## Netlify

- Standard Next build; route deploys with the app.
- If JSON is missing at build/runtime, the page will error — keep file committed.

## Safety

- No writes to `writing/01_canon/` from this lane.
- No `ch_###` creation from this lane.
