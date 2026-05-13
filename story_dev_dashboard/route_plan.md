# Route plan

Canon status: PROPOSED

## Implemented

| URL | Implementation |
|---|---|
| `/story-dev` | `app/story-dev/page.tsx` |

## Explicitly out of scope (MVP)

- `/story-dev/*` sub-routes (no SPA rewrite required)
- Auth gates (lane is public-read; treat as internal tooling visibility)

## Netlify / Next

- `@netlify/plugin-nextjs` handles Next routes; **no** aggressive `_redirects` catchalls added.
