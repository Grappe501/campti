import type { CharacterState } from "@/lib/domain/cognition";

/**
 * Merge simulation snapshot patch. When no DB snapshot exists, synthesizes a minimal row so overrides still apply.
 */
export function mergeCharacterStateSnapshot(
  base: CharacterState | null,
  patch?: Partial<CharacterState>
): CharacterState | null {
  if (!patch || Object.keys(patch).length === 0) return base;

  const empty: CharacterState = {
    id: "simulation-virtual-snapshot",
    snapshotKind: "SIMULATION_OVERRIDE",
    sequenceIndex: null,
    currentFear: null,
    currentDesire: null,
    currentObligation: null,
    currentShame: null,
    currentHope: null,
    currentAnger: null,
    currentSocialRisk: null,
    currentStatusVulnerability: null,
    currentMask: null,
    currentContradiction: null,
    currentArousal: null,
    currentLoneliness: null,
    currentWantednessHunger: null,
    currentNeedToBeNeeded: null,
    currentAttachmentAche: null,
    currentPleasureSeeking: null,
    currentForbiddenDesirePressure: null,
    currentResentmentAtDeprivation: null,
    relationshipsSnapshotJson: null,
    genealogicalContextRefsJson: null,
  };

  if (!base) {
    return { ...empty, ...patch };
  }
  return { ...base, ...patch };
}
