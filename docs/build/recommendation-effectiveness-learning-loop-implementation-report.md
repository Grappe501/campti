# Recommendation effectiveness / learning loop — implementation report

## Added

1. **Prisma** — `SceneRecommendationEvent` model + migration `20260418240000_scene_recommendation_event`.
2. **Domain** — `lib/domain/scene-recommendation-learning.ts` (taxonomy, effectiveness VM, augmentation types).
3. **Validation** — `lib/domain/scene-recommendation-learning-validation.ts` (Zod for follow-up logging and effectiveness load).
4. **Services**
   - `scene-recommendation-learning-log-service.ts` — append shown + follow-up events.
   - `scene-recommendation-outcome-linking-service.ts` — pair launches to prior advice.
   - `scene-recommendation-effectiveness-service.ts` — aggregate stats, apply bounded adjustments.
5. **Integration**
   - `scene-decision-assist-service.ts` — log each assist render; load effectiveness; merge learning into recommendations (try/catch so DB issues do not break assist).
   - `scene-launch-guard-service.ts` — record outcome linkage after success and after generation failure (when `ledgerRunKey` exists).
   - `app/actions/scene-run-ledger.ts` — `replay_requested` follow-up log on successful replay.
6. **Server actions** — `app/actions/scene-recommendation-learning.ts` (`logRecommendationFollowupAction`, `loadRecommendationEffectivenessAction`).
7. **UI** — `scene-decision-assist-client.tsx` — learning notes, strength transparency, tab/href follow-up instrumentation, scene effectiveness panel.
8. **Tests** — `scene-recommendation-effectiveness-service.test.ts`.
9. **Verify** — `scripts/verify-recommendation-effectiveness-learning-loop.ts`, npm script `verify:recommendation-effectiveness-learning-loop`.
10. **Docs** — spec, event model, effectiveness model, confidence adjustment, this report.

## Updated files (high level)

- `lib/domain/scene-decision-assist.ts` — `learningAugmentation?`, `effectivenessSummary` on VM.
- `prisma/schema.prisma` — model + `Scene.recommendationEvents`.

## Visible operator facts

- Per-recommendation **historical pattern** block (when data exists) and **insufficient history** line otherwise.
- **Rule vs effective strength** when learning adjusts one step.
- **Scene learning loop** panel: window stats, follow-up action log summary, expandable per-category counts.

## Deferred

- Deeper repair / revision job instrumentation (explicit `repair_requested` from repair flows).
- Global cross-scene aggregation (optional spec).
- Richer outcome features (e.g. durable output delta as a covariate) — keep separate from this pass.

## Verification

```bash
npx prisma generate
npx prisma migrate deploy   # or dev migrate
npm run verify:recommendation-effectiveness-learning-loop
```

## Risks

- **Ambiguous timing** between advice and launch — mitigated by `ambiguous_followup` flag and copy.
- **Sparse outcomes** — mitigated by explicit low-confidence states; adjustments disabled when samples are small.
