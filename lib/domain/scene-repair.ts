/**
 * Phase 6.2 — Narrative emergence: staleness classification, repair planning, and RevisionJob payloads.
 * Human prose columns (`authoringText`, `publishedReaderText`) are never targets for automatic repair.
 */

import type { SceneGenerationMode } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";

/** Specific upstream or quality signals — avoid generic "stale". */
export type SceneStalenessReason =
  | "genealogical_assertion_changed"
  | "fact_stale"
  | "world_state_changed"
  | "pinned_cognition_changed"
  | "promoted_simulation_changed"
  | "social_field_changed"
  | "prose_quality_under_threshold"
  | "social_pressure_underexpressed"
  | "continuity_mismatch"
  | "chapter_context_changed"
  | "dependency_graph_changed";

export type SceneRepairMode =
  | "REGENERATE_DRAFT"
  | "REWRITE_EXISTING_DRAFT"
  | "REPAIR_CONTINUITY"
  | "REASSEMBLE_CHAPTER_ONLY"
  | "NO_AUTOMATIC_REPAIR";

export type RevisionTriggerSource =
  | "dependency_invalidation"
  | "manual_author"
  | "qa_pipeline"
  | "worker"
  | "assembly_rollup"
  | "observer_or_tooling"
  | "unknown";

export type RepairPolicyDecision = "warn_only" | "enqueue_suggestion" | "auto_run_generation_text";

export type RepairEligibilitySummary = {
  /** True when automated repair may touch `generationText` only (never human columns). */
  safeToAutoRepairGenerationTextOnly: boolean;
  /** True when a human should review before publish (e.g. strong authoring presence). */
  requiresHumanReview: boolean;
  /** Non-empty when repair should not run unattended. */
  blockReasons: string[];
  /** Derived policy for prose/social signals. */
  prosePolicy: RepairPolicyDecision;
};

export type SceneRepairPlan = {
  contractVersion: "1";
  sceneId: string;
  chapterId: string | null;
  reasons: SceneStalenessReason[];
  repairMode: SceneRepairMode;
  /** When set, execution maps these to `runSceneGeneration` / loader overrides. */
  generationMode: SceneGenerationMode | null;
  generationPurpose: SceneGenerationPurpose | null;
  /** Optional fingerprint of planner inputs for reproducibility. */
  inputSnapshotHash: string | null;
  triggerSource: RevisionTriggerSource;
  eligibility: RepairEligibilitySummary;
  notes: string[];
};

/** Typed RevisionJob.payload for repair / reassembly (v1). */
export const SCENE_REPAIR_REVISION_PAYLOAD_VERSION = "scene-repair-v1" as const;

export type RevisionJobRepairPayloadV1 = {
  contractVersion: typeof SCENE_REPAIR_REVISION_PAYLOAD_VERSION;
  sceneId: string | null;
  chapterId: string | null;
  repairMode: SceneRepairMode;
  stalenessReasons: SceneStalenessReason[];
  triggerSource: RevisionTriggerSource;
  plannedAtIso: string;
  /** Matches planner or generation input hash when available. */
  inputSnapshotHash?: string | null;
};

export function isRevisionJobRepairPayloadV1(
  value: unknown
): value is RevisionJobRepairPayloadV1 {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.contractVersion === SCENE_REPAIR_REVISION_PAYLOAD_VERSION &&
    typeof o.repairMode === "string" &&
    Array.isArray(o.stalenessReasons)
  );
}

/** Prose QA: deterministic thresholds for warn / suggest / auto (generationText only). */
export const SCENE_REPAIR_PROSE_POLICY = {
  warnOnlyMaxCritical: 0,
  suggestRepairMinCritical: 1,
  autoRewriteMinCritical: 3,
} as const;
