/**
 * Enneagram types for cognition (mirrors Prisma `EnneagramType` string values).
 * Use these in deterministic maps without importing `@prisma/client` in hot paths.
 */
export type EnneagramArchetype =
  | "ONE"
  | "TWO"
  | "THREE"
  | "FOUR"
  | "FIVE"
  | "SIX"
  | "SEVEN"
  | "EIGHT"
  | "NINE";

/** Alias for Prisma `EnneagramType` / public docs. */
export type EnneagramType = EnneagramArchetype;

/** Optional wing as adjacent number id: e.g. type ONE with wing 9 → "9". */
export type EnneagramWing = string | null;

/** Common instinct orders; keep open string for author quirks. */
export type InstinctStacking = string | null;

/** 0 = disintegrated / stress-prone baseline; 100 = growth-leaning baseline. */
export type BaselineIntegrationLevel = number | null;

/** Resolved cognitive Enneagram slice (defaults + author fields from `CharacterCoreProfile`). */
export type EnneagramProfile = {
  primaryType: EnneagramArchetype | null;
  wing: EnneagramWing;
  instinctStacking: InstinctStacking;
  baselineIntegrationLevel: BaselineIntegrationLevel;
  egoFixation: string | null;
  coreFearEffective: string;
  coreDesireEffective: string;
  viceEffective: string;
  virtueEffective: string;
  harmDefenseStyle: string | null;
  imageStrategy: string | null;
  attachmentPatternOverride: string | null;
  stressPatternJson: unknown;
  growthPatternJson: unknown;
  notesEnneagram: string | null;
  /** True when explicit strings on core override map defaults for fear/desire/vice/virtue. */
  hasExplicitCognitionOverrides: boolean;
};

export type EnneagramStressShift = {
  active: boolean;
  towardType: EnneagramArchetype | null;
  /** 0–1 influence on reordering fears / biases. */
  weight: number;
  notes: string;
};

export type EnneagramGrowthShift = {
  active: boolean;
  towardType: EnneagramArchetype | null;
  weight: number;
  notes: string;
};

/** Machine-usable inner-voice defaults for a type (stress/growth tweak in builder). */
export type EnneagramInnerVoicePattern = {
  selfNarrationStyle: string;
  primaryDeflectionStyle: string;
  shameStyle: string;
  fearStyle: string;
  desireStyle: string;
  controlStyle: string;
  conflictStyle: string;
  selfDeceptionStyle: string;
  tabooProcessingStyle: string;
};
