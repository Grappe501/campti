import type { ThoughtLanguageFrame } from "@/lib/domain/thought-language";

/** Shared with cognition resolver stacks; kept here to avoid import cycles with `cognition.ts`. */
export type RankedCognitionItem = { rank: number; label: string };

/** Author-facing inner voice interrogation mode (deterministic framing + future LLM). */
export type InnerVoiceMode =
  | "INNER_MONOLOGUE"
  | "TABOO_SURFACING"
  | "SELF_JUSTIFICATION"
  | "FEAR_STACK"
  | "CONTRADICTION_TRACE"
  | "GOD_MODE_QA";

export type CharacterAgeBand =
  | "EARLY_CHILD"
  | "LATE_CHILD"
  | "ADOLESCENT"
  | "YOUNG_ADULT"
  | "ADULT"
  | "ELDER";

/** Machine-usable description of how cognition tends to be shaped in a given era slice. */
export type WorldStateThoughtStyle = {
  /** Stable id for logging (e.g. world state row id). */
  worldStateId: string | null;
  eraId: string | null;
  /** One-line label for prompts. */
  label: string | null;
  /** 0–100: how much public reputation / rumor gates private thought. */
  honorShameSalience: number;
  /** 0–100: religious or supernatural causal explanations expected. */
  supernaturalSalience: number;
  /** 0–100: fear of legal/state violence or seizure. */
  lawPunishmentSalience: number;
  /** 0–100: kin obligation as moral weight. */
  kinDutySalience: number;
  /** 0–100: class/status self-sorting pressure. */
  classStatusSalience: number;
  /** 0–100: bodily danger, labor, hunger, fatigue as thought content. */
  bodilySensorySalience: number;
  /** 0–100: expected abstraction level in ordinary moral reasoning (higher = more abstract norms). */
  publicMoralAbstraction: number;
  /** Short tokens: e.g. "blood", "covenant", "honor", "credit", "race_color_line". */
  dominantMoralCategories: string[];
  /** What must not be spoken aloud but may appear in private thought (author tool). */
  forbiddenThoughtZones: string[];
  /** Acceptable ways to describe self (role-first, lineage-first, Christian name only, etc.). */
  acceptableSelfConcepts: string[];
  /** Heuristic: avoid anachronistic psych vocabulary unless world state allows. */
  avoidModernPsychLabels: boolean;
  /** Compact prose for prompts; not a substitute for structured fields above. */
  summaryForModel: string;
};

/** Developmental lens for diction, impulse, and self-observation (not modern developmental psychology claims). */
export type AgeMaturityThoughtStyle = {
  ageBand: CharacterAgeBand;
  /** True when age years were unknown and band was defaulted. */
  assumedBand: boolean;
  /** 0–10 scale: upper bound on abstract moral vocabulary. */
  abstractionCeiling: number;
  /** 0–10: episodic vs categorical memory in inner voice. */
  memoryGranularity: number;
  /** 0–10: emotional lability vs steadiness. */
  emotionalVolatility: number;
  /** 0–10: capacity to observe own motives. */
  selfObservationCapacity: number;
  /** 0–10: impulse vs deliberation. */
  impulseDominance: number;
  /** 0–10: how far ahead the mind plans. */
  futurePlanningDepth: number;
  /** 0–10: omen/dream/parable vs propositional logic. */
  symbolicThinkingLevel: number;
  /** 0–10: shame as regulator of thought. */
  shameSensitivity: number;
  /** 0–10: internalized hierarchy / fear of elders-state-church. */
  authorityInternalization: number;
  summaryForModel: string;
};

/**
 * Deterministic rules the eventual model must follow. "Unfiltered" means author-facing buckets
 * may include taboo content; it does not disable world-state or age truth.
 */
export type InnerVoiceConstraintFrame = {
  /** Author tool: private mind may include cruel/taboo/forbidden content in designated fields. */
  allowUnfilteredPrivateMind: true;
  /** Narration must stay historically situated (no modern default worldview). */
  worldStateTruth: true;
  /** Thought must match age band unless explicitly marked speculative. */
  ageTruth: true;
  /** Discriminate these channels in output. */
  channels: {
    feltEmotion: boolean;
    consciousBelief: boolean;
    suppressedDesire: boolean;
    selfJustification: boolean;
    fear: boolean;
    contradiction: boolean;
    misperception: boolean;
  };
  /** Mode-specific emphasis (deterministic). */
  modeEmphasis: Record<string, boolean>;
  /** Strings derived from core taboo + world forbidden zones (still surfacable in forbiddenThought). */
  tabooAndForbiddenIndex: string[];
  /** If true, model must not sanitize forbidden thoughts into polite euphemism in the forbidden bucket. */
  requireRawForbiddenBucketWhenPresent: boolean;
};

export type CharacterInnerVoiceRequestV2Base = {
  characterId: string;
  sceneId: string;
  mode: InnerVoiceMode;
  /** GOD_MODE_QA or follow-up interrogation. */
  authorQuestion: string | null;
  ageBand: CharacterAgeBand;
  ageYears: number | null;
  ageBandAssumed: boolean;
  worldStateThoughtStyle: WorldStateThoughtStyle;
  ageMaturityThoughtStyle: AgeMaturityThoughtStyle;
  innerVoiceConstraintFrame: InnerVoiceConstraintFrame;
  /** Serialized cognition frame (deterministic resolver output + payload). */
  cognitionFramePayload: Record<string, unknown>;
  /** ISO time request was built. */
  builtAtIso: string;
};

export type CharacterInnerVoiceRequest =
  | ({ contractVersion: "2" } & CharacterInnerVoiceRequestV2Base)
  | ({
      contractVersion: "3";
      thoughtLanguageFrame: ThoughtLanguageFrame;
    } & CharacterInnerVoiceRequestV2Base);

/**
 * Full author-facing inner voice result. Populated by LLM in Phase 5C; types defined now.
 * `advisoryOnly` is true until the session row is PINNED (see pinned-policy).
 */
export type CharacterInnerVoiceResponse = {
  innerMonologue: string;
  surfaceThought: string;
  suppressedThought: string;
  forbiddenThought: string;
  selfJustification: string;
  fearStack: RankedCognitionItem[];
  desireStack: RankedCognitionItem[];
  contradiction: string;
  misbeliefs: string;
  moralFrame: string;
  ageBand: CharacterAgeBand;
  worldStateStyleSummary: string;
  confidence: number;
  /** True until session is PINNED; generation contracts must ignore when true. */
  advisoryOnly: boolean;
};
