# Scene Launch Confirmation Flow

## Operator steps

1. **Evaluate** — `evaluateSceneLaunchGuardAction({ sceneId })` returns `SceneLaunchGuardResult` including `freshnessDigest`.
2. **Classify** — UI reads `launchAllowance`:
   - `blocked` — no model call; show blockers + remediation; optional `recordBlockedLaunchAcknowledgementAction` for audit when the operator dismisses.
   - `allowed` — single guarded path: `confirmAndLaunchSceneGenerationAction` with `riskAcknowledged: false`.
   - `allowed_with_risk` — show structured modal listing **subsystem-scoped risks** and impacts; operator must choose **Proceed anyway** which sends `riskAcknowledged: true`.
3. **Confirm** — Server recomputes preflight, verifies digest, re-checks allowance, enforces `riskAcknowledged` when required, then calls `runSceneGeneration`.

## Stale protection

If preflight changes between steps (new blocker, allowance flip, hash change), digest mismatch yields `stale_guard_state` and a new evaluation is required.

## UI surfaces

- **Scene Preflight tab** — full `SceneGenerationLaunchPanel` with modals.
- **Author cockpit (scene scope)** — compact launch panel with the same server actions.

## Copy rules

- Blocked: explain **why** launch cannot proceed; never imply a retry will succeed without remediation.
- Risk: name subsystems and concrete downgrade impacts — no empty “Are you sure?”.
