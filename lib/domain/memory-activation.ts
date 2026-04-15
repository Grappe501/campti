import type { NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

export const MEMORY_ACTIVATION_CONTRACT_VERSION = "1" as const;

export const MEMORY_ACTIVATION_SOURCE_TYPES = [
  "canonical_lived_event",
  "character_bounded_remembered_event",
  "reader_interaction_memory",
  "active_unresolved_consequence",
  "emotional_continuity_anchor",
] as const;

export const MEMORY_ACTIVATION_MODES = [
  "clear_recall",
  "partial_recall",
  "bodily_recollection",
  "defensive_avoidance",
  "misattributed_association",
  "repetitive_fixation",
] as const;

export const MEMORY_ACTIVATION_CONTEXTS = [
  "scene_mode",
  "interaction_mode",
] as const;

export const MEMORY_ACTIVATION_CHANNELS = ["canonical_dyad", "reader_bond_dyad"] as const;

export type MemoryActivationSourceType = (typeof MEMORY_ACTIVATION_SOURCE_TYPES)[number];
export type MemoryActivationMode = (typeof MEMORY_ACTIVATION_MODES)[number];
export type MemoryActivationContext = (typeof MEMORY_ACTIVATION_CONTEXTS)[number];
export type MemoryActivationChannel = (typeof MEMORY_ACTIVATION_CHANNELS)[number];

export type MemoryActivationCandidate = {
  memoryRefId: string;
  sourceType: MemoryActivationSourceType;
  sourcePlane: NarrativeMemoryPlane;
  /**
   * Compact label only for explainability (never raw memory payload dump).
   */
  summaryToken: string;
  contextualRelevance: number;
  emotionalIntensity: number;
  unresolvedStatus: number;
  relationshipLinkage: number;
  recency: number;
  shameFearSalience: number;
  repetition: number;
  suppressionPressure: number;
  socialRiskProxy?: number;
};

export type ActivatedMemory = {
  memoryRefId: string;
  sourceType: MemoryActivationSourceType;
  activationReason: string[];
  activationWeight: number;
  emotionalColor: "calm" | "tense" | "charged";
  disclosureRisk: "low" | "moderate" | "high";
  distortionLikelihood: "low" | "moderate" | "high";
  activationMode: MemoryActivationMode;
  summaryToken: string;
};

export type MemoryActivationSummary = {
  contractVersion: typeof MEMORY_ACTIVATION_CONTRACT_VERSION;
  context: MemoryActivationContext;
  channel: MemoryActivationChannel;
  activatedMemories: ActivatedMemory[];
  activationCount: number;
  dominantActivationMode: MemoryActivationMode | null;
  highestActivationWeight: number;
  memorySalienceCapApplied: boolean;
  blockedSourceRefs: string[];
};
