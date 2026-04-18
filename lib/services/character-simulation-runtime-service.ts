import type { CharacterCognitiveState, CharacterMindProfile } from "@/lib/domain/character-mind";
import type { RelationshipProfile, RelationshipState } from "@/lib/domain/character-relationship";
import type { CharacterVoiceState } from "@/lib/domain/character-voice";
import {
  CharacterSimulationRuntimeArtifactSchema,
  type CharacterSimulationAuthorNudge,
  type CharacterSimulationRuntimeArtifact,
} from "@/lib/domain/character-simulation-runtime";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { CharacterConstraintService } from "@/lib/services/character-constraint-service";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";
import { CharacterSceneEmergenceService } from "@/lib/services/character-scene-emergence-service";
import { CharacterStateEvolutionService } from "@/lib/services/character-state-evolution-service";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function applyNudgeToCognitive(
  states: CharacterCognitiveState[],
  nudge: CharacterSimulationAuthorNudge | null | undefined,
): CharacterCognitiveState[] {
  if (!nudge?.desireWeightDeltaByCharacter && !nudge?.fearWeightDeltaByCharacter) return states;
  return states.map((s) => {
    const fearD = nudge.fearWeightDeltaByCharacter?.[s.characterId] ?? 0;
    const desireW = nudge.desireWeightDeltaByCharacter?.[s.characterId] ?? 0;
    return {
      ...s,
      currentFearActivation: clamp01(s.currentFearActivation + fearD),
      currentDecisionPressure: clamp01(s.currentDecisionPressure + desireW * 0.5),
    };
  });
}

function applyNudgeToRelationships(
  profiles: RelationshipProfile[],
  states: RelationshipState[],
  nudge: CharacterSimulationAuthorNudge | null | undefined,
): RelationshipState[] {
  if (!nudge?.relationshipTensionDeltaByPairKey) return states;
  return states.map((rs) => {
    const prof = profiles.find((p) => p.relationshipId === rs.relationshipId);
    if (!prof) return rs;
    const key = pairKey(prof.participants[0], prof.participants[1]);
    const d = nudge.relationshipTensionDeltaByPairKey?.[key] ?? 0;
    return {
      ...rs,
      currentTensionLevel: clamp01(rs.currentTensionLevel + d),
    };
  });
}

/**
 * Canonical bridge: builds Cluster 8 runtime artifact for prompts + cockpit (single scene generation path).
 */
export class CharacterSimulationRuntimeDerivationService {
  private readonly seeds = new CharacterMindSeedService();

  private readonly evolution = new CharacterStateEvolutionService();

  private readonly emergence = new CharacterSceneEmergenceService();

  private readonly constraints = new CharacterConstraintService();

  derive(input: SceneGenerationInput): CharacterSimulationRuntimeArtifact | null {
    const pre = input.canonicalPreGeneration;
    if (!pre?.governanceMergeApplied) return null;

    const sceneId = input.contract.scene.id;
    const chapterId = input.contract.chapter.id;
    const people = input.contract.participatingPeople;
    if (!people.length) return null;

    const persisted = input.persistedCharacterSimulationProfiles ?? {};

    const minds: CharacterMindProfile[] = people.map((p) => {
      const base = this.seeds.buildMindProfile({ characterId: p.id, displayLabel: p.name ?? p.id });
      const patch = persisted[p.id]?.mindPartial;
      if (!patch || Object.keys(patch).length === 0) return base;
      return this.seeds.mergeMindProfile(base, patch);
    });

    const voiceProfiles = people.map((p) => {
      const base = this.seeds.buildVoiceProfile({ characterId: p.id, displayLabel: p.name ?? p.id });
      const patch = persisted[p.id]?.voicePartial;
      if (!patch || Object.keys(patch).length === 0) return base;
      return this.seeds.mergeVoiceProfile(base, patch);
    });

    const seedCognitive: CharacterCognitiveState[] = minds.map((mind) => ({
      characterId: mind.characterId,
      currentDesireFocus: `${mind.surfaceDesire} (against ${mind.fearProfile.primaryFearId})`,
      currentFearActivation: clamp01(mind.fearProfile.fearActivationThreshold + 0.08),
      currentEmotionalState: "controlled",
      currentRelationalFocus: "household_and_public_boundary",
      currentInternalConflict: `${mind.coreDesire} vs ${mind.survivalStrategy}`,
      currentSuppressionState: "mostly_held",
      currentDecisionPressure: 0.44,
      currentIdentityStress: 0.38 + mind.changeResistance * 0.1,
    }));

    const relationshipProfiles: RelationshipProfile[] = [];
    for (let i = 0; i < people.length; i += 1) {
      for (let j = i + 1; j < people.length; j += 1) {
        const a = people[i]!.id;
        const b = people[j]!.id;
        relationshipProfiles.push({
          relationshipId: `rel:${pairKey(a, b)}`,
          participants: [a, b],
          bondType: "kin_or_household_obligation",
          dependencyMap: { [a]: 0.55, [b]: 0.48 },
          powerBalance: 0.52,
          trustLevel: 0.46,
          unspokenNeeds: ["recognition without exposure", "safety without humiliation"],
          resentmentLines: ["uneven labor of secrecy", "old slight unprocessed"],
          protectionInstinct: "shield younger name-bearers first",
          conflictHistory: ["public silence after private fight"],
          repairHistory: ["partial_repair_withdrawn"],
          breakRisk: 0.34,
          repairDifficulty: 0.63,
          silenceZones: ["money exact amounts", "prior oath"],
        });
      }
    }

    let relationshipStates: RelationshipState[] = relationshipProfiles.map((p) => ({
      relationshipId: p.relationshipId,
      currentTensionLevel: clamp01(0.4 + p.breakRisk * 0.4),
      currentThreatLevel: clamp01(0.35 + (1 - p.trustLevel) * 0.35),
      currentDependencyPressure: clamp01(0.45 + p.repairDifficulty * 0.05),
      currentConflictMode: "cold",
      currentRepairStatus: "stalled",
    }));

    const orderIdx = Math.max(0, input.contract.scene.orderInChapter ?? 0);
    const evolved = this.evolution.evolveAfterScene({
      minds,
      priorCognitive: seedCognitive,
      priorRelationshipStates: relationshipStates,
      sceneOrderIndex: orderIdx,
      humanGravity: input.humanGravityRuntime ?? null,
      allowEmotionalReset: false,
    });
    relationshipStates = evolved.relationshipStates;

    let cognitiveStates = applyNudgeToCognitive(evolved.cognitiveStates, input.characterSimulationAuthorNudge);
    relationshipStates = applyNudgeToRelationships(relationshipProfiles, relationshipStates, input.characterSimulationAuthorNudge);

    const voiceStates: CharacterVoiceState[] = cognitiveStates.map((c) => {
      const stress = clamp01(c.currentFearActivation * 0.55 + c.currentIdentityStress * 0.45);
      let mode: CharacterVoiceState["currentVoiceMode"];
      if (stress > 0.72) mode = "defensive";
      else if (stress > 0.55) mode = "suppressed";
      else if (c.currentRelationalFocus.toLowerCase().includes("intim")) mode = "intimate";
      else mode = "public";
      const nudgeStress = input.characterSimulationAuthorNudge?.voiceStressBoostByCharacter?.[c.characterId] ?? 0;
      return {
        characterId: c.characterId,
        currentVoiceMode: mode,
        stressLevel: clamp01(stress + nudgeStress),
        relationalContext: c.currentRelationalFocus,
        truthVsMaskRatio: clamp01(0.35 + (1 - stress) * 0.4),
      };
    });

    const povPersonId = people[0]?.id ?? null;
    const emergenceFromPlan =
      pre.characterSceneEmergencePlan?.sceneEmergenceBySceneId[sceneId] ?? null;
    const digest =
      emergenceFromPlan ??
      this.emergence.deriveSceneDigestForRuntimeScene({
        sceneId,
        minds,
        cognitiveStates,
        relationshipStates,
        epicContinuityPack: pre.epicContinuityPack,
        humanGravityRuntime: input.humanGravityRuntime ?? null,
        fallbackPovPersonId: povPersonId,
      });

    const constraintFlags: string[] = [];
    for (const mind of minds) {
      const cog = cognitiveStates.find((c) => c.characterId === mind.characterId)!;
      const voice = voiceStates.find((v) => v.characterId === mind.characterId)!;
      const relInputs = relationshipProfiles
        .filter((p) => p.participants.includes(mind.characterId))
        .map((profile) => ({
          profile,
          state: relationshipStates.find((s) => s.relationshipId === profile.relationshipId)!,
        }));
      const ev = this.constraints.evaluateForCharacter({ mind, cognitive: cog, voice, relationships: relInputs });
      constraintFlags.push(...ev.flags, ...ev.blockedSpeechActs, ...ev.blockedRelationalMoves);
    }

    const promptInstructionLines: string[] = [
      "CLUSTER8_CHARACTER_SIMULATION (motion source — subordinate to contract facts, P2-E sources, governance, human-gravity no-reset):",
      `— Scene purpose from pressure: ${digest.scenePurposeFromPressure}`,
      `— Necessity (do not explain as outline; embody): ${digest.sceneNecessityReasons.slice(0, 3).join(" | ")}`,
      `— Conflict sources: ${digest.conflictSources.slice(0, 4).join(" | ")}`,
      "— Dialogue must differ by character cognition + voice mode; internal inference follows each POV's distortion patterns.",
      ...voiceProfiles.map(
        (vp) =>
          `VOICE[${vp.characterId}]: inner=${vp.internalMonologueStyle.slice(0, 120)}… | spoken=${vp.spokenDialogueStyle.slice(0, 120)}… | stress_shift=${vp.stressVoiceShiftPattern}`,
      ),
      ...cognitiveStates.map(
        (c) =>
          `MIND[${c.characterId}]: fear=${c.currentFearActivation.toFixed(2)} decision_pressure=${c.currentDecisionPressure.toFixed(2)} identity_stress=${c.currentIdentityStress.toFixed(2)} | focus=${c.currentDesireFocus}`,
      ),
    ];

    if (constraintFlags.length) {
      promptInstructionLines.push(`— Constraint flags (honor as behavioral limits): ${[...new Set(constraintFlags)].slice(0, 8).join(" | ")}`);
    }

    return CharacterSimulationRuntimeArtifactSchema.parse({
      contractVersion: "1",
      clusterTag: "cluster8_character_simulation_runtime",
      sceneId,
      chapterId,
      mindProfiles: minds,
      cognitiveStates,
      voiceProfiles,
      voiceStates,
      relationshipProfiles,
      relationshipStates,
      sceneEmergenceDigest: digest,
      constraintFlags: [...new Set(constraintFlags)].slice(0, 24),
      evolutionStamp: {
        sceneOrderIndex: orderIdx,
        residueNotes: evolved.residueNotes,
        noResetAligned: evolved.noResetAligned,
      },
      promptInstructionLines,
      validationFlags: ["cluster8_character_simulation_runtime", "character_driven_scene_emergence"],
    });
  }
}
