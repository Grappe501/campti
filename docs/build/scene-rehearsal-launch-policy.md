# Scene Rehearsal Launch Policy

## Classification

**Rehearsal** launches use `launchClass: rehearsal` and `launchSource: cluster9_dry_run` for the Cluster 9 operator script. They share **machine-equivalent risk policy** when the model is invoked.

## Two honest modes

### 1. Non-mutating rehearsal (`allowModelMutation: false`)

- Builds preflight and writes **`rehearsal_non_launch_evaluated`** with `finalAction: rehearsal_no_mutation`.
- Does **not** call `runSceneGeneration`.
- Used when `OPENAI_API_KEY` is absent (best-effort audit before stub package emission).

### 2. Mutating rehearsal (`allowModelMutation: true`)

- Runs the same guarded core as machine automation: `executeGuardedSceneLaunch` with `freshnessBasis: rehearsal_execution_time`.
- On success, `confirmationMode: rehearsal_guarded` (when proceeding) or `machine_policy_denied` when blocked.
- Uses `CLUSTER9_REHEARSAL_MACHINE_POLICY` (currently identical to `DEFAULT_SCENE_MACHINE_LAUNCH_POLICY`).

## Operator expectations

Rehearsal is **not** a silent bypass: blocked or risky preflight states surface as guard failures (and audit rows) the same way as repair jobs, unless policy is explicitly widened in code.
