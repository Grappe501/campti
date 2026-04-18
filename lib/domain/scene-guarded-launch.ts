/**
 * Machine Guarded Launch Unification — launch classification and request shapes.
 * Readiness truth remains in preflight; this layer classifies how that truth is enforced.
 */

import type { SceneLaunchIntent } from "@/lib/domain/scene-launch-guard";

/** Version for machine-guarded launch audit meta — bump when classification semantics change. */
export const SCENE_GUARDED_LAUNCH_CONTRACT_VERSION = "1" as const;

/** How the launch was initiated and should be audited. */
export type SceneLaunchClass = "interactive" | "machine" | "rehearsal";

/** Origin surface for run-ledger / replay. */
export type SceneLaunchSource =
  | "interactive_ui"
  | "interactive_server_action"
  | "scene_repair_service"
  | "revision_job"
  | "draft_package_orchestration"
  | "cluster9_dry_run"
  | "run_ledger_replay"
  | "unknown_internal";

/** Which policy bundle was applied (for audit queryability). */
export type SceneLaunchPolicyMode =
  | "interactive_default"
  | "machine_default"
  | "machine_risk_elevation_allowed"
  | "rehearsal_non_launch"
  | "rehearsal_mutating"
  | "replay_interactive_guard";

/** How confirmation / elevation was satisfied — never impersonates human. */
export type SceneLaunchConfirmationMode =
  | "human_confirmed"
  | "human_not_required"
  | "machine_policy_allowed"
  | "machine_not_required"
  | "machine_policy_denied"
  | "rehearsal_non_launch"
  | "rehearsal_guarded";

export type SceneMachineLaunchPolicy = {
  /**
   * When false (default), machine/rehearsal mutating launches deny when preflight requires
   * human-style confirmation (allowed_with_risk or rehearsal_incomplete-style gates).
   */
  allowMachineRiskyLaunch: boolean;
};

/** Default automation posture: never auto-elevate risky launches without an explicit flag. */
export const DEFAULT_SCENE_MACHINE_LAUNCH_POLICY: SceneMachineLaunchPolicy = {
  allowMachineRiskyLaunch: false,
};

export type SceneRehearsalLaunchPolicy = {
  /** When false, only preflight + audit — no `runSceneGeneration`. */
  allowModelMutation: boolean;
};

export type SceneLaunchFreshnessBasis =
  | "interactive_client_digest"
  | "machine_execution_time"
  | "rehearsal_execution_time";

export type GuardedSceneLaunchRequest = {
  sceneId: string;
  intent: SceneLaunchIntent;
  launchClass: SceneLaunchClass;
  launchSource: SceneLaunchSource;
  freshnessBasis: SceneLaunchFreshnessBasis;
  /** Required when `freshnessBasis === "interactive_client_digest"`. */
  freshnessDigest?: string;
  /**
   * Interactive: human risk / rehearsal-incomplete acknowledgement.
   * Machine/rehearsal: must be false in production paths (audit honesty).
   */
  riskAcknowledged: boolean;
  saveGenerationText?: boolean;
  registerDependencies?: boolean;
  runProseQuality?: boolean;
  machinePolicy?: SceneMachineLaunchPolicy;
  rehearsalPolicy?: SceneRehearsalLaunchPolicy;
  auditMeta?: Record<string, unknown>;
  policyMode?: SceneLaunchPolicyMode;
};

export type SceneLaunchPolicyDecision =
  | {
      proceed: true;
      confirmationMode: SceneLaunchConfirmationMode;
      policyMode: SceneLaunchPolicyMode;
    }
  | {
      proceed: false;
      code: string;
      message: string;
      confirmationMode: SceneLaunchConfirmationMode;
      policyMode: SceneLaunchPolicyMode;
    };

export type SceneLaunchClassificationSummary = {
  launchClass: SceneLaunchClass;
  launchSource: SceneLaunchSource;
  policyMode: SceneLaunchPolicyMode;
  confirmationMode: SceneLaunchConfirmationMode;
  freshnessBasis: SceneLaunchFreshnessBasis;
};

export type GuardedSceneLaunchExecutionResult =
  | {
      ok: true;
      run: Awaited<ReturnType<typeof import("@/lib/services/scene-generation-service").runSceneGeneration>> | null;
      classification: SceneLaunchClassificationSummary;
    }
  | {
      ok: false;
      code: string;
      message: string;
      guard?: import("@/lib/domain/scene-launch-guard").SceneLaunchGuardResult;
      classification?: SceneLaunchClassificationSummary;
    };
