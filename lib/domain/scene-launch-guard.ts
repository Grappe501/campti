/**
 * Scene Launch Guard — canonical enforcement layer between preflight truth and generation execution.
 * Aligns with `SceneGenerationPreflightViewModel` vocabulary; does not duplicate readiness scoring.
 */

import type { SceneGenerationSubsystemKey } from "@/lib/domain/scene-generation-preflight";

export const SCENE_LAUNCH_GUARD_CONTRACT_VERSION = "1" as const;

export type SceneLaunchSeverity = "blocking" | "downgrade" | "advisory" | "observational";

export type SceneLaunchReadinessClass =
  | "ready"
  | "ready_with_advisories"
  | "downgrade_risk"
  | "blocked"
  | "observational_only"
  | "rehearsal_incomplete";

export type SceneLaunchAllowance = "allowed" | "allowed_with_risk" | "blocked";

export type SceneLaunchBlocker = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
  severity: SceneLaunchSeverity;
  /** Why generation must not proceed without remediation. */
  launchImpact: string;
  remediationText: string;
  remediationHref: string | null;
  remediationLabel: string | null;
};

export type SceneLaunchRisk = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
  severity: SceneLaunchSeverity;
  /** Quality / truth / reliability impact if launch proceeds. */
  launchImpact: string;
  remediationText: string;
  remediationHref: string | null;
  remediationLabel: string | null;
};

export type SceneLaunchAdvisory = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  title: string;
  explanation: string;
  launchImpact: string;
};

export type SceneLaunchObservation = {
  id: string;
  subsystemKey: SceneGenerationSubsystemKey;
  text: string;
};

export type SceneLaunchRemediationLink = {
  id: string;
  label: string;
  href: string;
  kind: "preflight" | "research_tab" | "research_workbench" | "simulation_workbench" | "cockpit" | "scene_detail" | "other";
};

/** Server-evaluated gate — single authority for launch UI and confirm path. */
export type SceneLaunchGuardResult = {
  contractVersion: typeof SCENE_LAUNCH_GUARD_CONTRACT_VERSION;
  sceneId: string;
  sceneTitle: string | null;
  evaluatedAt: string;
  readinessClass: SceneLaunchReadinessClass;
  launchAllowance: SceneLaunchAllowance;
  confirmationRequired: boolean;
  blockers: SceneLaunchBlocker[];
  risks: SceneLaunchRisk[];
  advisories: SceneLaunchAdvisory[];
  observations: SceneLaunchObservation[];
  remediationLinks: SceneLaunchRemediationLink[];
  preflightVersionSummary: string;
  inputHashSummary: string | null;
  /** Sha256 hex over canonical preflight snapshot fields — must match on confirm. */
  freshnessDigest: string;
};

export type SceneLaunchDecision =
  | "launch_allowed_clean"
  | "launch_allowed_with_risk_confirmed"
  | "launch_blocked"
  | "launch_cancelled"
  | "launch_rejected_stale"
  | "launch_rejected_confirmation_required"
  | "launch_guard_evaluated"
  | "launch_generation_started"
  | "launch_generation_failed";

export type SceneLaunchAttemptRecord = {
  sceneId: string;
  evaluatedAt: string;
  freshnessDigest: string;
  launchAllowance: SceneLaunchAllowance;
  confirmationRequired: boolean;
  riskAcknowledged: boolean;
  intent: SceneLaunchIntent;
};

export type SceneLaunchIntent = "full_generation" | "draft" | "rewrite" | "repair";

export type SceneLaunchProceedInput = {
  sceneId: string;
  freshnessDigest: string;
  riskAcknowledged: boolean;
  intent: SceneLaunchIntent;
};

export type SceneLaunchConfirmInput = SceneLaunchProceedInput;

export type SceneLaunchAuditSummary = {
  eventType: string;
  sceneId: string;
  createdAtIso: string;
  launchAllowance: SceneLaunchAllowance | null;
  finalAction: string | null;
};

/** Payload supplied with `actionRunSceneGeneration` after a successful guard evaluation. */
export type SceneGenerationLaunchGuardPayload = {
  freshnessDigest: string;
  riskAcknowledged: boolean;
};
