import type { CharacterProfile } from "@prisma/client";

import type { CharacterCore, ResolvedCognitionLayer } from "@/lib/domain/cognition";
import type {
  BaselineIntegrationLevel,
  EnneagramArchetype,
  EnneagramGrowthShift,
  EnneagramInnerVoicePattern,
  EnneagramProfile,
  EnneagramStressShift,
} from "@/lib/domain/enneagram";
import type { CharacterAgeBand, WorldStateThoughtStyle } from "@/lib/domain/inner-voice";

import {
  getInstinctStackingCognitionDeltas,
  type InstinctStackingCognition,
} from "@/lib/enneagram/instinct-stacking";
import {
  getNineTypeKnowledge,
  growthLineTarget,
  NINE_TYPE_KNOWLEDGE,
  stressLineTarget,
} from "@/lib/enneagram/nine-type-knowledge";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function nonEmpty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function isArchetype(s: unknown): s is EnneagramArchetype {
  return typeof s === "string" && s in NINE_TYPE_KNOWLEDGE;
}

/** Map Prisma / JSON enum string to archetype. */
export function toEnneagramArchetype(v: unknown): EnneagramArchetype | null {
  return isArchetype(v) ? v : null;
}

/** Defaults when author leaves `harmDefenseStyle` / `imageStrategy` blank on core. */
const HARM_IMAGE_DEFAULTS: Record<
  EnneagramArchetype,
  { harmDefense: string; imageStrategy: string }
> = {
  ONE: {
    harmDefense: "moral rigidity; harsh self-punishment to preempt external judgment",
    imageStrategy: "the good worker, the upright one, the reformer",
  },
  TWO: {
    harmDefense: "seduction through need-meeting; guilt induction when unappreciated",
    imageStrategy: "the indispensable helper, the heart of the house",
  },
  THREE: {
    harmDefense: "charm, selective disclosure, reframing failure as timing",
    imageStrategy: "the winner, the competent one, the face that fits",
  },
  FOUR: {
    harmDefense: "withdrawal into mood; aesthetic superiority as shield",
    imageStrategy: "the true artist, the one who feels what others cannot",
  },
  FIVE: {
    harmDefense: "intellectual distance; secrecy; minimal exposure",
    imageStrategy: "the expert, the unseen mind, the one who understands",
  },
  SIX: {
    harmDefense: "alliance-seeking; compliance; preemptive suspicion",
    imageStrategy: "the loyal one, the sensible one, the tested member",
  },
  SEVEN: {
    harmDefense: "humor, new plans, reframing pain as temporary glitch",
    imageStrategy: "the fortunate one, the free spirit, the one who won’t be trapped",
  },
  EIGHT: {
    harmDefense: "intimidation, pre-emptive strike, controlling resources",
    imageStrategy: "the protector, the plain speaker, the one you don’t cross",
  },
  NINE: {
    harmDefense: "stubborn passivity; forgetting; merging with stronger wills",
    imageStrategy: "the easy one, the harmonizer, the nobody’s enemy",
  },
};

/**
 * Merge `CharacterCoreProfile` Enneagram fields with literary profile fallbacks and nine-type defaults.
 */
export function buildEnneagramProfileFromCore(
  core: CharacterCore | null,
  literaryProfile: CharacterProfile | null
): EnneagramProfile {
  const primary =
    toEnneagramArchetype(core?.enneagramType) ??
    toEnneagramArchetype(literaryProfile?.enneagramType) ??
    null;

  const k = getNineTypeKnowledge(primary);

  const coreFear =
    nonEmpty(core?.coreFear) ??
    (k ? k.coreFearDefault : null) ??
    nonEmpty(literaryProfile?.coreFear) ??
    "";
  const coreDesire =
    nonEmpty(core?.coreDesire) ??
    (k ? k.coreDesireDefault : null) ??
    nonEmpty(literaryProfile?.coreLonging) ??
    "";
  const vice =
    nonEmpty(core?.vice) ??
    (k ? k.viceDefault : null) ??
    nonEmpty(literaryProfile?.defensiveStyle) ??
    "";
  const virtue =
    nonEmpty(core?.virtue) ??
    (k ? k.virtueDefault : null) ??
    nonEmpty(literaryProfile?.growthPattern) ??
    "";

  const hasExplicit =
    Boolean(nonEmpty(core?.coreFear) || nonEmpty(core?.coreDesire) || nonEmpty(core?.vice) || nonEmpty(core?.virtue));

  const hi = primary ? HARM_IMAGE_DEFAULTS[primary] : null;

  return {
    primaryType: primary,
    wing: core?.enneagramWing ?? literaryProfile?.enneagramWing ?? null,
    instinctStacking: core?.instinctStacking ?? null,
    baselineIntegrationLevel: core?.baselineIntegrationLevel ?? null,
    egoFixation: nonEmpty(core?.egoFixation) ?? k?.egoFixationDefault ?? null,
    coreFearEffective: coreFear || "—",
    coreDesireEffective: coreDesire || "—",
    viceEffective: vice || "—",
    virtueEffective: virtue || "—",
    harmDefenseStyle: core?.harmDefenseStyle ?? hi?.harmDefense ?? null,
    imageStrategy: core?.imageStrategy ?? hi?.imageStrategy ?? null,
    attachmentPatternOverride: core?.attachmentPatternOverride ?? null,
    stressPatternJson: core?.stressPatternJson ?? null,
    growthPatternJson: core?.growthPatternJson ?? null,
    notesEnneagram: core?.notesEnneagram ?? null,
    hasExplicitCognitionOverrides: hasExplicit,
  };
}

export type PressureSignals = {
  lawPunishmentSalience: number;
  honorShameSalience: number;
  /** 0–100 derived from scene snapshot + legacy sim. */
  angerCue: number;
  socialRiskCue: number;
  hopeCue: number;
};

export function derivePressureSignals(input: {
  worldStyle: WorldStateThoughtStyle | null;
  stateFearText: string | null;
  stateAngerText: string | null;
  stateSocialRiskText: string | null;
  stateHopeText: string | null;
  instinctStacking?: string | null;
}): PressureSignals {
  const d = getInstinctStackingCognitionDeltas(input.instinctStacking ?? null);
  const law = clamp((input.worldStyle?.lawPunishmentSalience ?? 50) + d.lawPunishmentDelta, 0, 100);
  const honor = clamp((input.worldStyle?.honorShameSalience ?? 50) + d.honorShameDelta, 0, 100);
  const angerCue = clamp((input.stateAngerText ? 72 : 18) + d.angerCueDelta, 0, 100);
  const socialRiskCue = clamp((input.stateSocialRiskText ? 68 : 22) + d.socialRiskCueDelta, 0, 100);
  const hopeCue = clamp((input.stateHopeText ? 55 : 15) + d.hopeCueDelta, 0, 100);
  return {
    lawPunishmentSalience: law,
    honorShameSalience: honor,
    angerCue,
    socialRiskCue,
    hopeCue,
  };
}

/**
 * Deterministic stress vs growth activation from baseline integration + world + scene cues.
 */
export function resolveEffectiveIntegrationState(input: {
  primaryType: EnneagramArchetype | null;
  baseline: BaselineIntegrationLevel;
  pressure: PressureSignals;
  /** Maturity nudges stress vs growth sensitivity (deterministic). */
  ageBand?: CharacterAgeBand | null;
}): { stress: EnneagramStressShift; growth: EnneagramGrowthShift } {
  const type = input.primaryType;
  if (!type) {
    return {
      stress: { active: false, towardType: null, weight: 0, notes: "no primary Enneagram type" },
      growth: { active: false, towardType: null, weight: 0, notes: "no primary Enneagram type" },
    };
  }

  const baseline = input.baseline ?? 50;
  const stressTarget = stressLineTarget(type);
  const growthTarget = growthLineTarget(type);

  let stressScore =
    input.pressure.lawPunishmentSalience * 0.38 +
    input.pressure.angerCue * 0.22 +
    input.pressure.socialRiskCue * 0.18 +
    (100 - baseline) * 0.22;

  let growthScore =
    baseline * 0.35 +
    input.pressure.hopeCue * 0.25 +
    (100 - input.pressure.lawPunishmentSalience) * 0.22 +
    (100 - input.pressure.honorShameSalience) * 0.18;

  const ab = input.ageBand ?? null;
  if (ab === "EARLY_CHILD" || ab === "LATE_CHILD") stressScore += 6;
  else if (ab === "ADOLESCENT") stressScore += 4;
  else if (ab === "ELDER") {
    stressScore -= 2;
    growthScore += 3;
  }

  stressScore = clamp(stressScore, 0, 100);
  growthScore = clamp(growthScore, 0, 100);

  const stressThreshold =
    ab === "EARLY_CHILD" || ab === "LATE_CHILD" ? 54 : ab === "ADOLESCENT" ? 56 : 58;

  const stressWins =
    stressScore >= stressThreshold && stressScore >= growthScore + 6;
  const growthWins = growthScore >= 58 && growthScore > stressScore + 6;

  const k = getNineTypeKnowledge(type)!;

  return {
    stress: {
      active: stressWins,
      towardType: stressTarget,
      weight: stressWins ? clamp((stressScore - 50) / 50, 0.2, 1) : 0,
      notes: stressWins ? k.stressMovementNotes : "stress line not dominant",
    },
    growth: {
      active: growthWins,
      towardType: growthTarget,
      weight: growthWins ? clamp((growthScore - 50) / 50, 0.2, 1) : 0,
      notes: growthWins ? k.growthMovementNotes : "growth line not dominant",
    },
  };
}

export function buildEnneagramInnerVoicePattern(input: {
  primaryType: EnneagramArchetype | null;
  stress: EnneagramStressShift;
  growth: EnneagramGrowthShift;
}): EnneagramInnerVoicePattern | null {
  const type = input.primaryType;
  if (!type) return null;
  const base = getNineTypeKnowledge(type)!.voicePattern;
  const stressK = input.stress.active ? getNineTypeKnowledge(input.stress.towardType!) : null;
  const growthK = input.growth.active ? getNineTypeKnowledge(input.growth.towardType!) : null;

  const mergeLine = (baseLine: string, stressLine: string | undefined, growthLine: string | undefined) => {
    const parts = [baseLine];
    if (stressLine && input.stress.active)
      parts.push(`stress→${input.stress.towardType}: ${stressLine}`);
    if (growthLine && input.growth.active)
      parts.push(`growth→${input.growth.towardType}: ${growthLine}`);
    return parts.join(" | ");
  };

  return {
    selfNarrationStyle: mergeLine(
      base.selfNarrationStyle,
      stressK?.innerVoiceToneDefaults,
      growthK?.innerVoiceToneDefaults
    ),
    primaryDeflectionStyle: mergeLine(
      base.primaryDeflectionStyle,
      stressK?.voicePattern.primaryDeflectionStyle,
      growthK?.voicePattern.primaryDeflectionStyle
    ),
    shameStyle: mergeLine(base.shameStyle, stressK?.voicePattern.shameStyle, growthK?.voicePattern.shameStyle),
    fearStyle: mergeLine(base.fearStyle, stressK?.voicePattern.fearStyle, growthK?.voicePattern.fearStyle),
    desireStyle: mergeLine(base.desireStyle, stressK?.voicePattern.desireStyle, growthK?.voicePattern.desireStyle),
    controlStyle: mergeLine(base.controlStyle, stressK?.voicePattern.controlStyle, growthK?.voicePattern.controlStyle),
    conflictStyle: mergeLine(base.conflictStyle, stressK?.voicePattern.conflictStyle, growthK?.voicePattern.conflictStyle),
    selfDeceptionStyle: mergeLine(
      base.selfDeceptionStyle,
      stressK?.voicePattern.selfDeceptionStyle,
      growthK?.voicePattern.selfDeceptionStyle
    ),
    tabooProcessingStyle: mergeLine(
      base.tabooProcessingStyle,
      stressK?.tabooHandlingPattern,
      growthK?.tabooHandlingPattern
    ),
  };
}

/** Alias requested by cognition frame API naming. */
export const applyEnneagramShapingToCognitionFrame = applyEnneagramShapingToResolvedCognition;

function renumber(stack: import("@/lib/domain/inner-voice").RankedCognitionItem[]) {
  return stack.map((x, i) => ({ rank: i + 1, label: x.label }));
}

export type EnneagramShapingResult = {
  resolved: ResolvedCognitionLayer;
  selfDeceptionPattern: string;
  tabooThoughtPattern: string;
};

/**
 * Deterministically reweights stacks and biases using Enneagram + stress/growth + voice pattern.
 */
export function applyEnneagramShapingToResolvedCognition(
  base: ResolvedCognitionLayer,
  input: {
    profile: EnneagramProfile;
    stress: EnneagramStressShift;
    growth: EnneagramGrowthShift;
    voice: EnneagramInnerVoicePattern | null;
    knowledge: ReturnType<typeof getNineTypeKnowledge>;
    instinct?: InstinctStackingCognition | null;
  }
): EnneagramShapingResult {
  const { profile, stress, growth, voice, knowledge } = input;
  const instinct = input.instinct ?? null;

  if (!profile.primaryType || !knowledge) {
    return {
      resolved: { ...base },
      selfDeceptionPattern: "untyped: infer from world-state + scene only",
      tabooThoughtPattern: "untyped: infer from taboo index + scene only",
    };
  }

  const tag = `[${profile.primaryType}]`;

  const fearLabel = `${tag} core fear theme: ${profile.coreFearEffective.slice(0, 160)}`;
  const fearStack = renumber([
    { rank: 1, label: fearLabel },
    ...base.fearStack.filter((x) => !x.label.includes(tag)),
  ]).slice(0, 14);

  const activeMotives = [...base.activeMotives];
  const desireHint = `${tag} core desire theme: ${profile.coreDesireEffective.slice(0, 140)}`;
  if (!activeMotives.some((m) => m.includes(tag))) {
    activeMotives.unshift(desireHint);
  }

  const suppressedMotives = [...base.suppressedMotives];
  const viceHint = `${tag} vice pressure: ${profile.viceEffective.slice(0, 120)}`;
  if (!suppressedMotives.some((m) => m.includes(tag))) {
    suppressedMotives.unshift(viceHint);
  }

  const obligationStack = [...base.obligationStack];
  if (instinct?.obligationFlavor) {
    obligationStack.unshift({
      rank: 1,
      label: `[instinct] ${instinct.obligationFlavor}`,
    });
  }
  if (stress.active && stress.towardType) {
    obligationStack.unshift({
      rank: 1,
      label: `${tag} stress line toward ${stress.towardType} (w=${stress.weight.toFixed(2)}): honor obligations differently under pressure`,
    });
  }
  const obligationRenumbered = renumber(obligationStack).slice(0, 18);

  const decisionBiases = [
    ...base.decisionBiases,
    `enneagram:${profile.primaryType}`,
    voice?.controlStyle ?? "",
    voice?.conflictStyle ?? "",
    stress.active ? `stress-line:${stress.towardType}` : "",
    growth.active ? `growth-line:${growth.towardType}` : "",
    ...(instinct?.tags ?? []),
  ].filter(Boolean);

  let identityConflict = base.identityConflict;
  identityConflict = [
    identityConflict,
    `${tag} contradiction lens: ${knowledge.contradictionDefaults}`,
    stress.active ? `stress: ${stress.notes}` : "",
    growth.active ? `growth: ${growth.notes}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const perceivedReality = [
    base.perceivedReality,
    `Enneagram cognition: type ${profile.primaryType}; ego-fixation lens: ${profile.egoFixation ?? knowledge.egoFixationDefault ?? "—"}; inner tone ${knowledge.innerVoiceToneDefaults}.`,
    stress.active ? `Stress movement toward ${stress.towardType}.` : "",
    growth.active ? `Growth movement toward ${growth.towardType}.` : "",
    profile.instinctStacking ? `Instinct stack ${profile.instinctStacking}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const selfDeceptionPattern = voice?.selfDeceptionStyle ?? knowledge.selfJustificationDefaults;
  const tabooThoughtPattern = [
    voice?.tabooProcessingStyle ?? knowledge.tabooHandlingPattern,
    instinct?.tabooLayer ?? "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    resolved: {
      perceivedReality,
      activeMotives,
      suppressedMotives,
      fearStack,
      obligationStack: obligationRenumbered,
      identityConflict: identityConflict || "—",
      decisionBiases,
    },
    selfDeceptionPattern,
    tabooThoughtPattern,
  };
}
