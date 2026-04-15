/**
 * Phase 2 / Chunk 7 — Emergence Orchestrator Integration (bounded).
 */
import {
  NARRATIVE_EMERGENCE_BUNDLE_CONTRACT_VERSION,
  type EmergenceChannel,
  type EmergenceMode,
  type NarrativeEmergenceBundle,
  type NarrativeEmergenceInputSurface,
} from "@/lib/domain/narrative-emergence-bundle";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { assembleStorylineGuidanceBundle } from "@/lib/services/storyline-orchestrator-integration-service";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function assertModeRestrictions(input: {
  mode: EmergenceMode;
  channel: EmergenceChannel;
  surfaces: NarrativeEmergenceInputSurface;
}): void {
  if (input.mode === "scene_mode" && input.channel !== "canonical_dyad") {
    throw new Error("[emergence-orchestrator] scene_mode requires canonical_dyad channel.");
  }
  const memory = input.surfaces.memoryActivation;
  if (
    input.channel === "canonical_dyad" &&
    memory?.activatedMemories.some((entry) => entry.sourceType === "reader_interaction_memory")
  ) {
    throw new Error(
      "[emergence-orchestrator] canonical channel cannot consume reader_interaction_memory activations."
    );
  }
}

function assertTruthBoundary(input: {
  mode: EmergenceMode;
  channel: EmergenceChannel;
}): void {
  const source = input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory";
  const target = "character_bounded_knowledge";
  assertMemoryBoundary({
    source,
    target,
    payload: {
      emergenceBundleMode: input.mode,
      emergenceBundleChannel: input.channel,
    },
  });
}

export function buildNarrativeEmergenceBundle(input: {
  mode: EmergenceMode;
  channel: EmergenceChannel;
  surfaces: NarrativeEmergenceInputSurface;
  includeDebugExplanation?: boolean;
}): NarrativeEmergenceBundle {
  assertModeRestrictions({
    mode: input.mode,
    channel: input.channel,
    surfaces: input.surfaces,
  });
  assertTruthBoundary({
    mode: input.mode,
    channel: input.channel,
  });

  const consequence = input.surfaces.consequenceOutput;
  const memory = input.surfaces.memoryActivation;
  const emotional = input.surfaces.emotionalContinuity;
  const temporal = input.surfaces.temporalEvolution;
  const relationshipTensionSignals = input.surfaces.relationshipTensionSignals ?? [];
  const storylineOrchestration = input.surfaces.storylineOrchestration ?? null;

  const relationshipPressures: NarrativeEmergenceBundle["relationshipPressures"] = [];
  if (consequence) {
    for (const modifier of consequence.relationshipPressureModifiers) {
      relationshipPressures.push({
        pressureCode: modifier.target,
        weight: clamp0to100(modifier.totalModifier),
      });
    }
  }
  for (const signal of relationshipTensionSignals.slice(0, 4)) {
    relationshipPressures.push({
      pressureCode: `relationship_signal:${signal}`,
      weight: 40,
    });
  }

  const activeConsequenceSummaries =
    consequence?.activeConsequenceSummary.slice(0, 8).map((entry) => ({
      consequenceId: entry.consequenceId,
      category: entry.category,
      severity: entry.severity,
      lifecycleState: entry.lifecycleState,
    })) ?? [];

  const activatedMemorySummaries =
    memory?.activatedMemories.slice(0, 8).map((entry) => ({
      memoryRefId: entry.memoryRefId,
      activationMode: entry.activationMode,
      activationWeight: entry.activationWeight,
      disclosureRisk: entry.disclosureRisk,
      distortionLikelihood: entry.distortionLikelihood,
    })) ?? [];

  const temporalModifiers = temporal
    ? {
        applied: temporal.applied,
        elapsedIntervalHours: temporal.elapsedIntervalHours,
        griefDurationStage: temporal.griefDurationStage,
        roleShift: temporal.roleShift,
        relationshipBaselineDeltaMagnitude: clamp0to100(
          Math.abs(temporal.relationshipBaselineDrift.trustBaselineDelta) +
            Math.abs(temporal.relationshipBaselineDrift.fearHardeningDelta) +
            Math.abs(temporal.relationshipBaselineDrift.stabilityDelta)
        ),
        memorySalienceDeltaMagnitude: clamp0to100(
          temporal.memorySalienceDrift.reduce((acc, entry) => acc + Math.abs(entry.salienceDelta), 0)
        ),
      }
    : null;

  const emotionalContinuityModifiers = emotional
    ? {
        currentAffectPressure: emotional.pressureState.currentAffectPressure,
        volatilityPressure: emotional.pressureState.volatilityPressure,
        guardednessPressure: emotional.pressureState.guardednessPressure,
        opennessPressure: emotional.pressureState.opennessPressure,
        avoidancePressure: emotional.pressureState.avoidancePressure,
      }
    : null;

  const guardedness = emotional?.pressureState.guardednessPressure ?? 35;
  const openness = emotional?.pressureState.opennessPressure ?? 35;
  const avoidance = emotional?.pressureState.avoidancePressure ?? 25;
  const conflictPressure = clamp0to100(
    (emotional?.pressureState.conflictReadinessPressure ?? 20) +
      (temporal?.behaviorTendencySummary.conflictReadinessDelta ?? 0)
  );
  const reconciliationPressure = clamp0to100(100 - guardedness + (temporal ? 6 : 0));

  const behavioralConstraints = [
    guardedness >= 60 ? "avoid_vulnerable_disclosure" : null,
    avoidance >= 60 ? "deprioritize_high_risk_confrontation" : null,
    conflictPressure >= 65 ? "prepare_conflict_response" : null,
    activeConsequenceSummaries.some((entry) => entry.severity === "high")
      ? "respect_high_severity_active_consequence"
      : null,
    temporal?.griefDurationStage === "hardened" ? "maintain_hardened_grief_baseline" : null,
  ].filter((entry): entry is string => Boolean(entry));

  const disclosurePressure = clamp0to100(guardedness + avoidance - openness);
  const disclosureTendency: NarrativeEmergenceBundle["disclosureTendencies"]["tendency"] =
    disclosurePressure >= 70 ? "withhold" : disclosurePressure >= 40 ? "guarded_disclose" : "open_disclose";

  const reasonCodes = [
    `mode:${input.mode}`,
    `channel:${input.channel}`,
    consequence ? `active_consequences:${activeConsequenceSummaries.length}` : null,
    memory ? `activated_memories:${activatedMemorySummaries.length}` : null,
    temporal ? `temporal_applied:${temporal.applied}` : null,
    emotional ? "emotional_continuity_integrated" : null,
  ].filter((entry): entry is string => Boolean(entry));

  const debugExplanation = input.includeDebugExplanation
    ? {
        engineInputsUsed: [
          consequence ? "consequence_output" : null,
          memory ? "memory_activation" : null,
          emotional ? "emotional_continuity" : null,
          temporal ? "temporal_evolution" : null,
          relationshipTensionSignals.length > 0 ? "relationship_tension_signals" : null,
        ].filter((entry): entry is string => Boolean(entry)),
        factorContributions: [
          `guardedness:${guardedness}`,
          `openness:${openness}`,
          `avoidance:${avoidance}`,
          `conflictPressure:${conflictPressure}`,
          temporal ? `temporalRoleShift:${temporal.roleShift}` : "temporalRoleShift:none",
        ],
      }
    : undefined;

  const storylineGuidance = storylineOrchestration
    ? assembleStorylineGuidanceBundle({
        mode: input.mode,
        channel: input.channel,
        orchestration: storylineOrchestration,
        includeDebugExplanation: input.includeDebugExplanation,
      })
    : undefined;

  return {
    contractVersion: NARRATIVE_EMERGENCE_BUNDLE_CONTRACT_VERSION,
    mode: input.mode,
    channel: input.channel,
    relationshipPressures: relationshipPressures.slice(0, 10),
    activeConsequenceSummaries,
    activatedMemorySummaries,
    temporalModifiers,
    emotionalContinuityModifiers,
    behavioralConstraints: behavioralConstraints.slice(0, 8),
    disclosureTendencies: {
      tendency: disclosureTendency,
      pressure: disclosurePressure,
    },
    conflictReconciliationPressures: {
      conflictPressure,
      reconciliationPressure,
      avoidancePressure: avoidance,
    },
    explainability: {
      reasonCodes: reasonCodes.slice(0, 10),
    },
    ...(storylineGuidance ? { storylineGuidance } : {}),
    ...(debugExplanation ? { debugExplanation } : {}),
  };
}
