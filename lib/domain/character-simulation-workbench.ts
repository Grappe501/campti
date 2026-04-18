/**
 * Character Simulation Workbench — operator-facing view contracts (Cluster 9 extension).
 * Author-owned mind/voice payloads remain `CharacterMindProfile` / `CharacterVoiceProfile` partials on the Prisma bundle.
 */

import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile } from "@/lib/domain/character-voice";

/** Persisted in `CharacterSimulationAuthorBundle.workbenchMetaJson` (not a second simulation schema). */
export type CharacterSimulationWorkbenchMeta = {
  authorNotes?: string[];
  /** Operator-acknowledged advisory conflict ids (does not override blocking physics). */
  acceptedConflictIds?: string[];
};

export type CharacterSimulationAuthorEditableProfile = {
  mindPartial: Partial<CharacterMindProfile>;
  voicePartial: Partial<CharacterVoiceProfile>;
  authorNotes: string[];
};

export type CharacterSimulationDerivedProfile = {
  /** Deterministic seed before author overlay (system-derived baseline). */
  mind: CharacterMindProfile;
  voice: CharacterVoiceProfile;
};

export type CharacterSimulationMergedProfile = {
  mind: CharacterMindProfile;
  voice: CharacterVoiceProfile;
};

export const CHARACTER_SIMULATION_FIELD_STATUS_SOURCES = [
  "author_bundle",
  "seed_derivation",
  "runtime_derivation",
  "fallback_default",
  "unresolved_merge",
] as const;

export type CharacterSimulationFieldStatusSource = (typeof CHARACTER_SIMULATION_FIELD_STATUS_SOURCES)[number];

export type CharacterSimulationFieldStatus = {
  /** Coarse field group for inspectability (not every leaf key). */
  fieldGroup: string;
  label: string;
  source: CharacterSimulationFieldStatusSource;
  /** When author provided a patch key touching this group. */
  authorTouched: boolean;
  /** When merged output differs from pure seed for this group. */
  differsFromSeed: boolean;
};

export const CHARACTER_SIMULATION_CONFLICT_CATEGORIES = [
  "voice_register_conflict",
  "motivation_conflict",
  "temperament_conflict",
  "stress_response_conflict",
  "worldview_conflict",
  "timeline_truth_conflict",
  "identity_anchor_conflict",
  "merged_profile_instability",
  "speech_pattern_mismatch",
] as const;

export type CharacterSimulationConflictCategory = (typeof CHARACTER_SIMULATION_CONFLICT_CATEGORIES)[number];

export const CHARACTER_SIMULATION_CONFLICT_SEVERITIES = ["advisory", "warning", "blocking"] as const;
export type CharacterSimulationConflictSeverity = (typeof CHARACTER_SIMULATION_CONFLICT_SEVERITIES)[number];

export type CharacterSimulationConflictSourceComparison = {
  authorExcerpt: string | null;
  derivedExcerpt: string | null;
};

export type CharacterSimulationConflict = {
  id: string;
  category: CharacterSimulationConflictCategory;
  severity: CharacterSimulationConflictSeverity;
  affectedFields: string[];
  description: string;
  recommendedRemediation: string;
  sourceComparison: CharacterSimulationConflictSourceComparison;
  blocksGenerationReadiness: boolean;
  /** True when recorded in workbench meta as accepted (advisory only). */
  acceptedByOperator: boolean;
};

export type CharacterSimulationValidationIssue = {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type CharacterSimulationValidationResult = {
  ok: boolean;
  issues: CharacterSimulationValidationIssue[];
};

export type CharacterSimulationProvenanceRecord = {
  id: string;
  subject: string;
  source: CharacterSimulationFieldStatusSource;
  detail: string;
  recordedAtIso: string;
};

export const CHARACTER_SIMULATION_PREVIEW_MODES = [
  "inner_monologue",
  "spoken_response",
  "stress_response",
  "decision_bias",
  "interpersonal_reaction",
] as const;

export type CharacterSimulationPreviewMode = (typeof CHARACTER_SIMULATION_PREVIEW_MODES)[number];

export type CharacterSimulationPreviewRequest = {
  mode: CharacterSimulationPreviewMode;
  stimulus: string;
};

export type CharacterSimulationPreviewInfluence = {
  fieldGroup: string;
  weight: number;
  rationale: string;
};

export type CharacterSimulationPreviewResult = {
  text: string;
  completeness: number;
  confidenceLabel: "high" | "medium" | "low";
  truthBasis: "author" | "derived" | "merged";
  influences: CharacterSimulationPreviewInfluence[];
  driftWarnings: string[];
  deterministicPreviewId: string;
};

export type CharacterSimulationWorkbenchAuditEntry = {
  id: string;
  createdAtIso: string;
  action: string;
  summary: string;
  actorNote: string | null;
};

export type CharacterSimulationReadinessImpactLevel =
  | "ready"
  | "advisory_warning"
  | "downgrade_risk"
  | "blocked";

export type CharacterSimulationReadinessImpact = {
  level: CharacterSimulationReadinessImpactLevel;
  reasons: string[];
  remediation: string[];
};

export type CharacterSimulationDriftSummary = {
  unresolvedContradictionCount: number;
  advisoryContradictionCount: number;
  blockingContradictionCount: number;
  acceptedAdvisoryCount: number;
  migrationRequired: boolean;
  authorBundleMissing: boolean;
  notes: string[];
};

export type CharacterSimulationWorkbenchPersonHeader = {
  personId: string;
  name: string;
  recordType: string;
  simulationTruthSource: "persisted_author_partial" | "deterministic_seed_only" | "mixed_bundle";
  readinessImpact: CharacterSimulationReadinessImpact;
  lastAuthorBundleUpdatedAtIso: string | null;
  auditEntryCount: number;
};

export type CharacterSimulationWorkbenchViewModel = {
  contractVersion: "1";
  header: CharacterSimulationWorkbenchPersonHeader;
  authorEditable: CharacterSimulationAuthorEditableProfile;
  derived: CharacterSimulationDerivedProfile;
  merged: CharacterSimulationMergedProfile;
  fieldStatuses: CharacterSimulationFieldStatus[];
  conflicts: CharacterSimulationConflict[];
  validation: CharacterSimulationValidationResult;
  provenance: CharacterSimulationProvenanceRecord[];
  drift: CharacterSimulationDriftSummary;
  auditRecent: CharacterSimulationWorkbenchAuditEntry[];
  previewMetadata: {
    lastPreview: CharacterSimulationPreviewResult | null;
    honestCapabilityNote: string;
  };
};

export type CharacterSimulationWorkbenchSceneRollup = {
  contractVersion: "1";
  summaryLine: string;
  validationFlags: string[];
  perPerson: Array<{
    personId: string;
    displayName: string;
    readinessImpact: CharacterSimulationReadinessImpactLevel;
    blockingConflicts: number;
    advisoryConflicts: number;
    workbenchHref: string;
  }>;
};
