# Build command diff — local vs Netlify

## What runs locally (typical developer)

| Step | Command | Notes |
|------|---------|--------|
| Install | `npm install` | Runs `postinstall` → `node scripts/prisma-generate-optional.mjs` (Windows may tolerate prisma lock failures; Linux exits non-zero on failure after this pass). |
| Typecheck only | `npm run typecheck` | `tsc --noEmit` — does not run Next.js. |
| Production build | `npm run build` | `prisma generate` helper → `npm run build:next` → `next build` (compile + Next “Running TypeScript …” + static generation). |
| Enforcement verification | `npm run verify:enforcement-contract` | Snapshot script + unit tests (not part of Netlify unless added to `build.command`). |

## What runs on Netlify (from `netlify.toml`)

| Setting | Value |
|---------|--------|
| `build.command` | `npm run build` |
| `NODE_VERSION` | `20` (aligned with `.nvmrc` and `package.json` `engines.node`) |
| Plugin | `@netlify/plugin-nextjs` |

Netlify’s install step uses the repo lockfile when configured; the **same** `npm run build` entrypoint applies as local **if** the repo contains the same sources.

## Where they differed (before fix)

| Dimension | Local | Netlify |
|-----------|--------|---------|
| Enforcement modules | Present on disk (some **untracked**) | Only **git-tracked** files |
| Outcome | `tsc` / `next build` succeed | Missing modules → TypeScript step fails |

## Canonical deployment path (after fix)

1. Commit and push all sources referenced by `@/` imports (including Cluster 2 enforcement files).
2. Netlify: `NODE_VERSION=20` → `npm install` / `npm ci` → `npm run build` → `@netlify/plugin-nextjs` publish.

Optional: add a Netlify deploy preview check that runs `npm run verify:enforcement-contract` — not required for Next build parity but useful for governance.
