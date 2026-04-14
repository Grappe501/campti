import type {
  AuthorVoiceProfile,
  AuthorVoiceShapingV1,
  DetailSelectionProfile,
  HumanizationProfile,
  NarrativeWitnessMode,
  ProsePresenceProfile,
} from "@/lib/domain/author-voice-humanization";
import { AUTHOR_VOICE_SHAPING_VERSION } from "@/lib/domain/author-voice-humanization";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function defaultAuthorVoiceProfile(): AuthorVoiceProfile {
  return {
    narrativeDensity: 0.55,
    descriptiveDensity: 0.5,
    emotionalDirectness: 0.35,
    toleranceForAmbiguity: 0.45,
    sentenceRhythmBias: 0.5,
    metaphorPreference: 0.4,
    silenceBias: 0.5,
    expositionTolerance: 0.35,
    historicalDetailBias: 0.55,
    interiorityBias: 0.5,
    dialogueIndirectnessBias: 0.45,
  };
}

function scoreFromString(
  s: string | null | undefined,
  keywords: Array<{ k: RegExp; v: number }>,
  fallback: number
): number {
  const t = (s ?? "").toLowerCase();
  let best = fallback;
  for (const { k, v } of keywords) {
    if (k.test(t)) best = v;
  }
  return clamp01(best);
}

/**
 * Maps DB narrative/character voice rows into a normalized profile (deterministic).
 */
export function buildAuthorVoiceProfile(input: {
  narrativeVoice?: {
    sentenceRhythm?: string | null;
    dictionStyle?: string | null;
    sensoryBias?: string | null;
    silenceStyle?: string | null;
    memoryStyle?: string | null;
    interiorityStyle?: string | null;
  } | null;
  characterVoice?: {
    rhythmStyle?: string | null;
    metaphorStyle?: string | null;
    emotionalExpressionStyle?: string | null;
    silencePatterns?: string | null;
  } | null;
  overrides?: Partial<AuthorVoiceProfile>;
}): AuthorVoiceProfile {
  const base = defaultAuthorVoiceProfile();
  const n = input.narrativeVoice;
  const c = input.characterVoice;

  const rhythm = scoreFromString(
    n?.sentenceRhythm,
    [
      { k: /staccato|short|fragment/i, v: 0.75 },
      { k: /long|lyric|flowing/i, v: 0.35 },
    ],
    base.sentenceRhythmBias
  );

  const silence = scoreFromString(
    [n?.silenceStyle, c?.silencePatterns].filter(Boolean).join(" "),
    [
      { k: /sparse|ell|gap|pause/i, v: 0.8 },
      { k: /dense|continuous/i, v: 0.25 },
    ],
    base.silenceBias
  );

  const interior = scoreFromString(
    [n?.interiorityStyle, n?.memoryStyle].filter(Boolean).join(" "),
    [
      { k: /interior|inner|thought|memory/i, v: 0.75 },
      { k: /external|action|camera/i, v: 0.35 },
    ],
    base.interiorityBias
  );

  const metaphor = scoreFromString(c?.metaphorStyle, [{ k: /rich|heavy|figurative/i, v: 0.75 }], base.metaphorPreference);

  const emotion = scoreFromString(
    c?.emotionalExpressionStyle,
    [
      { k: /direct|plain|named/i, v: 0.75 },
      { k: /indirect|deflect|avoid/i, v: 0.3 },
    ],
    base.emotionalDirectness
  );

  const dialogueInd = scoreFromString(
    c?.emotionalExpressionStyle,
    [
      { k: /subtext|indirect|deflect/i, v: 0.75 },
      { k: /plain|direct/i, v: 0.25 },
    ],
    base.dialogueIndirectnessBias
  );

  const sensory = scoreFromString(n?.sensoryBias, [{ k: /smell|sound|touch|taste/i, v: 0.65 }], base.descriptiveDensity);

  const merged: AuthorVoiceProfile = {
    ...base,
    sentenceRhythmBias: rhythm,
    silenceBias: silence,
    interiorityBias: interior,
    metaphorPreference: metaphor,
    emotionalDirectness: emotion,
    dialogueIndirectnessBias: dialogueInd,
    descriptiveDensity: sensory,
    ...input.overrides,
  };
  return {
    narrativeDensity: clamp01(merged.narrativeDensity),
    descriptiveDensity: clamp01(merged.descriptiveDensity),
    emotionalDirectness: clamp01(merged.emotionalDirectness),
    toleranceForAmbiguity: clamp01(merged.toleranceForAmbiguity),
    sentenceRhythmBias: clamp01(merged.sentenceRhythmBias),
    metaphorPreference: clamp01(merged.metaphorPreference),
    silenceBias: clamp01(merged.silenceBias),
    expositionTolerance: clamp01(merged.expositionTolerance),
    historicalDetailBias: clamp01(merged.historicalDetailBias),
    interiorityBias: clamp01(merged.interiorityBias),
    dialogueIndirectnessBias: clamp01(merged.dialogueIndirectnessBias),
  };
}

export function defaultDetailSelectionProfile(av: AuthorVoiceProfile): DetailSelectionProfile {
  return {
    concreteDetailWeight: clamp01(0.45 + av.historicalDetailBias * 0.35),
    sensorySpread: clamp01(0.4 + av.descriptiveDensity * 0.35),
    maxNamedEntitiesSoft: Math.round(8 + av.narrativeDensity * 10),
  };
}

export function defaultHumanizationProfile(av: AuthorVoiceProfile): HumanizationProfile {
  return {
    allowFragmentAndInterruption: clamp01(0.35 + av.sentenceRhythmBias * 0.45),
    preferEmbodiedEmotion: clamp01(0.5 + (1 - av.emotionalDirectness) * 0.35),
    restraintOnExplanation: clamp01(0.4 + av.toleranceForAmbiguity * 0.35),
    allowContradictoryPerception: clamp01(0.45 + av.toleranceForAmbiguity * 0.35),
  };
}

export function defaultProsePresenceProfile(av: AuthorVoiceProfile): ProsePresenceProfile {
  return {
    intimacy: clamp01(0.45 + av.interiorityBias * 0.45),
    heat: clamp01(0.45 + av.emotionalDirectness * 0.35),
  };
}

export function buildNarrativeWitnessFrame(mode: NarrativeWitnessMode): string[] {
  switch (mode) {
    case "immersive_present":
      return [
        "Witness: present-tense immediacy—sensation, motion, speech in the moment.",
        "Avoid retrospective framing unless the scene demands it.",
      ];
    case "reflective_memory":
      return [
        "Witness: memory selects and distorts—let the past feel filtered, not reportorial.",
        "Allow doubt, misremembering, and selective detail.",
      ];
    case "oral_history":
      return [
        "Witness: spoken texture—rhythm, repetition, audience, and held silence.",
        "Let the telling be part of the truth.",
      ];
    case "observed_distance":
      return [
        "Witness: camera at a distance—gesture, consequence, and social shape before interior confession.",
        "Withhold inner naming unless earned.",
      ];
    case "inherited_story":
      return [
        "Witness: story handed down—compression, myth, and family bias.",
        "Let inheritance show in what is omitted.",
      ];
    default:
      return [];
  }
}

export function buildDetailSelectionHints(
  d: DetailSelectionProfile,
  av: AuthorVoiceProfile
): string[] {
  return [
    `Detail: prefer concrete and situated specifics over abstract labels (weight ${d.concreteDetailWeight.toFixed(2)}).`,
    `Sensory: spread attention across channels (spread ${d.sensorySpread.toFixed(2)}); avoid sight-only lists.`,
    `Named anchors: keep a bounded set of vivid proper nouns (soft cap ~${d.maxNamedEntitiesSoft}).`,
    `Historical texture: ${av.historicalDetailBias >= 0.55 ? "favor era-appropriate objects and work" : "use sparing, precise anchors only"}.`,
  ];
}

export function buildHumanizationHints(h: HumanizationProfile, av: AuthorVoiceProfile): string[] {
  return [
    `Humanization: embodied cues over emotion words—${h.preferEmbodiedEmotion >= 0.55 ? "favor" : "allow"} gesture, posture, task, object.`,
    `Explanation: ${h.restraintOnExplanation >= 0.55 ? "withhold" : "limit"} causal gloss ("because", "which meant")—trust action.`,
    `Fragment / interruption: ${h.allowFragmentAndInterruption >= 0.55 ? "allowed" : "occasional"}—rhythm over polish.`,
    `Contradiction: ${h.allowContradictoryPerception >= 0.55 ? "perception may disagree with itself" : "keep impressions stable"}.`,
    `Ambiguity tolerance: ${av.toleranceForAmbiguity >= 0.5 ? "leave gaps; do not resolve every tension" : "clarify sparingly"}.`,
  ];
}

export function buildProsePresenceHints(p: ProsePresenceProfile): string[] {
  return [
    `Presence: intimacy ${p.intimacy.toFixed(2)} (closeness to POV body/mind vs wide shot).`,
    `Heat: ${p.heat.toFixed(2)} (cool reserve vs urgency)—match social risk and era register.`,
  ];
}

export function buildAuthorVoiceShaping(input: {
  narrativeWitnessMode?: NarrativeWitnessMode;
  narrativeVoice?: {
    sentenceRhythm?: string | null;
    dictionStyle?: string | null;
    sensoryBias?: string | null;
    silenceStyle?: string | null;
    memoryStyle?: string | null;
    interiorityStyle?: string | null;
  } | null;
  characterVoice?: {
    rhythmStyle?: string | null;
    metaphorStyle?: string | null;
    emotionalExpressionStyle?: string | null;
    silencePatterns?: string | null;
  } | null;
  overrides?: Partial<AuthorVoiceProfile>;
}): AuthorVoiceShapingV1 {
  const authorVoiceProfile = buildAuthorVoiceProfile({
    narrativeVoice: input.narrativeVoice,
    characterVoice: input.characterVoice,
    overrides: input.overrides,
  });
  const mode = input.narrativeWitnessMode ?? "immersive_present";
  const detailSelectionProfile = defaultDetailSelectionProfile(authorVoiceProfile);
  const humanizationProfile = defaultHumanizationProfile(authorVoiceProfile);
  const prosePresenceProfile = defaultProsePresenceProfile(authorVoiceProfile);
  return {
    contractVersion: AUTHOR_VOICE_SHAPING_VERSION,
    narrativeWitnessMode: mode,
    authorVoiceProfile,
    detailSelectionProfile,
    humanizationProfile,
    prosePresenceProfile,
  };
}

export function flattenAuthorVoiceShapingToPromptLines(shaping: AuthorVoiceShapingV1): {
  witnessLines: string[];
  humanizationHints: string[];
  prosePresenceHints: string[];
  voiceSummaryLines: string[];
} {
  const av = shaping.authorVoiceProfile;
  const witnessLines = buildNarrativeWitnessFrame(shaping.narrativeWitnessMode);
  const humanizationHints = [
    ...buildHumanizationHints(shaping.humanizationProfile, av),
    ...buildDetailSelectionHints(shaping.detailSelectionProfile, av),
  ];
  const prosePresenceHints = buildProsePresenceHints(shaping.prosePresenceProfile);
  const voiceSummaryLines = [
    `Voice axes (0–1): density ${av.narrativeDensity.toFixed(2)}, description ${av.descriptiveDensity.toFixed(2)}, direct emotion ${av.emotionalDirectness.toFixed(2)}, ambiguity ${av.toleranceForAmbiguity.toFixed(2)}.`,
    `Cadence: rhythm bias ${av.sentenceRhythmBias.toFixed(2)}, silence/omission ${av.silenceBias.toFixed(2)}, metaphor ${av.metaphorPreference.toFixed(2)}.`,
    `Interiority ${av.interiorityBias.toFixed(2)}, dialogue indirectness ${av.dialogueIndirectnessBias.toFixed(2)}, exposition tolerance ${av.expositionTolerance.toFixed(2)}.`,
  ];
  return { witnessLines, humanizationHints, prosePresenceHints, voiceSummaryLines };
}
