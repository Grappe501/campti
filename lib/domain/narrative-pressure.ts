import type { ChapterFunction } from "@/lib/domain/chapter-movement-progression";
import type { ArcLifecycleState, ArcType } from "@/lib/domain/narrative-arc";
import type { NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

export const NARRATIVE_PRESSURE_CONTRACT_VERSION = "1" as const;

export const NARRATIVE_PRESSURE_CATEGORIES = [
  "disclosure",
  "conflict",
  "intimacy",
  "separation",
  "scarcity",
  "authority",
  "shame",
  "grief",
  "obligation",
  "spiritual",
  "escape",
  "reconciliation",
] as const;

export const NARRATIVE_PRESSURE_TARGET_SCOPES = [
  "scene_candidate_weighting",
  "response_tendency_weighting",
  "tension_emphasis",
  "memory_activation_weighting",
  "opportunity_surfacing",
] as const;

export const NARRATIVE_PRESSURE_SOURCE_AUTHORITIES = [
  "structural_arc",
  "structural_chapter",
  "structural_world",
  "structural_consequence",
  "shaping_default_bounded",
] as const;

export const NARRATIVE_PRESSURE_EXPRESSION_MODES = [
  "weight_bias",
  "emphasis_bias",
  "surface_opportunity_bias",
] as const;

export type NarrativePressureCategory = (typeof NARRATIVE_PRESSURE_CATEGORIES)[number];
export type NarrativePressureTargetScope = (typeof NARRATIVE_PRESSURE_TARGET_SCOPES)[number];
export type NarrativePressureSourceAuthority = (typeof NARRATIVE_PRESSURE_SOURCE_AUTHORITIES)[number];
export type NarrativePressureExpressionMode = (typeof NARRATIVE_PRESSURE_EXPRESSION_MODES)[number];

export type NarrativePressureSourceSignal = {
  sourceKind: "active_arc" | "chapter_function" | "world_state_pressure" | "unresolved_consequence" | "shaping_default";
  sourceId: string;
  authority: NarrativePressureSourceAuthority;
  contribution: number;
};

export type NarrativePressureDecayBehavior = {
  mode: "per_scene_step";
  decayPerStep: number;
  floorIntensity: number;
};

export type NarrativePressureExplanation = {
  summaryCode: string;
  reasonCodes: string[];
  sourcePlane: NarrativeMemoryPlane;
  targetPlane: NarrativeMemoryPlane;
};

export type NarrativePressure = {
  contractVersion: typeof NARRATIVE_PRESSURE_CONTRACT_VERSION;
  pressureId: string;
  category: NarrativePressureCategory;
  targetScope: NarrativePressureTargetScope;
  intensity: number;
  sourceAuthority: NarrativePressureSourceAuthority;
  sources: NarrativePressureSourceSignal[];
  allowedExpressionModes: NarrativePressureExpressionMode[];
  blockedConditions: string[];
  reinforcingConditions: string[];
  decayBehavior: NarrativePressureDecayBehavior;
  explanation: NarrativePressureExplanation;
};

export type NarrativePressureInput = {
  activeArcs: Array<{
    arcId: string;
    arcType: ArcType;
    lifecycleState: ArcLifecycleState;
    tensionLevel: number;
  }>;
  chapterFunction: ChapterFunction;
  worldStatePressure: number;
  unresolvedConsequences: Array<{
    consequenceId: string;
    category: string;
    severity: "low" | "moderate" | "high";
    lifecycleState: "active" | "latent" | "decaying" | "resolved" | "transformed";
  }>;
  shapingDefaults?: Partial<Record<NarrativePressureCategory, number>>;
  priorPressures?: NarrativePressure[];
  blockedConditionCodes?: string[];
  stepDelta?: number;
};

export type NarrativePressureInfluenceHint = {
  category: NarrativePressureCategory;
  sceneCandidateWeightDelta: number;
  responseTendencyWeightDelta: number;
  tensionEmphasisWeightDelta: number;
  memoryActivationWeightDelta: number;
  opportunitySurfaceWeightDelta: number;
  forceOverride: false;
};

export type NarrativePressureOutputSurface = {
  activePressures: NarrativePressure[];
  categoryIntensitySummary: Array<{
    category: NarrativePressureCategory;
    intensity: number;
    blocked: boolean;
    reinforced: boolean;
  }>;
  influenceHints: NarrativePressureInfluenceHint[];
};
