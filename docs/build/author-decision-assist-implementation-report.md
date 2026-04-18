# Author Decision Assist — Implementation Report

**Date:** 2026-04-18

## What was added

### Domain & validation

- `lib/domain/scene-decision-assist.ts` — recommendation VM, categories, evidence, actions, cockpit card type.
- `lib/domain/scene-decision-assist-validation.ts` — Zod request schema.

### Service

- `lib/services/scene-decision-assist-service.ts` — `buildSceneDecisionAssistViewModel`, `collectSceneDecisionRecommendations` (testable rules), `applySceneDecisionRecommendationSuppression`, honest partial-history caps.

### Server action

- `app/actions/scene-decision-assist.ts` — `loadSceneDecisionAssistAction`.

### UI

- `components/admin/scene-decision-assist-client.tsx` — expandable evidence, strength badges, wired links.
- `components/admin/scene-decision-assist-tab-section.tsx` — server tab loader.

### Integration

- `app/admin/scenes/[id]/page.tsx` — **Decision assist** nav + `tab=assist` branch.
- `components/admin/scene-run-ledger-tab-section.tsx` + `scene-run-ledger-client.tsx` — initial assist + run-scoped refresh via action; compact card above run detail.
- `app/admin/narrative/page.tsx` + `components/admin/author-command-cockpit.tsx` — optional cockpit card + quick link.

### Tests & verify

- `lib/services/scene-decision-assist-service.test.ts`
- `scripts/verify-author-decision-assist.ts`
- `package.json` — `verify:author-decision-assist`

### Docs

- `docs/build/author-decision-assist-spec.md`
- `docs/build/scene-decision-recommendation-model.md`
- `docs/build/scene-decision-recommendation-rules.md`
- `docs/build/scene-decision-recommendation-evidence.md`
- This report.

## Schema / migrations

- **None.** No recommendation persistence.

## Recommendations visible

All taxonomy categories can appear when inputs satisfy rules: preflight blockers, research pressure, simulation blockers, churn pause, inspect diff, repair lean, guarded replay, stability-improving note, legacy/historical honesty.

## Actions wired

Real `Link` targets only: scene tabs (`preflight`, `research`, `runs`, `assist`), `/admin/research?sceneId=…`, `/admin/people`, `/admin/people/:id/simulation-workbench`, narrative cockpit. Replay remains **text routing** to Runs tab — actual replay still uses the existing guarded button.

## Deferred

- Persisted recommendation audit / acceptance telemetry.
- Deeper per-run output linkage in evidence.
- Chapter/book scoped assist bundles.

## Verification

```bash
npm run verify:author-decision-assist
npm run typecheck
```

## Risks / next step

- **Cost:** Scene assist loads preflight + research tab + ledger + analytics + simulation rollup; acceptable for admin but watch latency.
- **Next step:** Optional cache key on `(sceneId, digest)` if operators report slow tab loads; add lightweight “shown recommendation” log if product needs acceptance metrics.
