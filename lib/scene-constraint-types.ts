import type { SceneConstraintSummary } from "@/lib/brain-assembly-types";
import type { OutcomeEnvelopeEntry, SceneOutcomeEnvelope } from "@/lib/scene-outcome-envelope-types";
import type { SceneReadinessClass, Stage8StructuredDataPatch } from "@/lib/scene-structured-data-patch";

export type { OutcomeEnvelopeEntry, SceneOutcomeEnvelope };

/** Lightweight Stage 8 policy provenance for admin (derived; not persisted). */
export type Stage8PolicyProvenance = {
  effectiveClass: SceneReadinessClass;
  classSource: "author" | "inferred";
  /** Keyword inference without `sceneClass` (for comparison when author overrides). */
  inferredClassSansAuthorOverride: SceneReadinessClass;
  /** Author `sceneClass` present and differs from inference-without-author. */
  sceneClassAuthorDiffersFromInference: boolean;
  /** Which Stage 8 structuredDataJson fields overrode derived values. */
  overridesApplied: {
    sceneClass: boolean;
    visibilityLegibility: boolean;
    focalPerception: boolean;
    dominantInterpretation: boolean;
    historicalSupportRequired: boolean;
  };
};

/**
 * Stage 8 — legality / readiness layer (derived + optional admin JSON overrides via Stage 7.5 summary).
 * Not simulation, dialogue, or branch execution.
 */

export type ScenePressureSource =
  | "scene_copy"
  | "linked_entity"
  | "character_state"
  | "stage7_5_summary"
  | "scene_structured_json"
  | "scene_visibility"
  | "place_setting"
  | "place_environment"
  | "focal_scene_brain";

export type ScenePressureItem = {
  id: string;
  /** Stable id for readiness policy (optional). */
  code?: string;
  label: string;
  /** Heuristic strength for admin display only. */
  strength: "low" | "medium" | "high";
  source: ScenePressureSource;
};

export type ScenePressureMap = {
  items: ScenePressureItem[];
  /** Convenience roll-up from Stage 7.5 tags + scene tone. */
  tagSummary: string[];
  /** Raw `Scene.visibility` (PUBLIC / REVIEW / PRIVATE). */
  sceneVisibility: string;
  /** One-line explanation of how visibility feeds exposure pressure. */
  visibilityPressureNote: string;
  /** Short bullets from linked places (setting + environment profiles). */
  placeNotes: string[];
  /** When focal scene-time brain ran — salient / trace hints that read as pressures. */
  focalBrainHints: string[];
  /** Derived flags for readiness (e.g. hydrology stress). */
  placeRiskFlags: Array<"flood_elevated" | "drought_elevated" | "terrain_stress">;
};

export type ScenePerceptionMap = {
  /** What is explicitly grounded (linked entities, stated intent). */
  visibleAnchors: string[];
  /** Gaps the engine cannot fill from links alone. */
  hiddenOrUnknown: string[];
  /** Open questions and underspecified beats. */
  ambiguousZones: string[];
  /** Tone / relational cues that invite misread. */
  misreadRisks: string[];
  /** How scene visibility affects “who can see / infer” this beat. */
  visibilityLegibility: string;
  /** Sensory / terrain / social-setting cues from linked places. */
  placeEnvironmentCues: string[];
  /** From focal `runSceneTimeBrain` when available (misses, misreads, salience). */
  focalBrainPerceptionHints: string[];
  /** Best single line from runner when focal brain ran. */
  focalDominantInterpretation: string | null;
};

export type SceneObjectiveEntry = {
  personId: string;
  displayName: string;
  /** Scene-level narrative intent (shared). */
  sceneObjective: string | null;
  /** CharacterState.motivation when present for this world/scene. */
  characterMotivation: string | null;
};

export type SceneObjectiveMap = {
  focal: SceneObjectiveEntry | null;
  byPerson: SceneObjectiveEntry[];
};

export type SceneRevealBudget = {
  score0to100: number | null;
  band: "tight" | "moderate" | "open" | "unknown";
  /** Human-readable factors (Stage 7.5 + heuristics). */
  factors: string[];
};

export type SceneReadinessLevel = "ready" | "partial" | "blocked";

/** Single policy outcome inside a severity bucket (blocking / warning / info). */
export type SceneReadinessReason = {
  code: string;
  message: string;
};

/** Explicit policy buckets for legality UI — severity is the bucket, not a field on each row. */
export type SceneReadinessPolicyBuckets = {
  blocking: SceneReadinessReason[];
  warnings: SceneReadinessReason[];
  info: SceneReadinessReason[];
};

export type SceneReadiness = {
  level: SceneReadinessLevel;
  policy: SceneReadinessPolicyBuckets;
  missingDependencies: string[];
  weakAreas: string[];
};

/** Slim focal scene-time runner slice for legality + readiness (full output stays in engine). */
export type SceneFocalSceneRunnerSummary = {
  regulationMode: "stable" | "guarded" | "overloaded" | "frozen" | "flooded";
  speechStyle: "silent" | "guarded" | "selective" | "open";
  primaryFear: string;
  salientSignals: string[];
};

/** Aggregate Stage 8 snapshot (derived-only; no Prisma persistence). */
export type SceneConstraintSet = {
  sceneId: string;
  worldStateId: string | null;
  focalPersonId: string | null;
  /** True when `getCharacterBrainBundle` supplied the summary (Stage 7.5 contract). */
  usedBrainBundle: boolean;
  /** True when `runSceneTimeBrain` ran for focal × world × scene. */
  usedFocalSceneBrainRunner: boolean;
  /** Normalized scene cue layer (always populated when the scene row exists). */
  upstreamSceneConstraintSummary: SceneConstraintSummary | null;
  /** Present when focal scene-time evaluation ran. */
  focalSceneRunner: SceneFocalSceneRunnerSummary | null;
  /** Effective `Scene.structuredDataJson` patch (Stage 7.5 + Stage 8 keys). */
  stage8StructuredPatch: Stage8StructuredDataPatch;
  /** Scene class for readiness policy (author or inferred). */
  sceneReadinessClass: SceneReadinessClass;
  sceneReadinessClassSource: "author" | "inferred";
  /** Policy line: class source, inferred alternative, Stage 8 JSON overrides. */
  stage8PolicyProvenance: Stage8PolicyProvenance;
  sourcesLinkedCount: number;
  historicalConfidence: number | null;
  pressure: ScenePressureMap;
  perception: ScenePerceptionMap;
  objectives: SceneObjectiveMap;
  revealBudget: SceneRevealBudget;
  outcomeEnvelope: SceneOutcomeEnvelope;
  assembledAtIso: string;
};
