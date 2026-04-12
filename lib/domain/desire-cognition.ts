/**
 * Desire, pleasure, attachment longing — deterministic cognition (Phase 5C.1).
 * Advisory until PINNED; no modern therapeutic framing in field semantics (author-authored JSON).
 */

/** 0–100: intensity of stable trait / pull (author-tuned). */
export type DesireScalar = number;

/**
 * Slow-changing desire architecture (stored on `CharacterCoreProfile.desireProfileJson` + merges).
 */
export type CharacterDesireProfile = {
  desireForTouch: DesireScalar;
  desireForProtection: DesireScalar;
  desireForRecognition: DesireScalar;
  desireForNeedfulness: DesireScalar;
  desireForEroticFusion: DesireScalar;
  desireForDominance: DesireScalar;
  desireForSubmission: DesireScalar;
  desireForApproval: DesireScalar;
  desireForBelonging: DesireScalar;
  desireForRelief: DesireScalar;
  desireForEscape: DesireScalar;
  desireForDevotion: DesireScalar;
  desireForPossession: DesireScalar;
  desireForFreedom: DesireScalar;
};

export type PleasurePattern = {
  /** What soothes (warmth, food, music, silence, prayer, etc.). */
  soothingSources: string[];
  /** Non-judgmental channels body uses for reward (eating, touch, sleep, exertion, etc.). */
  bodyRewardChannels: string[];
  /** Contexts where pleasure feels dangerous or sinful. */
  forbiddenPleasureTriggers: string[];
  /** 0–100 likelihood shame follows pleasure for this character. */
  shameAfterPleasureLikelihood: DesireScalar;
  /** e.g. "steals", "waits", "bargains", "denies then binges". */
  pleasureSeekingStyle: string;
};

export type AttachmentLongingProfile = {
  wantednessHunger: DesireScalar;
  fearOfUnwantedness: DesireScalar;
  dependencyPull: DesireScalar;
  /** 0–100 rescue / deliverance fantasy pull. */
  rescueFantasyLevel: DesireScalar;
  approvalSensitivity: DesireScalar;
  /** Grief/emptiness when attachment is uncertain. */
  abandonmentAche: DesireScalar;
};

/**
 * How sexual/erotic life intersects law, kin, religion, property (historically situated authoring).
 */
export type SexualConstraintProfile = {
  /** Self-concept around legitimacy of desire (era language, not clinical). */
  legitimacyNarrative: string;
  /** What must never be admitted aloud. */
  unspeakableDesires: string[];
  /** Past patterns that haunt present fixation (author text). */
  pastSexualProclivityNotes: string[];
  /** Shame source tags: religion, kin, race_color_line, status, fertility, etc. */
  shameBindTags: string[];
  /** Displacement: work, violence, care-taking, religion, etc. */
  displacementHabits: string[];
};

/** Assembled from core profile JSON columns + light literary hints. */
export type CharacterDesireBundle = {
  desire: CharacterDesireProfile;
  pleasure: PleasurePattern;
  attachment: AttachmentLongingProfile;
  sexual: SexualConstraintProfile;
};

export type DesireConflictPattern = {
  consciousWant: string[];
  suppressedWant: string[];
  displacedWant: string[];
  misrecognizedWant: string[];
  rationalizedWant: string[];
};

/** Normalized 0–1 pulls after age/world/snapshot gating (for prompts / logic). */
export type DesireVector = {
  touch: number;
  protection: number;
  recognition: number;
  needToBeNeeded: number;
  erotic: number;
  dominance: number;
  submission: number;
  approval: number;
  belonging: number;
  relief: number;
  escape: number;
  devotion: number;
  possession: number;
  freedom: number;
  attachmentAche: number;
  forbiddenPressure: number;
};

/** Alias: runtime-normalized desire pulls surfaced on `CharacterCognitionFrame`. */
export type ActiveDesireSignals = DesireVector;

/** Compact bundle for cognition frame + future LLM contracts. */
export type DesirePressureSummary = {
  dominantDesireChannels: string[];
  attachmentAcheSummary: string;
  pleasurePressureSummary: string;
  sexualConstraintSummary: string;
  shameBoundDesireHint: string;
  displacementNotes: string;
  conflictSnapshot: DesireConflictPattern;
  vectors: DesireVector;
};

/**
 * Era/world gating of desire visibility and punishment (stored `WorldStateReference.desireEnvironmentJson`).
 */
export type WorldStateDesireEnvironment = {
  worldStateId: string | null;
  eraId: string | null;
  /** 0–100 */
  eroticTabooSeverity: number;
  kinshipProhibitionSeverity: number;
  femaleDesireSuppression: number;
  maleDesireEntitlementPressure: number;
  religiousGuiltIntensity: number;
  propertyMarriagePressure: number;
  fertilityReproductionPressure: number;
  householdDutyOverride: number;
  visibilityRiskForDesire: number;
  punishmentSeverityForForbiddenDesire: number;
  /** Short author notes for prompts. */
  notes?: string;
};
