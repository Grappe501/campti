# Recommendation learning forward path — implementation report

Phased roadmap (A–C) for closing the recommendation learning loop, improving signals, and surfacing stability/operator views **without autopilot or hidden policy**.

**Status:** As of this document, the following are implemented in code and wired where noted. Deferred items are called out explicitly.

## Phase A — Learning loop closure

| Slice | Status | Notes |
|-------|--------|--------|
| A.1 Event spine | **Done** | `SceneRecommendationEvent` + taxonomy; see `docs/build/scene-recommendation-event-model.md`. |
| A.2 Action capture | **Mostly done** | Server: replay → `replay_requested`; guarded launch completion → `launched_new_run`; repair enqueue/execute → `repair_requested`. Assist client logs `opened_preflight` / `opened_research` / `opened_diff` / `opened_simulation` when the recommendation action uses the wired handlers. Plain navigations that bypass those hooks may still be unlogged — document honestly in UI where coverage is partial. |
| A.3 Outcome linkage | **Done** | Conservative rules: `docs/build/scene-recommendation-outcome-linking-rules.md`. |
| A.4 Historical notes in assist | **Done** | Effectiveness augments primary/secondary recommendations; additive to rule basis. |

## Phase B — Signal quality & stability

| Slice | Status | Notes |
|-------|--------|--------|
| B.5 DB-backed bounded output diff in assist | **Done** | `computeAssistMaterialSignals` combines governance diff VM + `buildBoundedOutputDiffForLedgerKeys` when both latest rows are linked + churn hints. |
| B.6 Stability memory | **Done** | Read model only (no extra table v1); `docs/build/stability-memory-model.md`. |
| B.7 Forecasts / early warning | **Done** | `docs/build/stability-forecast-model.md`. |

## Phase C — Operator visibility

| Slice | Status | Notes |
|-------|--------|--------|
| C.8 Effectiveness analytics | **Done** (scene-scoped) | Correlations + UI panel; see `docs/build/scene-recommendation-effectiveness-model.md`. |
| C.9 Why strength changed | **Done** | `docs/build/recommendation-change-explanation-model.md`. |
| C.10 Operating modes | **Done** | `docs/build/scene-operating-mode-model.md`. |

## Verification

- `npm run verify:author-decision-assist` — assist rules + material signals unit tests + **integration** `scene-run-output-linkage-learning.integration.test.ts` (linked-output rows + bounded diff + persistence) when `DATABASE_URL` is set + verify script.
- `npm run verify:recommendation-effectiveness-learning-loop` — effectiveness aggregation + learning loop verify script.

## Deferred / follow-ups

- Broader action instrumentation (every navigation) — intentionally limited; expand only with clear value.
- Chapter/book-level stability memory — out of scope until scene memory proven.
- Dedicated DB table for stability memory — v1 derives from existing subsystems.

## Bounded output spine (promoted)

Integration-backed path is a **hardening target**, not optional-only: durable `SceneRunGenerationOutput` pairs feed `buildBoundedOutputDiffForLedgerKeys` → `computeAssistMaterialSignals` → Decision Assist + stability memory (persistence across snapshots) + forecasts + factual evidence lines (`e-df-bo`, `e-ch-out`, `e-rq-out`, honesty banner). Governance material churn still requires **≥2** changed diff slices (`governanceMaterialDiff`) — output materiality is a separate OR leg via `outputChurnMaterial` / bounded diff signals.
