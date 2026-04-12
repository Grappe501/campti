import type { CharacterPhysicalState, EmbodiedCognitionEffects } from "@/lib/domain/embodiment";
import type { ActiveDesireSignals, DesirePressureSummary } from "@/lib/domain/desire-cognition";
import type { EnneagramProfile, EnneagramStressShift } from "@/lib/domain/enneagram";
import type { CharacterAgeBand, WorldStateThoughtStyle } from "@/lib/domain/inner-voice";
import type {
  CognitiveDistortionKind,
  CognitiveDistortionProfile,
  InnerVoiceTextureProfile,
  ThoughtFragmentProfile,
} from "@/lib/domain/thought-realism";
import type { WorldStateDesireEnvironment } from "@/lib/domain/desire-cognition";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function scoreStress(stress: EnneagramStressShift): number {
  return stress.active ? clamp100(45 + stress.weight * 55) : 25;
}

/** World “belief / moral atmosphere” nudge for distortion (not output labels). */
function moralBeliefPressure(style: WorldStateThoughtStyle | null): number {
  if (!style?.dominantMoralCategories?.length) return 0;
  const joined = style.dominantMoralCategories.join(" ").toLowerCase();
  let n = 0;
  if (/\b(god|christ|church|prayer|covenant|scripture|omen|soul|heaven|damnation|sin|sabbath)\b/.test(joined)) {
    n += 20;
  }
  if (/\b(blood|kin|lineage|ancestor)\b/.test(joined)) n += 10;
  if (/\b(honor|shame|reputation)\b/.test(joined)) n += 8;
  return clamp100(n);
}

/**
 * Deterministic realism profiles from embodiment, desire pressure, fear, enneagram stress, world belief tone.
 * Does not mutate cognition stacks. Exported numerics are 0–1.
 */
export function buildThoughtRealismProfiles(input: {
  cognitionAgeBand: CharacterAgeBand | null;
  embodiedCognitionEffects: EmbodiedCognitionEffects;
  characterPhysicalState: CharacterPhysicalState;
  activeDesireSignals: ActiveDesireSignals;
  desirePressureSummary: DesirePressureSummary;
  worldDesire: WorldStateDesireEnvironment;
  enneagramProfile: EnneagramProfile;
  effectiveStressState: EnneagramStressShift;
  worldStyle: WorldStateThoughtStyle | null;
  /** 0–1 aggregate fear load from ranked fear stack (deterministic). */
  fearSalience: number;
}): {
  thoughtFragmentProfile: ThoughtFragmentProfile;
  cognitiveDistortionProfile: CognitiveDistortionProfile;
  innerVoiceTextureProfile: InnerVoiceTextureProfile;
} {
  const { embodiedCognitionEffects, characterPhysicalState, activeDesireSignals, worldDesire } = input;
  const band = input.cognitionAgeBand;

  const bodyStrain =
    (characterPhysicalState.painLevel +
      characterPhysicalState.fatigueLevel +
      characterPhysicalState.hungerLevel +
      characterPhysicalState.illnessLevel +
      characterPhysicalState.sensoryDisruptionLevel) /
    5;

  const urgency = embodiedCognitionEffects.urgencyAmplification;
  const focusNarrow = embodiedCognitionEffects.focusNarrowing;
  const impulse = embodiedCognitionEffects.impulseIncrease;
  const volatility = embodiedCognitionEffects.emotionalVolatilityShift;

  const desirePressureMix = clamp01(
    (activeDesireSignals.forbiddenPressure * 0.42 +
      activeDesireSignals.relief * 0.28 +
      activeDesireSignals.attachmentAche * 0.3 +
      activeDesireSignals.erotic * 0.22) /
      1.22
  );

  let fragmentation = 38 + bodyStrain * 0.35 + urgency * 42 + focusNarrow * 28 + desirePressureMix * 26;
  let interruption = 32 + urgency * 48 + impulse * 35 + Math.max(0, volatility) * 40 + desirePressureMix * 18;
  let repetition = 28 + Math.abs(volatility) * 25 + (band === "ADOLESCENT" ? 12 : 0);
  let coherence = 72 - bodyStrain * 0.28 - urgency * 38 - focusNarrow * 22 - desirePressureMix * 14;
  let emotionalIntrusion =
    40 + activeDesireSignals.forbiddenPressure * 55 + urgency * 30 + Math.max(0, volatility) * 35;

  if (input.effectiveStressState.active) {
    const sw = input.effectiveStressState.weight;
    fragmentation = clamp100(fragmentation + 6 + sw * 20);
    interruption = clamp100(interruption + 4 + sw * 14);
    coherence = clamp100(coherence - 5 - sw * 12);
  }

  if (band === "EARLY_CHILD" || band === "LATE_CHILD") {
    coherence = clamp100(coherence - 12);
    repetition = clamp100(repetition + 14);
    fragmentation = clamp100(fragmentation - 8);
  } else if (band === "ADOLESCENT") {
    emotionalIntrusion = clamp100(emotionalIntrusion + 12);
    fragmentation = clamp100(fragmentation + 10);
  } else if (band === "ELDER") {
    coherence = clamp100(coherence + 8);
    interruption = clamp100(interruption - 6);
  }

  fragmentation = clamp100(fragmentation);
  interruption = clamp100(interruption);
  repetition = clamp100(repetition);
  coherence = clamp100(coherence);
  emotionalIntrusion = clamp100(emotionalIntrusion);

  const thoughtFragmentProfile: ThoughtFragmentProfile = {
    fragmentationLevel: clamp01(fragmentation / 100),
    interruptionRate: clamp01(interruption / 100),
    repetitionTendency: clamp01(repetition / 100),
    coherenceLevel: clamp01(coherence / 100),
    emotionalIntrusionRate: clamp01(emotionalIntrusion / 100),
  };

  const supernatural = input.worldStyle?.supernaturalSalience ?? 40;
  const lawSalience = input.worldStyle?.lawPunishmentSalience ?? 40;
  const honor = input.worldStyle?.honorShameSalience ?? 45;
  const beliefPush = moralBeliefPressure(input.worldStyle);

  const fearS = Math.min(1, Math.max(0, input.fearSalience));
  const emo01 = emotionalIntrusion / 100;

  const conf = input.desirePressureSummary.conflictSnapshot;
  const suppressedN = conf.suppressedWant.length;
  const misrecognizedN = conf.misrecognizedWant.length;

  const distortionScores: Record<CognitiveDistortionKind, number> = {
    exaggeration: 22 + emo01 * 35 + fearS * 55,
    minimization: 20 + (1 - urgency) * 25 + coherence * 0.15,
    rationalization: 28 + scoreStress(input.effectiveStressState) * 0.35 + suppressedN * 6 + misrecognizedN * 5,
    projection: 24 + honor * 0.35 + activeDesireSignals.attachmentAche * 40 + suppressedN * 4,
    fatalism: 18 + lawSalience * 0.3 + activeDesireSignals.forbiddenPressure * 35 + beliefPush * 0.25,
    magical_thinking:
      15 + supernatural * 0.45 + (band === "EARLY_CHILD" || band === "LATE_CHILD" ? 18 : 0) + beliefPush * 0.35,
    catastrophizing: 22 + fearS * 58 + bodyStrain * 0.2,
    black_white_split: 18 + scoreStress(input.effectiveStressState) * 0.25 + honor * 0.2,
  };

  const type = input.enneagramProfile.primaryType;
  if (type === "SIX") {
    distortionScores.projection += 12;
    distortionScores.catastrophizing += 10;
  } else if (type === "FOUR") {
    distortionScores.exaggeration += 14;
    distortionScores.fatalism += 8;
  } else if (type === "SEVEN") {
    distortionScores.minimization += 14;
    distortionScores.rationalization += 8;
  } else if (type === "ONE") {
    distortionScores.black_white_split += 12;
    distortionScores.rationalization += 10;
  } else if (type === "NINE") {
    distortionScores.minimization += 10;
    distortionScores.rationalization += 6;
  }

  const sorted = (Object.keys(distortionScores) as CognitiveDistortionKind[]).sort(
    (a, b) => distortionScores[b] - distortionScores[a]
  );
  const dominantDistortion = sorted[0]!;
  const topTypes = sorted.slice(0, 4).filter((k) => distortionScores[k] > 28);

  const meanRaw =
    topTypes.reduce((s, k) => s + Math.min(100, distortionScores[k]), 0) / Math.max(1, topTypes.length);
  const distortionIntensity = clamp01(meanRaw / 100);

  const cognitiveDistortionProfile: CognitiveDistortionProfile = {
    distortionTypes: topTypes.length ? topTypes : [dominantDistortion],
    distortionIntensity,
    dominantDistortion,
    distortionSummary: [
      `Dominant warp: ${dominantDistortion} (intensity ${distortionIntensity.toFixed(2)}).`,
      `Active lenses: ${topTypes.join(", ")}.`,
      `World belief tone (honor/law/supernatural/blood-kins): honor ${honor}, law ${lawSalience}, supernatural ${supernatural}, moral-category push ${beliefPush}.`,
      `Desire conflict load: suppressed ${suppressedN}, misrecognized ${misrecognizedN}; forbidden ${(activeDesireSignals.forbiddenPressure * 100).toFixed(0)}, attachment ache ${(activeDesireSignals.attachmentAche * 100).toFixed(0)}.`,
    ].join(" "),
  };

  const sensoryIntrusion = clamp100(
    35 + characterPhysicalState.sensoryDisruptionLevel * 0.45 + bodyStrain * 0.25 + focusNarrow * 35
  );
  const displacedN = input.desirePressureSummary.conflictSnapshot.displacedWant.length;
  const memoryIntrusion = clamp100(
    28 + repetition * 0.35 + emotionalIntrusion * 0.25 + displacedN * 5
  );
  const desireIntrusion = clamp100(
    38 + activeDesireSignals.erotic * 40 + activeDesireSignals.belonging * 35 + activeDesireSignals.needToBeNeeded * 30
  );
  const tabooLeak = clamp100(
    22 +
      worldDesire.visibilityRiskForDesire * 0.22 +
      worldDesire.punishmentSeverityForForbiddenDesire * 0.18 +
      activeDesireSignals.forbiddenPressure * 45
  );
  const rhythmVariation = clamp100(
    40 + fragmentation * 0.35 + interruption * 0.3 + (100 - coherence) * 0.25
  );

  const innerVoiceTextureProfile: InnerVoiceTextureProfile = {
    rhythmVariation: clamp01(rhythmVariation / 100),
    sensoryIntrusionRate: clamp01(sensoryIntrusion / 100),
    memoryIntrusionRate: clamp01(memoryIntrusion / 100),
    desireIntrusionRate: clamp01(desireIntrusion / 100),
    tabooLeakRate: clamp01(tabooLeak / 100),
  };

  return {
    thoughtFragmentProfile,
    cognitiveDistortionProfile,
    innerVoiceTextureProfile,
  };
}
