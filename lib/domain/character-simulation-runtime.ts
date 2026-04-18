import { z } from "zod";

import { CharacterCognitiveStateSchema, CharacterMindProfileSchema } from "@/lib/domain/character-mind";

export const CHARACTER_SIMULATION_RUNTIME_CONTRACT_VERSION = "1" as const;

export const CharacterSimulationRuntimeArtifactSchema = z.object({
  contractVersion: z.literal(CHARACTER_SIMULATION_RUNTIME_CONTRACT_VERSION),
  clusterTag: z.literal("cluster8_character_simulation_runtime"),
  sceneId: z.string().min(1),
  chapterId: z.string().min(1),
  mindProfiles: z.array(CharacterMindProfileSchema),
  cognitiveStates: z.array(CharacterCognitiveStateSchema),
  voiceProfiles: z.array(
    z.object({
      characterId: z.string().min(1),
      internalMonologueStyle: z.string(),
      spokenDialogueStyle: z.string(),
      silencePattern: z.string(),
      deflectionPattern: z.string(),
      emotionalExpressionStyle: z.string(),
      metaphorDomain: z.string(),
      cadenceProfile: z.string(),
      vocabularyRange: z.enum(["narrow", "medium", "wide"]),
      tabooBoundaries: z.array(z.string()),
      conflictSpeechPattern: z.string(),
      intimacySpeechPattern: z.string(),
      powerSpeechPattern: z.string(),
      stressVoiceShiftPattern: z.string(),
    }),
  ),
  voiceStates: z.array(
    z.object({
      characterId: z.string().min(1),
      currentVoiceMode: z.enum([
        "public",
        "private",
        "intimate",
        "defensive",
        "dominant",
        "suppressed",
      ]),
      stressLevel: z.number().min(0).max(1),
      relationalContext: z.string(),
      truthVsMaskRatio: z.number().min(0).max(1),
    }),
  ),
  relationshipProfiles: z.array(
    z.object({
      relationshipId: z.string().min(1),
      participants: z.tuple([z.string(), z.string()]),
      bondType: z.string(),
      dependencyMap: z.record(z.string(), z.number()),
      powerBalance: z.number(),
      trustLevel: z.number(),
      unspokenNeeds: z.array(z.string()),
      resentmentLines: z.array(z.string()),
      protectionInstinct: z.string(),
      conflictHistory: z.array(z.string()),
      repairHistory: z.array(z.string()),
      breakRisk: z.number().min(0).max(1),
      repairDifficulty: z.number().min(0).max(1),
      silenceZones: z.array(z.string()),
    }),
  ),
  relationshipStates: z.array(
    z.object({
      relationshipId: z.string().min(1),
      currentTensionLevel: z.number().min(0).max(1),
      currentThreatLevel: z.number().min(0).max(1),
      currentDependencyPressure: z.number().min(0).max(1),
      currentConflictMode: z.enum(["cold", "volatile", "passive", "repair_seek", "withdrawal"]),
      currentRepairStatus: z.enum(["none", "attempting", "stalled", "fragile_gain"]),
    }),
  ),
  sceneEmergenceDigest: z.object({
    sceneId: z.string().min(1),
    sceneNecessityReasons: z.array(z.string().min(1)).min(1),
    conflictSources: z.array(z.string().min(1)).min(1),
    povCandidates: z
      .array(
        z.object({
          personId: z.string().min(1),
          weight: z.number().min(0).max(1),
          rationale: z.string().min(1),
        }),
      )
      .min(1),
    scenePurposeFromPressure: z.string().min(1),
    dominantPressureIds: z.array(z.string().min(1)),
    validationFlags: z.array(z.string()),
  }),
  constraintFlags: z.array(z.string().min(1)),
  evolutionStamp: z.object({
    sceneOrderIndex: z.number().int().min(0),
    residueNotes: z.array(z.string()),
    noResetAligned: z.boolean(),
  }),
  promptInstructionLines: z.array(z.string().min(1)),
  validationFlags: z.array(z.string()),
});

export type CharacterSimulationRuntimeArtifact = z.infer<typeof CharacterSimulationRuntimeArtifactSchema>;

export type CharacterSimulationAuthorNudge = {
  desireWeightDeltaByCharacter?: Record<string, number>;
  fearWeightDeltaByCharacter?: Record<string, number>;
  relationshipTensionDeltaByPairKey?: Record<string, number>;
  voiceStressBoostByCharacter?: Record<string, number>;
  constraintBoundaryReliefTags?: string[];
};
