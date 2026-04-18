# Scene Generation Readiness Model

## Readiness classes (subsystem and overall)

| Class | Typical meaning |
|--------|------------------|
| `ready` | Subsystem assembled without blocker-level issues for this snapshot. |
| `ready_with_advisories` | Usable but carries labeled advisories (e.g. open research claims). |
| `downgrade_risk` | Known weakness that may reduce quality or truth fidelity — mapped into **downgrade risk** list and launch **allowed_with_risk** when no blockers. |
| `blocked` | Unsafe or impossible to treat as a comparable canonical run — contributes **blockers** and launch **blocked**. |
| `observational_only` | Informational row only (e.g. final execution truth before any run). |
| `rehearsal_incomplete` | Reserved for alignment with final-execution vocabulary when that signal is wired without lying. |

Overall readiness is derived **after** launch allowance:

1. If `launchAllowance === "blocked"` → overall `blocked`
2. Else if `allowed_with_risk` → overall `downgrade_risk`
3. Else if `observationalOnly` flag (global) → `observational_only` *(currently unused at global aggregate; reserved)*
4. Else if any advisories → `ready_with_advisories`
5. Else → `ready`

## Launch allowance (author-facing gate)

Computed only from **counts**:

- `blockers.length > 0` → `blocked`
- Else `risks.length > 0` → `allowed_with_risk`
- Else → `allowed`

**Important:** Downgrade risks are represented in the `risks` array. Subsystem flags alone do not change allowance unless a corresponding blocker or risk row exists.

## Blocker vs risk vs advisory

| Kind | Affects launch allowance | Example |
|------|-------------------------|---------|
| Blocker | Yes — forces `blocked` | Input load failure, hash throw, registry semantic **error**, missing `OPENAI_API_KEY` |
| Downgrade risk | Yes — forces `allowed_with_risk` if no blockers | Human gravity degraded, research contradictions, character simulation workbench cast issues, partial cast simulation fidelity |
| Advisory | No — allowed, overall may be `ready_with_advisories` | Governance **warnings**, zero narrative sources, open research claims, RICRE bundle mismatch advisory |
