import { createHash } from "node:crypto";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import {
  DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
  SCENE_GUARDED_LAUNCH_CONTRACT_VERSION,
  type GuardedSceneLaunchExecutionResult,
  type GuardedSceneLaunchRequest,
  type SceneLaunchClassificationSummary,
  type SceneLaunchConfirmationMode,
  type SceneLaunchPolicyMode,
  type SceneLaunchSource,
  type SceneMachineLaunchPolicy,
} from "@/lib/domain/scene-guarded-launch";
import type {
  SceneLaunchGuardResult,
  SceneLaunchReadinessClass,
  SceneLaunchRemediationLink,
} from "@/lib/domain/scene-launch-guard";
import { SCENE_LAUNCH_GUARD_CONTRACT_VERSION } from "@/lib/domain/scene-launch-guard";
import { deriveLaunchConfirmationRequired } from "@/lib/domain/scene-launch-guard-policy";
import type { ConfirmAndLaunchSceneGenerationInput } from "@/lib/domain/scene-launch-guard-validation";
import {
  decideInteractiveLaunchProceed,
  decideMachineLaunchProceed,
  inferPolicyModeForRequest,
  machineLaunchRequiresRiskElevation,
} from "@/lib/domain/scene-machine-launch-policy";
import { CLUSTER9_REHEARSAL_MACHINE_POLICY } from "@/lib/domain/scene-rehearsal-launch-policy";
import { prisma } from "@/lib/prisma";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { runSceneGeneration, type RunSceneGenerationParams } from "@/lib/services/scene-generation-service";
import { writeSceneLaunchAudit } from "@/lib/services/scene-launch-audit-service";
import { persistSceneRunGenerationOutputRecord } from "@/lib/services/scene-run-generation-output-persist-service";
import { recordRecommendationServerFollowup } from "@/lib/services/scene-recommendation-learning-log-service";
import { recordLaunchOutcomeForRecommendationLearning } from "@/lib/services/scene-recommendation-outcome-linking-service";
import { computeSceneLedgerRunKey } from "@/lib/utils/scene-ledger-run-key";

function digestPrefix(d: string): string {
  return d.slice(0, 16);
}

export function computeSceneLaunchFreshnessDigest(vm: SceneGenerationPreflightViewModel): string {
  const payload = {
    sceneId: vm.sceneId,
    evaluatedAtIso: vm.summary.evaluatedAtIso,
    hashPreview: vm.hashSummary.hashPreview,
    hashComputed: vm.hashSummary.hashComputed,
    launchAllowance: vm.summary.launchAllowance,
    blockerCount: vm.summary.primaryBlockerCount,
    riskCount: vm.summary.primaryRiskCount,
    advisoryCount: vm.summary.advisoryCount,
    overallReadinessClass: vm.summary.overallReadinessClass,
    preflightContractVersion: vm.contractVersion,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function mapBlockers(vm: SceneGenerationPreflightViewModel) {
  return vm.blockers.map((b) => ({
    id: b.id,
    subsystemKey: b.subsystemKey,
    title: b.title,
    explanation: b.explanation,
    severity: "blocking" as const,
    launchImpact: "Canonical preflight marks this as a hard stop — generation would fail or corrupt comparability.",
    remediationText: b.remediationGuidance,
    remediationHref: b.remediationHref,
    remediationLabel: b.remediationLabel,
  }));
}

function mapRisks(vm: SceneGenerationPreflightViewModel) {
  return vm.risks.map((r) => ({
    id: r.id,
    subsystemKey: r.subsystemKey,
    title: r.title,
    explanation: r.explanation,
    severity: "downgrade" as const,
    launchImpact: "Model output may diverge from ideal truth pressure — review before treating as production-grade.",
    remediationText: "See linked surface; re-run preflight after remediation.",
    remediationHref: r.remediationHref ?? null,
    remediationLabel: r.remediationLabel ?? null,
  }));
}

function mapAdvisories(vm: SceneGenerationPreflightViewModel) {
  return vm.advisories.map((a) => ({
    id: a.id,
    subsystemKey: a.subsystemKey,
    title: a.title,
    explanation: a.explanation,
    launchImpact: "Informational — does not by itself force confirmation or block launch under current policy.",
  }));
}

function mapObservations(vm: SceneGenerationPreflightViewModel) {
  return vm.observations.map((o) => ({
    id: o.id,
    subsystemKey: o.subsystemKey,
    text: o.text,
  }));
}

function buildRemediationLinks(sceneId: string, vm: SceneGenerationPreflightViewModel): SceneLaunchRemediationLink[] {
  const links: SceneLaunchRemediationLink[] = [
    { id: "preflight", label: "Open Preflight tab", href: `/admin/scenes/${sceneId}?tab=preflight`, kind: "preflight" as const },
    { id: "research_tab", label: "Scene Research tab", href: `/admin/scenes/${sceneId}?tab=research`, kind: "research_tab" as const },
    {
      id: "research_wb",
      label: "Research workbench (scene filter)",
      href: `/admin/research?sceneId=${sceneId}`,
      kind: "research_workbench" as const,
    },
    {
      id: "cockpit",
      label: "Author cockpit (scene)",
      href: `/admin/narrative?scope=scene&sceneId=${sceneId}`,
      kind: "cockpit" as const,
    },
    { id: "scene_detail", label: "Scene detail (edit)", href: `/admin/scenes/${sceneId}`, kind: "scene_detail" as const },
    {
      id: "run_ledger",
      label: "Run ledger",
      href: `/admin/scenes/${sceneId}?tab=runs`,
      kind: "other" as const,
    },
  ];
  const firstSimRisk = vm.risks.find((r) => r.subsystemKey === "character_simulation" && r.remediationHref);
  if (firstSimRisk?.remediationHref) {
    links.push({
      id: "sim_wb",
      label: firstSimRisk.remediationLabel ?? "Character simulation workbench",
      href: firstSimRisk.remediationHref,
      kind: "simulation_workbench" as const,
    });
  }
  return links;
}

function hashSummaryLine(vm: SceneGenerationPreflightViewModel): string | null {
  if (!vm.hashSummary.hashComputed) return vm.hashSummary.hashError;
  return vm.hashSummary.hashPreview;
}

export function preflightVmToGuardResult(sceneTitle: string | null, vm: SceneGenerationPreflightViewModel): SceneLaunchGuardResult {
  const freshnessDigest = computeSceneLaunchFreshnessDigest(vm);
  const confirmationRequired = deriveLaunchConfirmationRequired({
    launchAllowance: vm.summary.launchAllowance,
    overallReadinessClass: vm.summary.overallReadinessClass as SceneLaunchReadinessClass,
  });
  return {
    contractVersion: SCENE_LAUNCH_GUARD_CONTRACT_VERSION,
    sceneId: vm.sceneId,
    sceneTitle,
    evaluatedAt: vm.summary.evaluatedAtIso,
    readinessClass: vm.summary.overallReadinessClass as SceneLaunchReadinessClass,
    launchAllowance: vm.summary.launchAllowance,
    confirmationRequired,
    blockers: mapBlockers(vm),
    risks: mapRisks(vm),
    advisories: mapAdvisories(vm),
    observations: mapObservations(vm),
    remediationLinks: buildRemediationLinks(vm.sceneId, vm),
    preflightVersionSummary: `preflight v${vm.contractVersion} · guard v${SCENE_LAUNCH_GUARD_CONTRACT_VERSION}`,
    inputHashSummary: hashSummaryLine(vm),
    freshnessDigest,
  };
}

/**
 * Canonical server-side launch guard — wraps `buildSceneGenerationPreflight` (no duplicate readiness engine).
 */
export async function evaluateSceneLaunchGuard(sceneId: string): Promise<SceneLaunchGuardResult | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, description: true },
  });
  if (!scene) return null;

  const vm = await buildSceneGenerationPreflight(sceneId);
  if (!vm) return null;

  const result = preflightVmToGuardResult(scene.description, vm);

  await writeSceneLaunchAudit({
    sceneId,
    eventType: "launch_guard_evaluated",
    launchAllowance: result.launchAllowance,
    freshnessDigestPrefix: digestPrefix(result.freshnessDigest),
    blockerCount: vm.summary.primaryBlockerCount,
    riskCount: vm.summary.primaryRiskCount,
    advisoryCount: vm.summary.advisoryCount,
    confirmationRequired: result.confirmationRequired,
    riskAcknowledged: false,
    guardEvaluatedAtIso: result.evaluatedAt,
    inputHashPreview: vm.hashSummary.hashPreview,
    finalAction: "evaluated",
    meta: { headline: vm.summary.headline },
  });

  return result;
}

function runSceneParamsForIntent(sceneId: string, intent: ConfirmAndLaunchSceneGenerationInput["intent"]): RunSceneGenerationParams {
  if (intent === "draft") {
    return {
      sceneId,
      inputOverride: { generationMode: "draft", generationPurpose: "author_draft" },
    };
  }
  if (intent === "rewrite") {
    return {
      sceneId,
      inputOverride: {
        generationMode: "rewrite",
        generationPurpose: "prose_rewrite",
        proseBasis: "generation_text",
      },
    };
  }
  if (intent === "repair") {
    return {
      sceneId,
      inputOverride: {
        generationMode: "repair",
        generationPurpose: "continuity_repair",
        proseBasis: "generation_text",
      },
    };
  }
  return { sceneId };
}

function mergeRunParams(
  sceneId: string,
  intent: ConfirmAndLaunchSceneGenerationInput["intent"],
  forwarded?: Omit<RunSceneGenerationParams, "sceneId">,
): RunSceneGenerationParams {
  const intentParams = runSceneParamsForIntent(sceneId, intent);
  const f = forwarded ?? {};
  const mergedOverride = {
    ...(f.inputOverride && typeof f.inputOverride === "object" ? f.inputOverride : {}),
    ...(intentParams.inputOverride && typeof intentParams.inputOverride === "object" ? intentParams.inputOverride : {}),
  };
  return {
    ...f,
    ...intentParams,
    sceneId,
    ...(Object.keys(mergedOverride).length ? { inputOverride: mergedOverride as RunSceneGenerationParams["inputOverride"] } : {}),
  };
}

function classificationSummary(
  request: GuardedSceneLaunchRequest,
  confirmationMode: SceneLaunchConfirmationMode,
  policyMode: SceneLaunchPolicyMode,
): SceneLaunchClassificationSummary {
  return {
    launchClass: request.launchClass,
    launchSource: request.launchSource,
    policyMode,
    confirmationMode,
    freshnessBasis: request.freshnessBasis,
  };
}

function auditClassFields(
  request: GuardedSceneLaunchRequest,
  confirmationMode: SceneLaunchConfirmationMode,
  policyMode: SceneLaunchPolicyMode,
) {
  return {
    launchClass: request.launchClass,
    launchSource: request.launchSource,
    policyMode,
    confirmationMode,
  };
}

function mergeAuditMeta(request: GuardedSceneLaunchRequest, extra?: Record<string, unknown>) {
  return { ...request.auditMeta, ...extra };
}

/**
 * Single execution core for interactive, machine, and rehearsal launches.
 * Rebuilds preflight, applies launch-class policy, audits, then calls `runSceneGeneration` when permitted.
 */
export async function executeGuardedSceneLaunch(
  request: GuardedSceneLaunchRequest,
  forwarded?: Omit<RunSceneGenerationParams, "sceneId">,
): Promise<GuardedSceneLaunchExecutionResult> {
  const humanAckStripped =
    request.launchClass !== "interactive" && request.riskAcknowledged
      ? true
      : false;
  const effectiveRiskAcknowledged = request.launchClass === "interactive" ? request.riskAcknowledged : false;

  const scene = await prisma.scene.findUnique({
    where: { id: request.sceneId },
    select: { id: true, description: true },
  });
  if (!scene) {
    return { ok: false, code: "scene_not_found", message: "Scene not found." };
  }

  const vm = await buildSceneGenerationPreflight(request.sceneId);
  if (!vm) {
    return { ok: false, code: "preflight_unavailable", message: "Preflight could not be built for this scene." };
  }

  const guardSnapshot = preflightVmToGuardResult(scene.description, vm);
  const freshDigest = guardSnapshot.freshnessDigest;
  const confirmationRequired = guardSnapshot.confirmationRequired;
  const machinePolicy = request.machinePolicy ?? DEFAULT_SCENE_MACHINE_LAUNCH_POLICY;
  const willMutate =
    request.launchClass !== "rehearsal" || (request.rehearsalPolicy?.allowModelMutation ?? true) !== false;

  if (request.launchClass === "rehearsal" && request.rehearsalPolicy?.allowModelMutation === false) {
    const policyMode: SceneLaunchPolicyMode = inferPolicyModeForRequest("rehearsal", machinePolicy, false, false);
    await writeSceneLaunchAudit({
      sceneId: request.sceneId,
      eventType: "rehearsal_non_launch_evaluated",
      launchAllowance: vm.summary.launchAllowance,
      freshnessDigestPrefix: digestPrefix(freshDigest),
      blockerCount: vm.summary.primaryBlockerCount,
      riskCount: vm.summary.primaryRiskCount,
      advisoryCount: vm.summary.advisoryCount,
      confirmationRequired,
      riskAcknowledged: false,
      guardEvaluatedAtIso: vm.summary.evaluatedAtIso,
      inputHashPreview: vm.hashSummary.hashPreview,
      finalAction: "rehearsal_no_mutation",
      intent: request.intent,
      meta: mergeAuditMeta(request, {
        humanAckStripped: humanAckStripped || undefined,
        serverDigestPrefix: digestPrefix(freshDigest),
        contractVersion: SCENE_GUARDED_LAUNCH_CONTRACT_VERSION,
      }),
      ...auditClassFields(request, "rehearsal_non_launch", policyMode),
    });
    return {
      ok: true,
      run: null,
      classification: classificationSummary(request, "rehearsal_non_launch", policyMode),
    };
  }

  if (request.freshnessBasis === "interactive_client_digest") {
    if (!request.freshnessDigest) {
      return { ok: false, code: "missing_freshness_digest", message: "Interactive launch requires freshnessDigest." };
    }
    if (freshDigest !== request.freshnessDigest) {
      const policyMode: SceneLaunchPolicyMode = request.policyMode ?? "interactive_default";
      await writeSceneLaunchAudit({
        sceneId: request.sceneId,
        eventType: "launch_rejected_stale",
        launchAllowance: vm.summary.launchAllowance,
        freshnessDigestPrefix: digestPrefix(request.freshnessDigest),
        blockerCount: vm.summary.primaryBlockerCount,
        riskCount: vm.summary.primaryRiskCount,
        advisoryCount: vm.summary.advisoryCount,
        confirmationRequired,
        riskAcknowledged: effectiveRiskAcknowledged,
        guardEvaluatedAtIso: vm.summary.evaluatedAtIso,
        inputHashPreview: vm.hashSummary.hashPreview,
        finalAction: "rejected_stale",
        errorMessage: "Freshness digest mismatch — scene preflight changed since evaluation.",
        intent: request.intent,
        meta: mergeAuditMeta(request, {
          clientDigestPrefix: digestPrefix(request.freshnessDigest),
          serverDigestPrefix: digestPrefix(freshDigest),
        }),
        ...auditClassFields(request, "human_not_required", policyMode),
      });
      return {
        ok: false,
        code: "stale_guard_state",
        message:
          "Launch aborted: preflight snapshot changed since this guard was evaluated. Re-run evaluation and confirm again.",
        guard: guardSnapshot,
        classification: classificationSummary(request, "human_not_required", policyMode),
      };
    }
  }

  type PolicyDec = ReturnType<typeof decideInteractiveLaunchProceed>;
  let policyDecision: PolicyDec;

  if (request.launchClass === "interactive") {
    policyDecision = decideInteractiveLaunchProceed(vm, { riskAcknowledged: effectiveRiskAcknowledged });
  } else {
    const machineDec = decideMachineLaunchProceed(vm, machinePolicy);
    const needsEl = machineLaunchRequiresRiskElevation(vm);
    if (request.launchClass === "rehearsal" && willMutate) {
      if (machineDec.proceed) {
        policyDecision = {
          proceed: true,
          confirmationMode: "rehearsal_guarded",
          policyMode: inferPolicyModeForRequest("rehearsal", machinePolicy, needsEl, true),
        };
      } else {
        policyDecision = {
          ...machineDec,
          policyMode: inferPolicyModeForRequest("rehearsal", machinePolicy, needsEl, true),
        };
      }
    } else {
      policyDecision = machineDec;
    }
  }

  if (!policyDecision.proceed) {
    const evt =
      policyDecision.code === "launch_blocked"
        ? "launch_blocked"
        : policyDecision.code === "machine_policy_denied_risk"
          ? "launch_rejected_machine_policy"
          : "launch_rejected_confirmation_required";
    await writeSceneLaunchAudit({
      sceneId: request.sceneId,
      eventType: evt,
      launchAllowance: vm.summary.launchAllowance,
      freshnessDigestPrefix: digestPrefix(freshDigest),
      blockerCount: vm.summary.primaryBlockerCount,
      riskCount: vm.summary.primaryRiskCount,
      advisoryCount: vm.summary.advisoryCount,
      confirmationRequired,
      riskAcknowledged: effectiveRiskAcknowledged,
      guardEvaluatedAtIso: vm.summary.evaluatedAtIso,
      inputHashPreview: vm.hashSummary.hashPreview,
      finalAction:
        policyDecision.code === "launch_blocked"
          ? "rejected_blocked"
          : policyDecision.code === "machine_policy_denied_risk"
            ? "rejected_machine_policy"
            : "rejected_missing_confirmation",
      intent: request.intent,
      errorMessage: policyDecision.message !== vm.summary.headline ? policyDecision.message.slice(0, 4000) : undefined,
      meta: mergeAuditMeta(request, { humanAckStripped: humanAckStripped || undefined }),
      ...auditClassFields(request, policyDecision.confirmationMode, policyDecision.policyMode),
    });
    return {
      ok: false,
      code: policyDecision.code,
      message: policyDecision.message,
      guard: guardSnapshot,
      classification: classificationSummary(
        request,
        policyDecision.confirmationMode,
        policyDecision.policyMode,
      ),
    };
  }

  const { confirmationMode, policyMode } = policyDecision;

  const params: RunSceneGenerationParams = {
    ...mergeRunParams(request.sceneId, request.intent, forwarded),
    ...(request.saveGenerationText !== undefined ? { saveGenerationText: request.saveGenerationText } : {}),
    ...(request.registerDependencies !== undefined ? { registerDependencies: request.registerDependencies } : {}),
    ...(request.runProseQuality !== undefined ? { runProseQuality: request.runProseQuality } : {}),
  };

  const startAudit = await writeSceneLaunchAudit({
    sceneId: request.sceneId,
    eventType: "launch_confirmed_and_started",
    launchAllowance: vm.summary.launchAllowance,
    freshnessDigestPrefix: digestPrefix(freshDigest),
    blockerCount: vm.summary.primaryBlockerCount,
    riskCount: vm.summary.primaryRiskCount,
    advisoryCount: vm.summary.advisoryCount,
    confirmationRequired,
    riskAcknowledged: effectiveRiskAcknowledged,
    guardEvaluatedAtIso: vm.summary.evaluatedAtIso,
    inputHashPreview: vm.hashSummary.hashPreview,
    finalAction: "generation_started",
    intent: request.intent,
    meta: mergeAuditMeta(request, {
      humanAckStripped: humanAckStripped || undefined,
      serverDigestPrefix: digestPrefix(freshDigest),
    }),
    ...auditClassFields(request, confirmationMode, policyMode),
  });

  const ledgerRunKey =
    startAudit != null ? computeSceneLedgerRunKey(request.sceneId, startAudit.id, startAudit.createdAt.getTime()) : null;

  if (startAudit) {
    void recordRecommendationServerFollowup(request.sceneId, "launched_new_run");
  }

  try {
    const run = await runSceneGeneration(params);
    const endAudit = await writeSceneLaunchAudit({
      sceneId: request.sceneId,
      eventType:
        vm.summary.launchAllowance === "allowed_with_risk"
          ? "launch_allowed_with_risk_completed"
          : "launch_allowed_clean_completed",
      launchAllowance: vm.summary.launchAllowance,
      freshnessDigestPrefix: digestPrefix(freshDigest),
      blockerCount: vm.summary.primaryBlockerCount,
      riskCount: vm.summary.primaryRiskCount,
      advisoryCount: vm.summary.advisoryCount,
      confirmationRequired,
      riskAcknowledged: effectiveRiskAcknowledged,
      guardEvaluatedAtIso: vm.summary.evaluatedAtIso,
      inputHashPreview: vm.hashSummary.hashPreview,
      finalAction: "generation_finished",
      intent: request.intent,
      meta: mergeAuditMeta(request, {
        cluster7RunId: run.cluster7RuntimeTruth?.runId ?? null,
        ...(ledgerRunKey ? { ledgerRunKey } : {}),
      }),
      ...auditClassFields(request, confirmationMode, policyMode),
    });

    if (ledgerRunKey && startAudit) {
      await persistSceneRunGenerationOutputRecord({
        sceneId: request.sceneId,
        ledgerRunKey,
        startAuditId: startAudit.id,
        endAuditId: endAudit?.id ?? null,
        cluster7RunId: run.cluster7RuntimeTruth?.runId ?? null,
        generatedText: run.output.generatedText,
        saveGenerationTextRequested: params.saveGenerationText === true,
        savedToScene: run.savedGenerationText === true,
        generationTextSaveBlockedByRealism: run.generationTextSaveBlockedByRealism === true,
        generationTextSaveBlockedByHumanGravity: run.generationTextSaveBlockedByHumanGravity === true,
        launchClass: request.launchClass,
        launchSource: request.launchSource,
        intent: request.intent,
      });
    }

    if (ledgerRunKey && startAudit && endAudit) {
      await recordLaunchOutcomeForRecommendationLearning({
        sceneId: request.sceneId,
        startAuditCreatedAt: startAudit.createdAt,
        startAuditId: startAudit.id,
        endAuditId: endAudit.id,
        ledgerRunKey,
        launchAllowance: vm.summary.launchAllowance,
        generationSucceeded: true,
      });
    }

    return {
      ok: true,
      run,
      classification: classificationSummary(request, confirmationMode, policyMode),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const failAudit = await writeSceneLaunchAudit({
      sceneId: request.sceneId,
      eventType: "launch_generation_failed",
      launchAllowance: vm.summary.launchAllowance,
      freshnessDigestPrefix: digestPrefix(freshDigest),
      finalAction: "generation_threw",
      intent: request.intent,
      errorMessage: msg.slice(0, 4000),
      ...auditClassFields(request, confirmationMode, policyMode),
    });
    if (ledgerRunKey && startAudit) {
      await recordLaunchOutcomeForRecommendationLearning({
        sceneId: request.sceneId,
        startAuditCreatedAt: startAudit.createdAt,
        startAuditId: startAudit.id,
        endAuditId: failAudit?.id ?? null,
        ledgerRunKey,
        launchAllowance: vm.summary.launchAllowance,
        generationSucceeded: false,
      });
    }
    return { ok: false, code: "generation_failed", message: msg, classification: classificationSummary(request, confirmationMode, policyMode) };
  }
}

export async function executeMachineGuardedSceneLaunch(
  input: {
    sceneId: string;
    intent: ConfirmAndLaunchSceneGenerationInput["intent"];
    launchSource: SceneLaunchSource;
    machinePolicy?: SceneMachineLaunchPolicy;
    saveGenerationText?: boolean;
    registerDependencies?: boolean;
    runProseQuality?: boolean;
    runSocialPressureAdvisory?: boolean;
    runHumanizationAdvisory?: boolean;
    auditMeta?: Record<string, unknown>;
  },
  forwarded?: Omit<RunSceneGenerationParams, "sceneId">,
): Promise<GuardedSceneLaunchExecutionResult> {
  return executeGuardedSceneLaunch(
    {
      sceneId: input.sceneId,
      intent: input.intent,
      launchClass: "machine",
      launchSource: input.launchSource,
      freshnessBasis: "machine_execution_time",
      riskAcknowledged: false,
      saveGenerationText: input.saveGenerationText,
      registerDependencies: input.registerDependencies,
      runProseQuality: input.runProseQuality,
      machinePolicy: input.machinePolicy ?? DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
      auditMeta: input.auditMeta,
    },
    {
      ...forwarded,
      runSocialPressureAdvisory: forwarded?.runSocialPressureAdvisory ?? input.runSocialPressureAdvisory,
      runHumanizationAdvisory: forwarded?.runHumanizationAdvisory ?? input.runHumanizationAdvisory,
    },
  );
}

export async function executeRehearsalGuardedSceneLaunch(
  input: {
    sceneId: string;
    intent: ConfirmAndLaunchSceneGenerationInput["intent"];
    launchSource: "cluster9_dry_run";
    allowModelMutation: boolean;
    machinePolicy?: SceneMachineLaunchPolicy;
    saveGenerationText?: boolean;
    registerDependencies?: boolean;
    runProseQuality?: boolean;
    runSocialPressureAdvisory?: boolean;
    runHumanizationAdvisory?: boolean;
    auditMeta?: Record<string, unknown>;
  },
  forwarded?: Omit<RunSceneGenerationParams, "sceneId">,
): Promise<GuardedSceneLaunchExecutionResult> {
  return executeGuardedSceneLaunch(
    {
      sceneId: input.sceneId,
      intent: input.intent,
      launchClass: "rehearsal",
      launchSource: input.launchSource,
      freshnessBasis: "rehearsal_execution_time",
      riskAcknowledged: false,
      rehearsalPolicy: { allowModelMutation: input.allowModelMutation },
      machinePolicy: input.machinePolicy ?? CLUSTER9_REHEARSAL_MACHINE_POLICY,
      saveGenerationText: input.saveGenerationText,
      registerDependencies: input.registerDependencies,
      runProseQuality: input.runProseQuality,
      auditMeta: input.auditMeta,
    },
    {
      ...forwarded,
      runSocialPressureAdvisory: forwarded?.runSocialPressureAdvisory ?? input.runSocialPressureAdvisory,
      runHumanizationAdvisory: forwarded?.runHumanizationAdvisory ?? input.runHumanizationAdvisory,
    },
  );
}

/**
 * Interactive confirm path — verifies client freshness digest and human acknowledgement rules.
 */
export async function executeSceneLaunchAfterGuard(
  input: ConfirmAndLaunchSceneGenerationInput,
  forwarded?: Omit<RunSceneGenerationParams, "sceneId">,
): Promise<
  | { ok: true; run: Awaited<ReturnType<typeof runSceneGeneration>> }
  | { ok: false; code: string; message: string; guard?: SceneLaunchGuardResult }
> {
  const r = await executeGuardedSceneLaunch(
    {
      sceneId: input.sceneId,
      intent: input.intent,
      launchClass: "interactive",
      launchSource: "interactive_server_action",
      freshnessBasis: "interactive_client_digest",
      freshnessDigest: input.freshnessDigest,
      riskAcknowledged: input.riskAcknowledged,
      saveGenerationText: input.saveGenerationText,
      registerDependencies: input.registerDependencies,
      runProseQuality: input.runProseQuality,
      policyMode: "interactive_default",
    },
    forwarded,
  );
  if (!r.ok) {
    return { ok: false, code: r.code, message: r.message, guard: r.guard };
  }
  if (!r.run) {
    return { ok: false, code: "internal_no_run", message: "Interactive launch produced no generation run." };
  }
  return { ok: true, run: r.run };
}
