# Regeneration Loop Beat Gating Patch Report

## Patch Summary
- `Book1RegenerationLoopService` now enforces beat assembly as a runtime gate.
- Beat chain is now generated from `ChapterState + BeatProfileRecommendation` via:
  - `ChapterStateToBeatAssemblyChainService`.
- If beat validation fails, normal regeneration is blocked and a structured failure artifact is returned.

## Gating Behavior
1. Derive chapter state and beat profile.
2. Derive narrative psychology bias.
3. Build state-driven beat chain.
4. Validate chain.
5. If invalid:
   - return `chapter_state_beat_assembly_failure`,
   - set `beatAssemblyBlocked=true`,
   - return cockpit bundle with blocking reason,
   - skip normal regenerated prose pass.
6. If valid:
   - pass ordered beats to segment preflight/evidence handoff,
   - continue regeneration path,
   - include beat-aware artifacts in regeneration review.

## Cockpit Visibility
- Added `beatGating` section and block reason.
- Added beat chain summary and validation status.
- Added narrative psychology and prose constraints summaries.
