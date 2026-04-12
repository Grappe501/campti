import type { CharacterRelationship, WorldStateReference } from "@prisma/client";

import type { CharacterCognitionFrame, CharacterState } from "@/lib/domain/cognition";
import type {
  SimulationResolutionPatch,
  SimulationVariableOverride,
} from "@/lib/domain/simulation-run";
import {
  annotateOverridesWithPriorFromBase,
  buildSimulationResolutionPatch,
} from "@/lib/simulation/build-simulation-resolution-patch";
import { mergeCharacterStateSnapshot } from "@/lib/simulation/merge-character-state-snapshot";
function mergeRelNotes(base: string | null | undefined, tag: string): string {
  const b = base?.trim() ?? "";
  if (b.includes("[sim:relationship")) return b;
  return b ? `${b} ${tag}` : tag;
}

/**
 * Non-mutating overlay on loaded relationship rows: appends simulation audit tags to `notes` only.
 * Does not write to `CharacterRelationship` in the database.
 */
export function applySimulationOverridesToRelationshipContext(
  characterId: string,
  relationships: CharacterRelationship[],
  patch: SimulationResolutionPatch
): CharacterRelationship[] {
  const hasPair = patch.relationshipPairTrust && Object.keys(patch.relationshipPairTrust).length > 0;
  const hasGlobal = patch.relationshipTrustBias != null && patch.relationshipTrustBias !== undefined;
  if (!hasPair && !hasGlobal) {
    return relationships;
  }

  return relationships.map((row, idx) => {
    const otherId = row.personAId === characterId ? row.personBId : row.personAId;
    const pairBias = patch.relationshipPairTrust?.[otherId];
    if (pairBias != null) {
      const tag = `[sim:relationship pairTrust=${pairBias} other=${otherId}]`;
      return { ...row, notes: mergeRelNotes(row.notes, tag) };
    }
    if (hasGlobal && idx === 0) {
      const tag = `[sim:relationship globalTrustBias=${patch.relationshipTrustBias}]`;
      return { ...row, notes: mergeRelNotes(row.notes, tag) };
    }
    return row;
  });
}

/**
 * Apply parsed overrides to a snapshot row (in-memory). Does not touch the database.
 */
export function applySimulationOverridesToCharacterState(
  base: CharacterState | null,
  patch: SimulationResolutionPatch
): CharacterState | null {
  return mergeCharacterStateSnapshot(base, patch.stateSnapshot);
}

/**
 * World-state row override for simulation: callers load `WorldStateReference` by id and substitute
 * the effective row used for norms / desire / language resolution.
 */
export function applySimulationOverridesToWorldState(
  base: WorldStateReference | null,
  patch: SimulationResolutionPatch,
  forced: WorldStateReference | null
): WorldStateReference | null {
  if (patch.worldStateReferenceId && forced) {
    return forced;
  }
  return base;
}

export type EffectiveSimulationContext = {
  patch: SimulationResolutionPatch;
  unparsedOverrides: SimulationVariableOverride[];
};

export function buildEffectiveSimulationContext(
  overrides: SimulationVariableOverride[]
): EffectiveSimulationContext {
  const { patch, unparsed } = buildSimulationResolutionPatch(overrides);
  return { patch, unparsedOverrides: unparsed };
}

export function enrichOverridesWithBaseFrame(
  frame: CharacterCognitionFrame,
  overrides: SimulationVariableOverride[]
): SimulationVariableOverride[] {
  return annotateOverridesWithPriorFromBase(frame, overrides);
}
