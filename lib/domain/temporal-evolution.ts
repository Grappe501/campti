import type { ConsequenceMemorySalienceModifier } from "@/lib/domain/consequence-engine";
import type { MemoryActivationMode } from "@/lib/domain/memory-activation";
import type { EmotionalContinuityMode } from "@/lib/domain/conversation-emotional-continuity";

export const TEMPORAL_EVOLUTION_CONTRACT_VERSION = "1" as const;

export const TEMPORAL_EVOLUTION_CHANNELS = ["canonical_dyad", "reader_bond_dyad"] as const;
export const TEMPORAL_EVOLUTION_TRIGGER_KINDS = [
  "scene_generation_elapsed_interval",
  "conversation_reentry_elapsed_interval",
  "explicit_state_refresh_elapsed_interval",
  "author_debug_temporal_inspection",
] as const;
export const TEMPORAL_EVOLUTION_GRIEF_STAGES = [
  "none",
  "acute",
  "latent",
  "hardened",
] as const;
export const TEMPORAL_EVOLUTION_ROLE_SHIFT_TYPES = [
  "none",
  "youth_to_elder_authority",
  "prolonged_scarcity_burden",
] as const;

export type TemporalEvolutionChannel = (typeof TEMPORAL_EVOLUTION_CHANNELS)[number];
export type TemporalEvolutionTriggerKind = (typeof TEMPORAL_EVOLUTION_TRIGGER_KINDS)[number];
export type TemporalEvolutionGriefStage = (typeof TEMPORAL_EVOLUTION_GRIEF_STAGES)[number];
export type TemporalEvolutionRoleShiftType = (typeof TEMPORAL_EVOLUTION_ROLE_SHIFT_TYPES)[number];

export type TemporalEvolutionTrigger = {
  triggerKind: TemporalEvolutionTriggerKind;
  occurredAtIso: string;
  lastAppliedAtIso?: string | null;
  elapsedIntervalHours?: number | null;
};

export type TemporalEvolutionRelationshipInput = {
  trustBaseline: number;
  fearBaseline: number;
  dependenceBaseline: number;
  autonomyBaseline: number;
  dutyBaseline: number;
  stabilityBaseline: number;
};

export type TemporalEvolutionPressureInput = {
  repeatedSocialPressure: number;
  repeatedScarcityPressure: number;
  repeatedConflictPressure: number;
  repeatedGriefPressure: number;
};

export type TemporalEvolutionDurationInput = {
  unresolvedGriefDays: number;
  unresolvedConsequenceDays: number;
  unresolvedBreachDays: number;
};

export type TemporalEvolutionMemoryInput = {
  highestActivationWeight: number;
  activationCount: number;
  dominantActivationMode: MemoryActivationMode | null;
};

export type TemporalEvolutionRoleShiftInput = {
  lifeStageShift: TemporalEvolutionRoleShiftType;
  roleBurdenShift: TemporalEvolutionRoleShiftType;
};

export type TemporalEvolutionSummary = {
  contractVersion: typeof TEMPORAL_EVOLUTION_CONTRACT_VERSION;
  channel: TemporalEvolutionChannel;
  mode: EmotionalContinuityMode;
  triggerKind: TemporalEvolutionTriggerKind;
  applied: boolean;
  elapsedIntervalHours: number;
  griefDurationStage: TemporalEvolutionGriefStage;
  roleShift: TemporalEvolutionRoleShiftType;
  repeatedPressureFactors: {
    social: number;
    scarcity: number;
    conflict: number;
    grief: number;
  };
  relationshipBaselineDrift: {
    trustBaselineDelta: number;
    fearHardeningDelta: number;
    dependenceAutonomyDelta: number;
    dutyBurdenDelta: number;
    stabilityDelta: number;
  };
  memorySalienceDrift: {
    sourceConsequenceId: string;
    salienceDelta: number;
  }[];
  emotionalContinuityModifiers: {
    affectDelta: number;
    volatilityDelta: number;
    guardednessDelta: number;
    opennessDelta: number;
    avoidanceDelta: number;
  };
  behaviorTendencySummary: {
    conflictReadinessDelta: number;
    conflictAvoidanceDelta: number;
    dutyRigidityDelta: number;
    trustApproachDelta: number;
  };
  reasonCodes: string[];
};

export type TemporalEvolutionInput = {
  channel: TemporalEvolutionChannel;
  mode: EmotionalContinuityMode;
  trigger: TemporalEvolutionTrigger;
  relationship: TemporalEvolutionRelationshipInput;
  pressure: TemporalEvolutionPressureInput;
  unresolvedDurations: TemporalEvolutionDurationInput;
  memory: TemporalEvolutionMemoryInput;
  consequenceMemorySalience: ConsequenceMemorySalienceModifier[];
  roleShift: TemporalEvolutionRoleShiftInput;
};
