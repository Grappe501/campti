# Scene Run Instability Signals

Instability signals are **operational pattern detectors** over ledger facts. They are not judgments of artistic quality.

## Properties

Each **`SceneRunInstabilitySignal`** includes:

- `code` — stable identifier for tooling and docs.
- `severity` — `info` | `warning` | `critical` (operational attention, not literary merit).
- `label` — short title.
- `basis` — concrete counts or facts from the run window (e.g. “3 of 5 runs were `allowed_with_risk`”).

## Example codes (illustrative)

| Code | Typical basis |
|------|----------------|
| `repeated_risky_launches` | Multiple `allowed_with_risk` (or equivalent) in window |
| `repair_loop_risk` | Elevated repair/revision counts |
| `replay_heavy` | High replay count without stabilization |
| `execution_failure_pattern` | Repeated incomplete or failed generation flags |
| `research_pressure_recurring` | Evidence from guard/preflight proxies pointing at research/canon stress |
| `simulation_pressure_recurring` | Character simulation readiness or conflict signals recurring |

Exact codes live in `scene-run-outcome-analytics-service.ts` and should stay aligned with this document when extended.

## Pressure vs instability

- **Instability** — repeated problematic *patterns* in launches or execution outcomes.
- **Pressure sources** — *where* the system suggests looking next (research, simulation, environment, governance, input completeness), framed as hypotheses for operators.

## Heuristic diff signals

The **structured run diff** may attach **`SceneRunQualityHeuristic`** entries (e.g. `replay_divergence_risk`) that overlap thematically with instability codes but apply to **pairs** of runs. Those remain explicitly `derivation: "heuristic"`.
