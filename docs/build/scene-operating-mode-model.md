# Scene operating mode model

**Purpose:** A **single headline label** summarizing how to think about operating on a scene right now, with a **trace** back to facts — not a replacement for preflight, ledger, or launch guard.

**Source:** `SceneOperatingMode` / `SceneOperatingModeSummary` in `lib/domain/scene-stability-operating.ts`, `deriveSceneOperatingMode` in `lib/services/scene-stability-operating-service.ts`.

## Modes

| Mode | Typical meaning |
|------|-----------------|
| `stable` | Recent window comparatively calm; preflight still required per launch. |
| `caution` | Default / mixed signals. |
| `churn_risk` | Replay/repair/operational churn elevated. |
| `blocked_by_truth_pressure` | Preflight blocked **or** blocking research contradictions. |
| `replay_unlikely_to_help` | Replay churn forecast and research pressure forecast both present. |

## Trace and uncertainty

- `trace`: ordered strings pointing at the concrete triggers (counts, allowance, forecast codes).
- `uncertaintyNote`: merges stability memory completeness gaps and low-confidence forecasts.

## Relationship to launch policy

Operating mode is **display-only**. Launch allowance remains governed by existing preflight and scene launch guard policy; mode must not introduce hidden overrides.
