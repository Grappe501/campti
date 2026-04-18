# Scene Launch Guard — Specification

## Role

The **Scene Launch Guard** is the canonical **server-side enforcement layer** between **Scene Generation Preflight** truth and **`runSceneGeneration`**. Preflight is observational truth assembly; the launch guard is the **gate** used immediately before mutating model-backed generation.

## Authority

| Component | Responsibility |
|-----------|----------------|
| `buildSceneGenerationPreflight` | Assemble subsystem truth (read-only) |
| `evaluateSceneLaunchGuard` | Map preflight VM → `SceneLaunchGuardResult` + **freshness digest** |
| `executeSceneLaunchAfterGuard` | Rebuild preflight, verify digest, enforce allowance + confirmation, call `runSceneGeneration` |
| `SceneLaunchAuditLog` (Prisma) | Durable audit of evaluate / block / confirm / run |

## Non-goals

- Client-only gating or trusting the browser for allowance
- A second readiness scoring engine (all signals flow from preflight)
- “Proceed anyway” when `launchAllowance === "blocked"` (including missing execution prerequisites such as API keys)

## Freshness

`freshnessDigest` is a **sha256** over canonical fields from the preflight snapshot (`evaluatedAtIso`, hash preview, allowance, blocker/risk/advisory counts, overall readiness class, preflight contract version). `confirmAndLaunchSceneGenerationAction` **always** recomputes preflight and rejects when the digest differs — stale confirmations cannot launch against changed truth.
