/**
 * Phase 2 / Chunk 6 — Temporal Evolution Layer (bounded, non-continuous).
 */
import type { EmotionalContinuityMode } from "@/lib/domain/conversation-emotional-continuity";
import type {
  TemporalEvolutionGriefStage,
  TemporalEvolutionInput,
  TemporalEvolutionRoleShiftType,
  TemporalEvolutionSummary,
  TemporalEvolutionTrigger,
  TemporalEvolutionTriggerKind,
} from "@/lib/domain/temporal-evolution";
import { TEMPORAL_EVOLUTION_CONTRACT_VERSION } from "@/lib/domain/temporal-evolution";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

const TRIGGER_MIN_ELAPSED_HOURS: Record<TemporalEvolutionTriggerKind, number> = {
  scene_generation_elapsed_interval: 6,
  conversation_reentry_elapsed_interval: 6,
  explicit_state_refresh_elapsed_interval: 3,
  author_debug_temporal_inspection: 1,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function resolveElapsedIntervalHours(trigger: TemporalEvolutionTrigger): number {
  if (trigger.elapsedIntervalHours != null && Number.isFinite(trigger.elapsedIntervalHours)) {
    return Math.max(0, trigger.elapsedIntervalHours);
  }
  if (!trigger.lastAppliedAtIso) return 0;
  const occurredAt = Date.parse(trigger.occurredAtIso);
  const lastAppliedAt = Date.parse(trigger.lastAppliedAtIso);
  if (!Number.isFinite(occurredAt) || !Number.isFinite(lastAppliedAt)) return 0;
  const deltaMs = Math.max(0, occurredAt - lastAppliedAt);
  return deltaMs / (1000 * 60 * 60);
}

function griefStageFromDays(unresolvedGriefDays: number): TemporalEvolutionGriefStage {
  if (unresolvedGriefDays >= 90) return "hardened";
  if (unresolvedGriefDays >= 30) return "latent";
  if (unresolvedGriefDays >= 1) return "acute";
  return "none";
}

function roleShiftFromInput(input: {
  lifeStageShift: TemporalEvolutionRoleShiftType;
  roleBurdenShift: TemporalEvolutionRoleShiftType;
  pressureScarcity: number;
}): TemporalEvolutionRoleShiftType {
  if (input.lifeStageShift !== "none") return input.lifeStageShift;
  if (input.roleBurdenShift !== "none") return input.roleBurdenShift;
  if (input.pressureScarcity >= 70) return "prolonged_scarcity_burden";
  return "none";
}

function assertTemporalBoundary(input: {
  channel: "canonical_dyad" | "reader_bond_dyad";
  mode: EmotionalContinuityMode;
}): void {
  const source = input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory";
  const target = input.channel === "canonical_dyad" ? "character_bounded_knowledge" : "reader_interaction_memory";
  assertMemoryBoundary({
    source,
    target,
    payload: {
      temporalEvolution: true,
      channel: input.channel,
      mode: input.mode,
    },
  });
}

function assertTemporalInputShape(input: TemporalEvolutionInput): void {
  if (input.channel !== "canonical_dyad" && input.channel !== "reader_bond_dyad") {
    throw new Error("[temporal-evolution] Unsupported channel.");
  }
  if (input.mode !== "scene_mode" && input.mode !== "interaction_mode") {
    throw new Error("[temporal-evolution] Unsupported mode.");
  }
}

export function shouldApplyTemporalEvolution(trigger: TemporalEvolutionTrigger): {
  apply: boolean;
  elapsedIntervalHours: number;
  reasonCode: string;
} {
  const elapsedIntervalHours = resolveElapsedIntervalHours(trigger);
  const minElapsed = TRIGGER_MIN_ELAPSED_HOURS[trigger.triggerKind];
  if (elapsedIntervalHours < minElapsed) {
    return {
      apply: false,
      elapsedIntervalHours,
      reasonCode: "elapsed_interval_below_threshold",
    };
  }
  return {
    apply: true,
    elapsedIntervalHours,
    reasonCode: "elapsed_interval_threshold_met",
  };
}

export function deriveTemporalEvolutionSummary(input: TemporalEvolutionInput): TemporalEvolutionSummary {
  assertTemporalInputShape(input);
  assertTemporalBoundary({
    channel: input.channel,
    mode: input.mode,
  });
  const application = shouldApplyTemporalEvolution(input.trigger);
  const social = clamp(input.pressure.repeatedSocialPressure, 0, 100);
  const scarcity = clamp(input.pressure.repeatedScarcityPressure, 0, 100);
  const conflict = clamp(input.pressure.repeatedConflictPressure, 0, 100);
  const griefPressure = clamp(input.pressure.repeatedGriefPressure, 0, 100);
  const griefStage = griefStageFromDays(clamp(input.unresolvedDurations.unresolvedGriefDays, 0, 5000));
  const roleShift = roleShiftFromInput({
    lifeStageShift: input.roleShift.lifeStageShift,
    roleBurdenShift: input.roleShift.roleBurdenShift,
    pressureScarcity: scarcity,
  });

  if (!application.apply) {
    return {
      contractVersion: TEMPORAL_EVOLUTION_CONTRACT_VERSION,
      channel: input.channel,
      mode: input.mode,
      triggerKind: input.trigger.triggerKind,
      applied: false,
      elapsedIntervalHours: application.elapsedIntervalHours,
      griefDurationStage: griefStage,
      roleShift,
      repeatedPressureFactors: {
        social,
        scarcity,
        conflict,
        grief: griefPressure,
      },
      relationshipBaselineDrift: {
        trustBaselineDelta: 0,
        fearHardeningDelta: 0,
        dependenceAutonomyDelta: 0,
        dutyBurdenDelta: 0,
        stabilityDelta: 0,
      },
      memorySalienceDrift: [],
      emotionalContinuityModifiers: {
        affectDelta: 0,
        volatilityDelta: 0,
        guardednessDelta: 0,
        opennessDelta: 0,
        avoidanceDelta: 0,
      },
      behaviorTendencySummary: {
        conflictReadinessDelta: 0,
        conflictAvoidanceDelta: 0,
        dutyRigidityDelta: 0,
        trustApproachDelta: 0,
      },
      reasonCodes: [application.reasonCode],
    };
  }

  const hoursFactor = Math.min(1, application.elapsedIntervalHours / 72);
  const trustDelta = clamp(
    -((conflict * 0.05 + social * 0.03 + griefPressure * 0.02) * hoursFactor),
    -12,
    4
  );
  const fearHardeningDelta = clamp(
    (griefPressure * 0.06 + scarcity * 0.05 + conflict * 0.05) * hoursFactor,
    -4,
    12
  );
  const dependenceAutonomyDelta = clamp(
    (scarcity * 0.05 - conflict * 0.02) * hoursFactor,
    -10,
    10
  );
  const dutyBurdenDelta = clamp((scarcity * 0.06 + social * 0.03) * hoursFactor, -4, 12);
  const stabilityDelta = clamp(
    -((conflict * 0.05 + griefPressure * 0.03 + social * 0.02) * hoursFactor),
    -12,
    4
  );

  let griefDrift = 0;
  if (griefStage === "acute") griefDrift = 4;
  if (griefStage === "latent") griefDrift = 6;
  if (griefStage === "hardened") griefDrift = 9;

  if (roleShift === "youth_to_elder_authority") {
    // Role ascension increases perceived duty rigidity while reducing openness.
    griefDrift += 1;
  }
  if (roleShift === "prolonged_scarcity_burden") {
    griefDrift += 2;
  }

  const memoryModePenalty =
    input.memory.dominantActivationMode === "defensive_avoidance"
      ? 6
      : input.memory.dominantActivationMode === "repetitive_fixation"
        ? 5
        : input.memory.dominantActivationMode === "misattributed_association"
          ? 4
          : 0;

  const salienceDrift = input.consequenceMemorySalience
    .slice(0, 12)
    .map((entry) => {
      const salienceDelta = clamp((entry.salienceWeight * 0.12 + griefDrift - memoryModePenalty) * hoursFactor, -20, 20);
      return {
        sourceConsequenceId: entry.consequenceId,
        salienceDelta,
      };
    });

  const affectDelta = clamp((griefPressure * 0.06 + conflict * 0.05 + input.memory.highestActivationWeight * 0.03) * hoursFactor, -10, 14);
  const volatilityDelta = clamp((conflict * 0.07 + griefPressure * 0.05 + social * 0.03) * hoursFactor, -10, 14);
  const guardednessDelta = clamp((social * 0.06 + conflict * 0.04 + memoryModePenalty) * hoursFactor, -10, 14);
  const opennessDelta = clamp(-(social * 0.04 + conflict * 0.04 + memoryModePenalty * 0.6) * hoursFactor, -14, 8);
  const avoidanceDelta = clamp((griefPressure * 0.05 + conflict * 0.04 + memoryModePenalty) * hoursFactor, -10, 14);

  const conflictReadinessDelta = clamp((conflict * 0.05 + social * 0.03) * hoursFactor, -8, 10);
  const conflictAvoidanceDelta = clamp((griefPressure * 0.05 + memoryModePenalty) * hoursFactor, -8, 10);
  const dutyRigidityDelta = clamp((scarcity * 0.06 + social * 0.02 + (roleShift === "youth_to_elder_authority" ? 6 : 0)) * hoursFactor, -8, 12);
  const trustApproachDelta = clamp(
    -((conflict * 0.05 + social * 0.04 + griefDrift) * hoursFactor),
    -12,
    6
  );

  const reasonCodes = [
    application.reasonCode,
    `trigger:${input.trigger.triggerKind}`,
    `grief_stage:${griefStage}`,
    roleShift !== "none" ? `role_shift:${roleShift}` : "role_shift:none",
    scarcity >= 60 ? "pressure:scarcity_high" : null,
    social >= 60 ? "pressure:social_high" : null,
    conflict >= 60 ? "pressure:conflict_high" : null,
    input.memory.dominantActivationMode ? `memory_mode:${input.memory.dominantActivationMode}` : null,
  ].filter((code): code is string => Boolean(code));

  return {
    contractVersion: TEMPORAL_EVOLUTION_CONTRACT_VERSION,
    channel: input.channel,
    mode: input.mode,
    triggerKind: input.trigger.triggerKind,
    applied: true,
    elapsedIntervalHours: application.elapsedIntervalHours,
    griefDurationStage: griefStage,
    roleShift,
    repeatedPressureFactors: {
      social,
      scarcity,
      conflict,
      grief: griefPressure,
    },
    relationshipBaselineDrift: {
      trustBaselineDelta: trustDelta,
      fearHardeningDelta,
      dependenceAutonomyDelta,
      dutyBurdenDelta,
      stabilityDelta,
    },
    memorySalienceDrift: salienceDrift,
    emotionalContinuityModifiers: {
      affectDelta,
      volatilityDelta,
      guardednessDelta,
      opennessDelta,
      avoidanceDelta,
    },
    behaviorTendencySummary: {
      conflictReadinessDelta,
      conflictAvoidanceDelta,
      dutyRigidityDelta,
      trustApproachDelta,
    },
    reasonCodes: reasonCodes.slice(0, 10),
  };
}
