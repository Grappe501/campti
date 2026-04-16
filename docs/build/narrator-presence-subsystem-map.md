# Narrator Presence Subsystem Map

## Core Artifacts
- Domain: `lib/domain/narrator-presence.ts`
- Derivation: `lib/services/narrator-presence-derivation-service.ts`
- Convergence: `lib/services/narrator-convergence-engine-service.ts`
- Era bridging: `lib/services/narrator-era-bridge-service.ts`
- Validation: `lib/services/narrator-presence-validation-service.ts`
- Prose adapter: `lib/services/narrator-presence-to-prose-service.ts`
- Hook adapter: `lib/services/narrator-presence-to-hook-continuity-service.ts`

## Upstream Inputs
- chapter sequence and era windows
- scene IDs and closure timing
- existing ENCS hook declarations
- existing prose constraints

## Downstream Consumers
- ENCS derivation (`epic-continuity-derivation-service`)
- prose constraints derivation (`prose-generation-constraint-derivation-service`)
- authoritative cockpit (`author-command-cockpit-service`)
- regeneration orchestration (`book1-regeneration-loop-service`)

## Runtime Integration Points
1. Derive narrator pack at chapter runtime.
2. Apply narrator-to-hook adapter into ENCS declarations.
3. Apply narrator-to-prose adapter into chapter prose constraints.
4. Surface narrator cockpit summary in authoritative cockpit.
5. Validate narrator pack for abrupt shifts and boundary violations.

## Anti-Parallel-Architecture Guard
Narrator state is not exposed through a duplicate workbench. It is routed through the existing authoritative cockpit and existing ENCS/prose/regeneration pipelines.
