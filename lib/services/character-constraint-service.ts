import type { CharacterCognitiveState, CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceState } from "@/lib/domain/character-voice";
import type { RelationshipProfile, RelationshipState } from "@/lib/domain/character-relationship";

export type CharacterConstraintEvaluation = {
  characterId: string;
  blockedSpeechActs: string[];
  blockedRelationalMoves: string[];
  flags: string[];
};

/**
 * Cluster 8 — identity / psychology gates: prevents premature confession, magical repair, etc.
 */
export class CharacterConstraintService {
  evaluateForCharacter(input: {
    mind: CharacterMindProfile;
    cognitive: CharacterCognitiveState;
    voice: CharacterVoiceState;
    relationships: Array<{ profile: RelationshipProfile; state: RelationshipState }>;
  }): CharacterConstraintEvaluation {
    const flags: string[] = [];
    const blockedSpeechActs: string[] = [];
    const blockedRelationalMoves: string[] = [];

    if (input.cognitive.currentIdentityStress > 0.78 && input.voice.truthVsMaskRatio > 0.55) {
      blockedSpeechActs.push("cannot_sustain_full_honesty_monologue_under_identity_threat");
      flags.push("identity_stress_blocks_radical_honesty");
    }

    if (input.mind.changeResistance > 0.62 && input.cognitive.currentFearActivation > 0.55) {
      blockedSpeechActs.push("cannot_offer_unqualified_forgiveness_speech");
      flags.push("change_resistance_blocks_fast_repair_language");
    }

    for (const { profile, state } of input.relationships) {
      if (!profile.participants.includes(input.mind.characterId)) continue;
      if (profile.repairDifficulty > 0.72 && state.currentTensionLevel > 0.65) {
        blockedRelationalMoves.push(`relationship:${profile.relationshipId}:no_clean_reconciliation_yet`);
        flags.push("repair_difficulty_blocks_resolution_scene");
      }
      if (state.currentThreatLevel > 0.7 && input.voice.currentVoiceMode === "intimate") {
        blockedSpeechActs.push("cannot_drop_guard_into_intimacy_while_threat_high");
        flags.push("threat_blocks_intimacy_voice");
      }
    }

    if (input.cognitive.currentFearActivation > 0.68 && input.mind.selfDeceptionPatterns.length) {
      flags.push("self_deception_active_limits_self_insight_dialogue");
    }

    return {
      characterId: input.mind.characterId,
      blockedSpeechActs,
      blockedRelationalMoves,
      flags,
    };
  }
}
