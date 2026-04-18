# Scene Launch Allowance Model

## Allowance values

| Value | Meaning |
|-------|---------|
| `allowed` | No preflight blockers and no downgrade-risk rows (`risks.length === 0` in preflight). |
| `allowed_with_risk` | No blockers, but downgrade risks exist — **confirmation required** before `runSceneGeneration`. |
| `blocked` | At least one blocker (e.g. input load failure, hash failure, governance errors, missing `OPENAI_API_KEY`). |

Allowance is **identical** to `SceneGenerationPreflightSummary.launchAllowance` — derived from the same preflight service, not recomputed independently.

## Confirmation policy (`deriveLaunchConfirmationRequired`)

- `blocked` → `false` (launch path stops earlier).
- `allowed_with_risk` → `true`.
- `allowed` with `overallReadinessClass === "rehearsal_incomplete"` → `true` (explicit acknowledgement path; rare with current preflight vocabulary).
- Otherwise `allowed` → `false`.

## Execution environment

Missing `OPENAI_API_KEY` is a **blocker** in preflight — the guard never offers “Proceed anyway” for a run that cannot execute.
