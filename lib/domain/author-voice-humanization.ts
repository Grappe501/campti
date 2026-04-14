/**
 * Phase 7 — Author voice, humanization, and production workflow (shaping layer).
 * Strengthens human presence on the page; not for detector evasion.
 * Generated prose stays in `generationText`; human columns remain separate.
 */

export const AUTHOR_VOICE_SHAPING_VERSION = "1" as const;

/** 0 = minimal, 1 = rich (or axis-specific meaning below). */
export type AuthorVoiceProfile = {
  narrativeDensity: number;
  descriptiveDensity: number;
  /** 0 = implication/suggestion, 1 = direct naming */
  emotionalDirectness: number;
  /** 0 = clarify, 1 = withhold / leave gaps */
  toleranceForAmbiguity: number;
  /** 0 = even cadence, 1 = varied / syncopated */
  sentenceRhythmBias: number;
  metaphorPreference: number;
  /** 0 = continuous prose, 1 = pauses / white space / omission */
  silenceBias: number;
  /** 0 = show through action only, 1 = allows brief orienting exposition */
  expositionTolerance: number;
  historicalDetailBias: number;
  /** Thought, memory, bodily sensation vs external action */
  interiorityBias: number;
  /** 0 = direct speech, 1 = deflection / subtext in dialogue */
  dialogueIndirectnessBias: number;
};

export type NarrativeWitnessMode =
  | "immersive_present"
  | "reflective_memory"
  | "oral_history"
  | "observed_distance"
  | "inherited_story";

export type DetailSelectionProfile = {
  /** Prefer concrete nouns, proper nouns, texture over abstraction */
  concreteDetailWeight: number;
  /** Favor smell/sound/touch over sight */
  sensorySpread: number;
  /** Cap-like hint: fewer named details when low */
  maxNamedEntitiesSoft: number;
};

export type HumanizationProfile = {
  /** Allow incomplete thoughts, interrupted lines */
  allowFragmentAndInterruption: number;
  /** Gesture, work, object over emotion labels */
  preferEmbodiedEmotion: number;
  /** Withhold causal explanations ("because…") */
  restraintOnExplanation: number;
  /** Allow mutually inconsistent impressions */
  allowContradictoryPerception: number;
};

export type ProsePresenceProfile = {
  /** 0 = distant camera, 1 = inside the body/mind of POV */
  intimacy: number;
  /** 0 = cool reserve, 1 = heated / urgent */
  heat: number;
};

export type AuthorVoiceShapingV1 = {
  contractVersion: typeof AUTHOR_VOICE_SHAPING_VERSION;
  narrativeWitnessMode: NarrativeWitnessMode;
  authorVoiceProfile: AuthorVoiceProfile;
  detailSelectionProfile: DetailSelectionProfile;
  humanizationProfile: HumanizationProfile;
  prosePresenceProfile: ProsePresenceProfile;
};

export type HumanizationAdvisoryCode =
  | "generic_diction_risk"
  | "over_explanation_risk"
  | "over_smooth_cadence"
  | "unwitnessed_scene_risk"
  | "thin_sensory_detail"
  | "insufficient_silence_or_gap";

export type HumanizationAdvisoryFinding = {
  code: HumanizationAdvisoryCode;
  severity: "info" | "warning";
  message: string;
  evidence?: Record<string, string | number | boolean | null>;
};

export type HumanizationAdvisoryReport = {
  contractVersion: "1";
  findings: HumanizationAdvisoryFinding[];
  advisoryOnly: true;
};

export type AuthorWorkflowStep =
  | "build_scene_input"
  | "generate_draft"
  | "inspect_cognition"
  | "inspect_decision_trace"
  | "inspect_social_field"
  | "run_prose_qa"
  | "run_humanization_advisory"
  | "run_repair_if_needed"
  | "assemble_chapter"
  | "chapter_coherence"
  | "book_coherence";

export type WorkflowCheckpoint = {
  step: AuthorWorkflowStep;
  completedAtIso: string;
  /** Short label for logs (no large payloads). */
  summary?: string;
};

export type WorkflowRunSummary = {
  contractVersion: "1";
  sceneId?: string;
  chapterId?: string;
  bookId?: string;
  epicId?: string;
  checkpoints: WorkflowCheckpoint[];
  ok: boolean;
  notes: string[];
};
