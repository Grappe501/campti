# Netlify deployment parity report

## Summary

Deployment failure was treated as a **parity** issue between a full local working tree and Netlify’s **git-only** checkout. The primary gap was **missing committed sources** for Cluster 2 enforcement imports, not a TypeScript or Node version skew.

## Audit — entrypoints

| Artifact | Role |
|----------|------|
| `package.json` | `build` → prisma helper + `build:next`; `typecheck` → `tsc --noEmit`; `engines.node` → `>=20.9.0` |
| `netlify.toml` | `build.command = npm run build`; `NODE_VERSION = 20`; `@netlify/plugin-nextjs` |
| `next.config.ts` | Default Next config (no `typescript.ignoreBuildErrors`) |
| `tsconfig.json` | Strict; `paths` `@/*` → `./*`; includes `**/*.ts` / `**/*.tsx` |
| Lockfile | `package-lock.json` (use `npm ci` on CI when lockfile is authoritative) |
| Node version | `.nvmrc` = `20`; matches Netlify `NODE_VERSION` |

## First failing cause (root)

**TypeScript could not resolve `@/lib/domain/enforcement-contract` (and related enforcement modules) on Netlify** because those files were **not in the remote repository** while local development had them as **untracked** files.

## Why local passed

Local `tsc` and `next build` saw the full filesystem, including untracked enforcement files.

## Why Netlify failed

Netlify clones **only committed** content. Imports to paths that do not exist in the commit fail during Next’s production TypeScript phase.

## Fixes applied

1. **Stage and commit** enforcement contract domain, registry service, cockpit truth service, tests, and `scripts/verify-enforcement-contract.ts`, together with dependent modifications already importing those modules.
2. **`scripts/prisma-generate-optional.mjs`:** On non-Windows platforms, a failed `prisma generate` **exits non-zero** so CI cannot proceed without a generated Prisma Client (Windows retains lenient behavior for DLL lock issues).
3. **`.nvmrc`:** Pin major Node line to match Netlify.
4. **`package.json`:** Add explicit `build:next` script for a clear split: prisma step → `next build`.
5. **`.gitignore`:** Ignore generated `reports/enforcement-registry-snapshot.json`.

## Files touched (see git for exact list)

- New: `lib/domain/enforcement-contract.ts`, `lib/services/enforcement-registry-service.ts`, `lib/services/enforcement-cockpit-truth-service.ts`, associated tests, `scripts/verify-enforcement-contract.ts`
- Updated: dependent domain/services, `package.json`, `scripts/prisma-generate-optional.mjs`, `netlify.toml`, `.gitignore`
- Added: `.nvmrc`

## Remaining risks

- Changes must be **pushed** to the remote used by Netlify.
- Confirm Netlify UI does not override `build command` or **base directory**.
- Watch for **build memory** limits on large `next build` runs.

## Related docs

- `docs/build/ci-only-failure-root-cause.md` — detailed cause narrative
- `docs/build/build-command-diff-report.md` — local vs Netlify command table
