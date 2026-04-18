import type { CharacterCognitiveState, CharacterMindProfile } from "@/lib/domain/character-mind";
import type { HumanGravityRuntimeProfile } from "@/lib/domain/human-gravity-runtime";
import type { RelationshipState } from "@/lib/domain/character-relationship";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

export type EvolveCharacterStatesParams = {
  minds: CharacterMindProfile[];
  priorCognitive: CharacterCognitiveState[];
  priorRelationshipStates: RelationshipState[];
  sceneOrderIndex: number;
  humanGravity: HumanGravityRuntimeProfile | null;
  /** When false, identity stress cannot snap back downward without residue note (no-reset alignment). */
  allowEmotionalReset: boolean;
};

/**
 * Cluster 8 — scene-to-scene residue: pressure lingers, repairs stall, fear activation decays slowly.
 */
export class CharacterStateEvolutionService {
  evolveAfterScene(params: EvolveCharacterStatesParams): {
    cognitiveStates: CharacterCognitiveState[];
    relationshipStates: RelationshipState[];
    residueNotes: string[];
    noResetAligned: boolean;
  } {
    const residueNotes: string[] = [];
    let noResetAligned = true;

    const hg = params.humanGravity;
    const fearBoost = hg ? clamp01(hg.humanGravityScore * 0.12) : 0;
    const stakeBoost = hg ? clamp01(Math.max(0, ...Object.values(hg.relationalThreatMap)) * 0.08) : 0;

    const cognitiveStates = params.minds.map((mind, idx) => {
      const prior = params.priorCognitive.find((c) => c.characterId === mind.characterId);
      const baseFear = prior?.currentFearActivation ?? 0.35 + mind.fearProfile.fearActivationThreshold * 0.2;
      let fear = clamp01(baseFear + fearBoost + stakeBoost - 0.02 * params.sceneOrderIndex);
      const decisionPressure = clamp01(
        (prior?.currentDecisionPressure ?? 0.42) + 0.04 * params.sceneOrderIndex + (hg ? 0.05 : 0),
      );
      let identityStress = clamp01(
        (prior?.currentIdentityStress ?? 0.35) + mind.changeResistance * 0.03 + stakeBoost * 0.5,
      );

      if (!params.allowEmotionalReset && prior && identityStress + 1e-6 < prior.currentIdentityStress) {
        identityStress = clamp01(prior.currentIdentityStress - 0.01);
        residueNotes.push(`no_reset_identity_stress_floor:${mind.characterId}`);
      } else if (!params.allowEmotionalReset && prior && fear + 1e-6 < prior.currentFearActivation * 0.85) {
        fear = clamp01(prior.currentFearActivation * 0.92);
        residueNotes.push(`no_reset_fear_decay_cap:${mind.characterId}`);
      }

      if (params.allowEmotionalReset && prior && identityStress + 0.05 < prior.currentIdentityStress) {
        noResetAligned = false;
      }

      return {
        characterId: mind.characterId,
        currentDesireFocus:
          prior?.currentDesireFocus ??
          `${mind.surfaceDesire} (pressed against ${mind.fearProfile.primaryFearId})`,
        currentFearActivation: fear,
        currentEmotionalState:
          fear > 0.72 ? "brittle" : fear > 0.48 ? "strained" : "controlled",
        currentRelationalFocus: prior?.currentRelationalFocus ?? "household exposure risk",
        currentInternalConflict:
          prior?.currentInternalConflict ??
          `${mind.coreDesire} vs ${mind.survivalStrategy}`,
        currentSuppressionState:
          fear > 0.65 ? "leaking_through_body" : "mostly_held",
        currentDecisionPressure: decisionPressure,
        currentIdentityStress: identityStress,
      };
    });

    const relationshipStates = params.priorRelationshipStates.map((rs) => {
      const tension = clamp01(rs.currentTensionLevel + 0.03 * params.sceneOrderIndex + stakeBoost * 0.4);
      const threat = clamp01(rs.currentThreatLevel + fearBoost * 0.6);
      return {
        ...rs,
        currentTensionLevel: tension,
        currentThreatLevel: threat,
        currentDependencyPressure: clamp01(rs.currentDependencyPressure + 0.02),
        currentConflictMode: tension > 0.75 ? ("volatile" as const) : rs.currentConflictMode,
        currentRepairStatus:
          rs.currentRepairStatus === "attempting" && tension > 0.78 ? ("stalled" as const) : rs.currentRepairStatus,
      };
    });

    return { cognitiveStates, relationshipStates, residueNotes, noResetAligned };
  }
}
