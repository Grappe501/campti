/**
 * Cluster 8 — psychological simulation core (mind model).
 * Distinct from Prisma voice rows and cognition-frame payloads: this is runtime pressure geometry.
 */

import { z } from "zod";

export type CharacterFearProfile = {
  primaryFearId: string;
  secondaryFearIds: string[];
  fearActivationThreshold: number;
  fearAvoidanceMoves: string[];
};

export type CharacterWoundProfile = {
  woundId: string;
  originSummary: string;
  triggerCues: string[];
  compulsionLoop: string;
};

export type CharacterShameProfile = {
  shameObject: string;
  publicMask: string;
  privateLeakVector: string;
};

export type CharacterPrideProfile = {
  prideAnchor: string;
  humiliationRisk: string;
};

export type CharacterBeliefSystem = {
  coreBeliefs: string[];
  brittleAssumptions: string[];
};

export type CharacterMindProfile = {
  characterId: string;
  coreDesire: string;
  surfaceDesire: string;
  fearProfile: CharacterFearProfile;
  woundProfile: CharacterWoundProfile;
  shameProfile: CharacterShameProfile;
  prideProfile: CharacterPrideProfile;
  beliefSystem: CharacterBeliefSystem;
  identityNarrative: string;
  selfDeceptionPatterns: string[];
  survivalStrategy: string;
  attachmentStyle: string;
  conflictStyle: string;
  decisionStyle: string;
  changeResistance: number;
  breakingPointConditions: string[];
  moralBoundaryMap: Record<string, string>;
  emotionalSuppressionStyle: string;
  perceptionBiasMap: Record<string, string>;
  memoryWeightMap: Record<string, number>;
  worldviewFrame: string;
};

export type CharacterCognitiveState = {
  characterId: string;
  currentDesireFocus: string;
  currentFearActivation: number;
  currentEmotionalState: string;
  currentRelationalFocus: string;
  currentInternalConflict: string;
  currentSuppressionState: string;
  currentDecisionPressure: number;
  currentIdentityStress: number;
};

export const CharacterFearProfileSchema = z.object({
  primaryFearId: z.string(),
  secondaryFearIds: z.array(z.string()),
  fearActivationThreshold: z.number(),
  fearAvoidanceMoves: z.array(z.string()),
});

export const CharacterWoundProfileSchema = z.object({
  woundId: z.string(),
  originSummary: z.string(),
  triggerCues: z.array(z.string()),
  compulsionLoop: z.string(),
});

export const CharacterShameProfileSchema = z.object({
  shameObject: z.string(),
  publicMask: z.string(),
  privateLeakVector: z.string(),
});

export const CharacterPrideProfileSchema = z.object({
  prideAnchor: z.string(),
  humiliationRisk: z.string(),
});

export const CharacterBeliefSystemSchema = z.object({
  coreBeliefs: z.array(z.string()),
  brittleAssumptions: z.array(z.string()),
});

export const CharacterMindProfileSchema = z.object({
  characterId: z.string().min(1),
  coreDesire: z.string(),
  surfaceDesire: z.string(),
  fearProfile: CharacterFearProfileSchema,
  woundProfile: CharacterWoundProfileSchema,
  shameProfile: CharacterShameProfileSchema,
  prideProfile: CharacterPrideProfileSchema,
  beliefSystem: CharacterBeliefSystemSchema,
  identityNarrative: z.string(),
  selfDeceptionPatterns: z.array(z.string()),
  survivalStrategy: z.string(),
  attachmentStyle: z.string(),
  conflictStyle: z.string(),
  decisionStyle: z.string(),
  changeResistance: z.number().min(0).max(1),
  breakingPointConditions: z.array(z.string()),
  moralBoundaryMap: z.record(z.string(), z.string()),
  emotionalSuppressionStyle: z.string(),
  perceptionBiasMap: z.record(z.string(), z.string()),
  memoryWeightMap: z.record(z.string(), z.number()),
  worldviewFrame: z.string(),
});

export const CharacterCognitiveStateSchema = z.object({
  characterId: z.string().min(1),
  currentDesireFocus: z.string(),
  currentFearActivation: z.number().min(0).max(1),
  currentEmotionalState: z.string(),
  currentRelationalFocus: z.string(),
  currentInternalConflict: z.string(),
  currentSuppressionState: z.string(),
  currentDecisionPressure: z.number().min(0).max(1),
  currentIdentityStress: z.number().min(0).max(1),
});
