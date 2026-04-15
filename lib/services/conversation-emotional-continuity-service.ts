/**
 * P3-O — Deterministic emotional continuity for bounded character conversations.
 */
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import type {
  ConversationEmotionalContinuity,
  EmotionalContinuityChannel,
  EmotionalContinuityMode,
  EmotionalContinuityPressureState,
  EmotionalContinuityStructuralInputs,
} from "@/lib/domain/conversation-emotional-continuity";
import type { ConsequenceSeverity } from "@/lib/domain/consequence-engine";
import type { SessionMemorySummary } from "@/lib/domain/session-memory-summary";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeTone(raw: string | null | undefined): string | null {
  const t = raw?.trim().toLowerCase();
  return t ? t : null;
}

function baselineFromSnapshot(snapshot: ConversationalIdentitySnapshot): string {
  const cog = snapshot.emotionalState.latestCognitionSnapshot;
  const leg = snapshot.emotionalState.latestLegacyCharacterState;
  if (cog?.currentArousal != null && cog.currentArousal >= 70) return "charged";
  if (cog?.currentFear?.trim()) return "anxious";
  if (cog?.currentHope?.trim()) return "hopeful";
  if (leg?.fearLevel != null && leg.fearLevel >= 65) return "wary";
  if (leg?.emotionalBaseline?.trim()) return normalizeTone(leg.emotionalBaseline) ?? "neutral";
  return "neutral";
}

function deriveCurrentTone(input: {
  baselineTone: string;
  recentCharacterTones: string[];
  sessionMemorySummary: SessionMemorySummary | null;
}): string {
  const lastRecent = input.recentCharacterTones
    .map((v) => normalizeTone(v))
    .filter((v): v is string => Boolean(v))
    .at(-1);
  if (lastRecent) return lastRecent;
  const fromSummary = normalizeTone(input.sessionMemorySummary?.emotionalBeatSummary);
  if (fromSummary) return fromSummary.split("->").at(-1)?.trim() ?? input.baselineTone;
  return input.baselineTone;
}

function buildCarryoverSignals(input: {
  snapshot: ConversationalIdentitySnapshot;
  sessionMemorySummary: SessionMemorySummary | null;
  recentCharacterTones: string[];
  structuralInputs: EmotionalContinuityStructuralInputs | null;
}): string[] {
  const out: string[] = [];
  const fear = input.snapshot.emotionalState.latestCognitionSnapshot?.currentFear;
  if (fear?.trim()) out.push(`fear:${fear.trim()}`);
  if ((input.snapshot.emotionalState.latestLegacyCharacterState?.fearLevel ?? 0) >= 65) {
    out.push("legacy_fear_high");
  }
  const trustSummary = input.sessionMemorySummary?.trustMovementSummary?.trim();
  if (trustSummary) out.push(`trust:${trustSummary}`);
  const unresolvedCount = input.sessionMemorySummary?.unresolvedTopics.length ?? 0;
  if (unresolvedCount > 0) out.push(`unresolved_topics:${unresolvedCount}`);
  if (input.recentCharacterTones.length > 1) out.push("recent_tone_history_present");
  const relSignals = input.structuralInputs?.relationshipProgression?.signals;
  if (relSignals) {
    out.push(`rel_trend:${relSignals.trend}`);
    out.push(`rel_rupture:${relSignals.ruptureRisk}`);
  }
  const activeConsequences = input.structuralInputs?.consequenceOutput?.output.activeConsequenceSummary.length ?? 0;
  if (activeConsequences > 0) {
    out.push(`active_consequences:${activeConsequences}`);
  }
  const activatedMemories = input.structuralInputs?.memoryActivation?.activationCount ?? 0;
  if (activatedMemories > 0) {
    out.push(`activated_memories:${activatedMemories}`);
  }
  return out.slice(0, 6);
}

function buildContinuityWarnings(input: {
  baselineTone: string;
  currentConversationTone: string;
  sessionMemorySummary: SessionMemorySummary | null;
  recentCharacterTones: string[];
  structuralInputs: EmotionalContinuityStructuralInputs | null;
}): string[] {
  const warnings: string[] = [];
  const lastTwo = input.recentCharacterTones
    .map((v) => normalizeTone(v))
    .filter((v): v is string => Boolean(v))
    .slice(-2);
  if (lastTwo.length === 2 && lastTwo[0] !== lastTwo[1]) {
    const unresolved = input.sessionMemorySummary?.unresolvedTopics.length ?? 0;
    if (unresolved > 0) {
      warnings.push("tone_shift_with_unresolved_topics");
    }
  }

  if (input.baselineTone !== "neutral" && input.currentConversationTone === "joyful") {
    warnings.push("abrupt_reset_against_baseline");
  }
  if (input.structuralInputs?.memoryActivation?.dominantActivationMode === "misattributed_association") {
    warnings.push("distortion_prone_activation");
  }
  if ((input.structuralInputs?.consequenceOutput?.output.activeConsequenceSummary.length ?? 0) >= 4) {
    warnings.push("high_active_consequence_load");
  }
  return warnings.slice(0, 4);
}

function ensureModeBoundaries(input: {
  channel: EmotionalContinuityChannel;
  mode: EmotionalContinuityMode;
  structuralInputs: EmotionalContinuityStructuralInputs | null;
}): void {
  const structuralInputs = input.structuralInputs;
  if (!structuralInputs) return;

  const relationship = structuralInputs.relationshipProgression;
  if (relationship && relationship.channel !== input.channel) {
    throw new Error("[conversation-emotional-continuity] relationship progression channel mismatch.");
  }
  const consequence = structuralInputs.consequenceOutput;
  if (consequence && consequence.channel !== input.channel) {
    throw new Error("[conversation-emotional-continuity] consequence channel mismatch.");
  }
  const memoryActivation = structuralInputs.memoryActivation;
  if (memoryActivation) {
    if (memoryActivation.channel !== input.channel) {
      throw new Error("[conversation-emotional-continuity] memory activation channel mismatch.");
    }
    if (memoryActivation.context !== input.mode) {
      throw new Error("[conversation-emotional-continuity] memory activation mode mismatch.");
    }
    if (
      input.channel === "canonical_dyad" &&
      memoryActivation.activatedMemories.some((memory) => memory.sourceType === "reader_interaction_memory")
    ) {
      throw new Error(
        "[conversation-emotional-continuity] canonical continuity cannot consume reader_interaction_memory activations."
      );
    }
  }
}

function severityWeight(severity: ConsequenceSeverity): number {
  if (severity === "high") return 3;
  if (severity === "moderate") return 2;
  return 1;
}

function buildPressureState(input: {
  snapshot: ConversationalIdentitySnapshot;
  structuralInputs: EmotionalContinuityStructuralInputs | null;
}): EmotionalContinuityPressureState {
  let affect = 18;
  let volatility = 12;
  let guardedness = 20;
  let openness = 35;
  let grief = 4;
  let fear = 6;
  let resentment = 5;
  let conflictReadiness = 16;
  let avoidance = 14;
  const reasonCodes: string[] = [];

  const baseFear = input.snapshot.emotionalState.latestLegacyCharacterState?.fearLevel ?? 0;
  const baseTrust = input.snapshot.emotionalState.latestLegacyCharacterState?.trustLevel ?? 0;
  if (baseFear >= 65) {
    fear += 15;
    guardedness += 10;
    avoidance += 8;
    reasonCodes.push("legacy_fear_high");
  }
  if (baseTrust >= 65) {
    openness += 9;
    guardedness -= 5;
    reasonCodes.push("legacy_trust_high");
  }

  const relationship = input.structuralInputs?.relationshipProgression;
  if (relationship) {
    const signals = relationship.signals;
    const axes = relationship.axes;
    if (signals.trend === "unstable") {
      volatility += 20;
      affect += 9;
      reasonCodes.push("relationship_trend_unstable");
    } else if (signals.trend === "cooling") {
      guardedness += 9;
      resentment += 8;
      reasonCodes.push("relationship_trend_cooling");
    } else if (signals.trend === "warming") {
      openness += 12;
      guardedness -= 6;
      reasonCodes.push("relationship_trend_warming");
    }
    if (signals.ruptureRisk === "high") {
      guardedness += 20;
      fear += 15;
      avoidance += 12;
      conflictReadiness += 10;
      reasonCodes.push("relationship_rupture_high");
    } else if (signals.ruptureRisk === "elevated") {
      guardedness += 10;
      fear += 8;
      reasonCodes.push("relationship_rupture_elevated");
    }
    if (signals.disclosureLikelihoodShift === "decreasing") {
      guardedness += 10;
      openness -= 8;
      avoidance += 7;
      reasonCodes.push("relationship_disclosure_decreasing");
    } else if (signals.disclosureLikelihoodShift === "increasing") {
      openness += 8;
      guardedness -= 6;
      reasonCodes.push("relationship_disclosure_increasing");
    }
    if (signals.attachmentPressure === "high") {
      volatility += 10;
      affect += 8;
      reasonCodes.push("relationship_attachment_high");
    }
    if (signals.reconciliationAvailability === "closed") {
      resentment += 10;
      openness -= 10;
      conflictReadiness += 8;
      reasonCodes.push("relationship_reconciliation_closed");
    } else if (signals.reconciliationAvailability === "open") {
      openness += 10;
      conflictReadiness -= 6;
      reasonCodes.push("relationship_reconciliation_open");
    }
    fear += Math.round(clamp0to100(axes.fear) * 0.08);
    resentment += Math.round(clamp0to100(axes.resentment) * 0.09);
    openness += Math.round(clamp0to100(axes.trust) * 0.06);
    volatility += Math.round((100 - clamp0to100(axes.stability)) * 0.08);
  }

  const consequence = input.structuralInputs?.consequenceOutput?.output;
  if (consequence) {
    let consequenceWeight = 0;
    for (const active of consequence.activeConsequenceSummary) {
      const weight = severityWeight(active.severity);
      consequenceWeight += weight;
      affect += 4 * weight;
      volatility += 2 * weight;
      if (active.category === "bodily") {
        fear += 8 * weight;
        grief += 6 * weight;
        avoidance += 8 * weight;
        reasonCodes.push("consequence_bodily_carryover");
      }
      if (active.category === "social" || active.category === "reputational") {
        guardedness += 5 * weight;
        avoidance += 4 * weight;
        reasonCodes.push("consequence_social_exposure");
      }
      if (active.triggerEventType === "betrayal" || active.triggerEventType === "duty_broken") {
        resentment += 7 * weight;
        conflictReadiness += 4 * weight;
        reasonCodes.push("consequence_relational_breach");
      }
    }
    for (const pressure of consequence.relationshipPressureModifiers) {
      if (pressure.target === "social_risk_pressure") {
        guardedness += Math.round(pressure.totalModifier * 1.2);
        avoidance += Math.round(pressure.totalModifier);
      }
      if (pressure.target === "household_economic_pressure") {
        affect += Math.round(pressure.totalModifier * 0.8);
        volatility += Math.round(pressure.totalModifier * 0.6);
      }
    }
    for (const signal of consequence.futureConstraintSignals) {
      if (signal.signalCode === "avoid_public_exposure") {
        guardedness += 8;
        avoidance += 7;
      }
      if (signal.signalCode === "trust_repair_needed") {
        conflictReadiness += 7;
        resentment += 5;
      }
      if (signal.signalCode === "bodily_caution") {
        fear += 7;
        avoidance += 9;
      }
      if (signal.signalCode === "elevated_household_burden") {
        affect += 6;
        volatility += 5;
      }
    }
    if (consequenceWeight > 0) {
      reasonCodes.push("active_consequence_pressure");
    }
  }

  const memoryActivation = input.structuralInputs?.memoryActivation;
  if (memoryActivation) {
    affect += Math.round(memoryActivation.highestActivationWeight * 0.15);
    volatility += Math.round(memoryActivation.highestActivationWeight * 0.08);
    if (memoryActivation.dominantActivationMode === "defensive_avoidance") {
      guardedness += 16;
      avoidance += 16;
      openness -= 10;
      reasonCodes.push("memory_defensive_avoidance");
    } else if (memoryActivation.dominantActivationMode === "repetitive_fixation") {
      volatility += 12;
      resentment += 8;
      reasonCodes.push("memory_repetitive_fixation");
    } else if (memoryActivation.dominantActivationMode === "misattributed_association") {
      volatility += 14;
      guardedness += 10;
      reasonCodes.push("memory_misattributed_association");
    } else if (memoryActivation.dominantActivationMode === "clear_recall") {
      openness += 8;
      reasonCodes.push("memory_clear_recall");
    }
    for (const activated of memoryActivation.activatedMemories) {
      if (activated.emotionalColor === "charged") {
        affect += 4;
        volatility += 4;
      } else if (activated.emotionalColor === "tense") {
        affect += 2;
        volatility += 2;
      }
      if (activated.disclosureRisk === "high") {
        guardedness += 4;
        avoidance += 3;
      }
      if (activated.distortionLikelihood === "high") {
        volatility += 4;
      }
    }
    if (memoryActivation.blockedSourceRefs.length > 0) {
      reasonCodes.push("memory_source_restrictions_applied");
    }
  }

  return {
    currentAffectPressure: clamp0to100(affect),
    volatilityPressure: clamp0to100(volatility),
    guardednessPressure: clamp0to100(guardedness),
    opennessPressure: clamp0to100(openness),
    griefFearResentmentCarryover: {
      grief: clamp0to100(grief),
      fear: clamp0to100(fear),
      resentment: clamp0to100(resentment),
    },
    conflictReadinessPressure: clamp0to100(conflictReadiness),
    avoidancePressure: clamp0to100(avoidance),
    reasonCodes: [...new Set(reasonCodes)].slice(0, 10),
  };
}

export function deriveConversationEmotionalContinuity(input: {
  snapshot: ConversationalIdentitySnapshot;
  sessionMemorySummary?: SessionMemorySummary | null;
  recentCharacterTones?: string[];
  mode?: EmotionalContinuityMode;
  channel?: EmotionalContinuityChannel;
  structuralInputs?: EmotionalContinuityStructuralInputs | null;
}): ConversationEmotionalContinuity {
  const baselineTone = baselineFromSnapshot(input.snapshot);
  const sessionMemorySummary = input.sessionMemorySummary ?? null;
  const recentCharacterTones = input.recentCharacterTones ?? [];
  const mode = input.mode ?? "interaction_mode";
  const channel = input.channel ?? "canonical_dyad";
  const structuralInputs = input.structuralInputs ?? null;

  ensureModeBoundaries({
    channel,
    mode,
    structuralInputs,
  });
  const currentConversationTone = deriveCurrentTone({
    baselineTone,
    recentCharacterTones,
    sessionMemorySummary,
  });
  const pressureState = buildPressureState({
    snapshot: input.snapshot,
    structuralInputs,
  });
  return {
    baselineTone,
    currentConversationTone,
    carryoverSignals: buildCarryoverSignals({
      snapshot: input.snapshot,
      sessionMemorySummary,
      recentCharacterTones,
      structuralInputs,
    }),
    continuityWarnings: buildContinuityWarnings({
      baselineTone,
      currentConversationTone,
      sessionMemorySummary,
      recentCharacterTones,
      structuralInputs,
    }),
    channel,
    mode,
    pressureState,
  };
}
