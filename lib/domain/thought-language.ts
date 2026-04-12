/**
 * Thought language mediation: mind-language vs spoken vs rendered English.
 * Final author/reader surface stays English; cognition carries era-true register and metaphor.
 */

/** ISO 639-1/3 or project codes, e.g. "fr", "en", "cajun_fr", "mixed". */
export type MindLanguage = string;

/** Who speaks what, in what social weight (serializable for JSON columns). */
export type SpokenLanguageProfile = {
  /** Ordered by comfort / dominance for dialogue. */
  languages: Array<{
    code: string;
    label: string;
    fluency: "native" | "fluent" | "working" | "minimal";
    contexts?: string[];
  }>;
  /** Language used for public/legal face when different from home. */
  publicRegisterLanguage?: string | null;
};

/** Social-linguistic stance: formality, deference, directness. */
export type RegisterProfile = {
  /** e.g. "deferential_to_elders", "plain_spoken", "clerical_formal". */
  socialStance: string[];
  /** How hierarchy shapes word choice in inner speech. */
  hierarchyAwareness: "high" | "medium" | "low";
  /** Prefer indirectness, proverbs, silence. */
  indirectness: "high" | "medium" | "low";
};

/** How much “accent texture” appears in mediated English (not phonetic spelling games). */
export type AccentPresenceLevel = "none" | "light" | "medium";

/**
 * How inner/cognition English is rendered to author.
 * - transparent: plain contemporary English
 * - mediated: English with syntax/lexical carryover, retained terms
 * - high_texture: strong metaphor + term retention + visible syntax pressure
 */
export type TranslationRenderMode = "TRANSPARENT_ENGLISH" | "MEDIATED_ENGLISH" | "HIGH_TEXTURE_ENGLISH";

export type CodeSwitchTrigger = {
  id: string;
  /** When this trigger fires in scene/social context. */
  condition: string;
  /** e.g. "prestige_interlocutor", "prayer", "market", "anger". */
  kind: string;
  /** Language or register to shift toward. */
  toward: string;
};

/** Era-wide language ecology (often one row per world slice). */
/** Character-side language cognition (stored on core profile + JSON blobs). */
export type ThoughtLanguageProfile = {
  primaryMindLanguage: MindLanguage;
  secondaryMindLanguage: MindLanguage | null;
  spoken: SpokenLanguageProfile;
  register: RegisterProfile;
  translationRenderMode: TranslationRenderMode;
  codeSwitchTriggers: CodeSwitchTrigger[];
  retainedLexicon: Array<{ term: string; gloss: string; keepInEnglish: boolean }>;
};

export type WorldStateLanguageEnvironment = {
  worldStateId: string | null;
  eraId: string | null;
  /** Dominant vernacular(s) for ordinary life. */
  dominantLanguages: Array<{ code: string; label: string; notes?: string }>;
  prestigeLanguage: string | null;
  sacredLanguage: string | null;
  legalLanguage: string | null;
  tradeLanguage: string | null;
  householdLanguage: string | null;
  /** Who reads/writes what; gates inner monologue abstraction. */
  literacyNorm: {
    clericalLiteracy: "rare" | "minority" | "common" | "widespread";
    vernacularPrint: boolean;
    notes?: string;
  };
  /** Ordered or weighted prestige chain, machine-usable tokens. */
  languageHierarchy: string[];
  /** Pressure to translate thought into prestige code in public contexts. */
  translationPressure: number;
};

/**
 * Resolved bundle for prompts: character + world + scene-level mediation.
 * All `rendered*` fields describe English output constraints for LLM Phase 5C.
 */
export type ThoughtLanguageFrame = {
  primaryMindLanguage: MindLanguage;
  secondaryMindLanguage: MindLanguage | null;
  spoken: SpokenLanguageProfile;
  register: RegisterProfile;
  world: WorldStateLanguageEnvironment;
  renderMode: TranslationRenderMode;
  accentTextureLevel: AccentPresenceLevel;
  /** 0–1 how much non-English key terms may remain in mediated output. */
  retainedLexiconWeight: number;
  /** 0–1 syntax calqued or influenced by mind-language (not literal translation). */
  syntaxInfluenceLevel: number;
  /** Triggers for code-switch in inner voice (deterministic list + labels). */
  codeSwitchTriggers: CodeSwitchTrigger[];
  /** Instruction lines for model: worldview/moral/metaphor preservation. */
  renderInstructions: string[];
};
