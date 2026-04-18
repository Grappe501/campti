/**
 * Scene Generation Preflight — canonical launch-readiness view models (no shadow scoring).
 */

export const SCENE_GENERATION_PREFLIGHT_CONTRACT_VERSION = "1" as const;

export type SceneGenerationSubsystemKey =
  | "scene_input"
  | "canonical_hash"
  | "governance"
  | "human_gravity"
  | "character_simulation"
  | "research_canon"
  | "prompt_assembly"
  | "execution_environment"
  | "final_execution_truth";

export type SceneGenerationReadinessClass =
  | "ready"
  | "ready_with_advisories"
  | "downgrade_risk"
  | "blocked"
  | "observational_only"
  | "rehearsal_incomplete";

export type SceneGenerationLaunchAllowance = "allowed" | "allowed_with_risk" | "blocked";

export type SceneGenerationSubsystemStatus = {
  subsystemKey: SceneGenerationSubsystemKey;
  readinessClass: SceneGenerationReadinessClass;
  title: string;
  explanation: string;
  evidenceSummary: string;
  isBlocker: boolean;
  isDowngradeRisk: boolean;
  isAdvisory: boolean;
  isObservationalOnly: boolean;
  remediationGuidance: string | null;
  remediationHref: string | null;
  remediationLabel: string | null;
};

export type SceneGenerationBlocker = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
  remediationGuidance: string;
  remediationHref: string | null;
  remediationLabel: string | null;
};

export type SceneGenerationRisk = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
  remediationHref: string | null;
  remediationLabel: string | null;
};

export type SceneGenerationAdvisory = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
};

export type SceneGenerationObservation = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  text: string;
};

export type SceneGenerationHashSummary = {
  hashComputed: boolean;
  hashScheme: string | null;
  hashPreview: string | null;
  hashError: string | null;
  protectsSummary: string;
};

export type SceneGenerationInputTruthSummary = {
  loadSucceeded: boolean;
  loadError: string | null;
  sceneId: string;
  chapterId: string | null;
  participatingPeopleCount: number;
  placesCount: number;
  narrativeSourceIdsCount: number;
  ricreBundlePresent: boolean;
  ricreRecordCount: number;
  contractValidated: boolean;
};

export type SceneGenerationPreflightSummary = {
  overallReadinessClass: SceneGenerationReadinessClass;
  launchAllowance: SceneGenerationLaunchAllowance;
  headline: string;
  evaluatedAtIso: string;
  primaryBlockerCount: number;
  primaryRiskCount: number;
  advisoryCount: number;
  observationalCount: number;
};

export type SceneGenerationPreflightViewModel = {
  contractVersion: typeof SCENE_GENERATION_PREFLIGHT_CONTRACT_VERSION;
  sceneId: string;
  summary: SceneGenerationPreflightSummary;
  subsystems: SceneGenerationSubsystemStatus[];
  blockers: SceneGenerationBlocker[];
  risks: SceneGenerationRisk[];
  advisories: SceneGenerationAdvisory[];
  observations: SceneGenerationObservation[];
  inputTruth: SceneGenerationInputTruthSummary;
  hashSummary: SceneGenerationHashSummary;
  honestyBanner: string;
};
