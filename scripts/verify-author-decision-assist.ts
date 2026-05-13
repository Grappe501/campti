/**
 * Author Decision Assist — static verification.
 * Run: npx tsx scripts/verify-author-decision-assist.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import assert from "node:assert/strict";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type { SceneRunLedgerViewModel } from "@/lib/domain/scene-run-ledger";
import type { SceneRunOutcomeAnalyticsViewModel } from "@/lib/domain/scene-run-diff-analytics";
import {
  applySceneDecisionRecommendationSuppression,
  collectSceneDecisionRecommendations,
  type SceneDecisionAssistRuleContext,
} from "@/lib/services/scene-decision-assist-service";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf-8");
}

function smokeBlockedPreflight(): void {
  const preflight: SceneGenerationPreflightViewModel = {
    contractVersion: "1",
    sceneId: "verify",
    summary: {
      overallReadinessClass: "blocked",
      launchAllowance: "blocked",
      headline: "",
      evaluatedAtIso: "",
      primaryBlockerCount: 1,
      primaryRiskCount: 0,
      advisoryCount: 0,
      observationalCount: 0,
    },
    subsystems: [],
    blockers: [
      {
        id: "b",
        subsystemKey: "execution_environment",
        title: "verify blocker",
        explanation: "",
        remediationGuidance: "",
        remediationHref: null,
        remediationLabel: null,
      },
    ],
    risks: [],
    advisories: [],
    observations: [],
    inputTruth: {
      loadSucceeded: true,
      loadError: null,
      sceneId: "verify",
      chapterId: null,
      participatingPeopleCount: 0,
      placesCount: 0,
      narrativeSourceIdsCount: 0,
      ricreBundlePresent: false,
      ricreRecordCount: 0,
      contractValidated: true,
    },
    hashSummary: {
      hashComputed: false,
      hashScheme: null,
      hashPreview: null,
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
  const analytics: SceneRunOutcomeAnalyticsViewModel = {
    contractVersion: "1",
    summary: {
      sceneId: "verify",
      totalRunsInWindow: 0,
      allowanceDistribution: { allowed: 0, allowed_with_risk: 0, blocked: 0, unknown: 0 },
      launchClassDistribution: {},
      launchSourceDistribution: {},
      machineRunCount: 0,
      interactiveRunCount: 0,
      rehearsalRunCount: 0,
      replayAttemptCount: 0,
      repairOrRevisionRunCount: 0,
      failedGenerationCount: 0,
      incompleteRunCount: 0,
      averageBlockerCount: null,
      averageRiskCount: null,
      averageAdvisoryCount: null,
      legacyOrPartialRunCount: 0,
    },
    instabilitySignals: [],
    pressureSources: [],
    trend: {
      recentRunCount: 0,
      cleanLaunchShare: null,
      riskyLaunchShare: null,
      blockedLaunchShare: null,
      trendNote: null,
    },
    advisoryNotes: [],
    currentGenerationTextStats: null,
  };
  const ledger: SceneRunLedgerViewModel = {
    summary: {
      sceneId: "verify",
      totalEntries: 0,
      entriesWithFullHistory: 0,
      legacyOrPartialCount: 0,
      contractVersion: "1",
    },
    entries: [],
  };
  const ctx: SceneDecisionAssistRuleContext = {
    sceneId: "verify",
    preflight,
    research: null,
    analytics,
    ledger,
    simRollup: null,
    materialRunDiff: false,
    boundedLatestPairDiff: null,
    outputChurnMaterial: false,
    outputChurnPersistentDrift: false,
    boundedOutputEvidenceLine: null,
    failedRunsInWindow: 0,
    replayFailedPattern: false,
    partialHistoryCodes: [],
  };
  const c = collectSceneDecisionRecommendations(ctx);
  const { set } = applySceneDecisionRecommendationSuppression("verify", c);
  assert.equal(set.primary?.category, "review_preflight_blockers");
}

function smokeReplayCandidate(): void {
  const preflight: SceneGenerationPreflightViewModel = {
    contractVersion: "1",
    sceneId: "verify",
    summary: {
      overallReadinessClass: "ready",
      launchAllowance: "allowed",
      headline: "",
      evaluatedAtIso: "",
      primaryBlockerCount: 0,
      primaryRiskCount: 0,
      advisoryCount: 0,
      observationalCount: 0,
    },
    subsystems: [],
    blockers: [],
    risks: [],
    advisories: [],
    observations: [],
    inputTruth: {
      loadSucceeded: true,
      loadError: null,
      sceneId: "verify",
      chapterId: null,
      participatingPeopleCount: 0,
      placesCount: 0,
      narrativeSourceIdsCount: 0,
      ricreBundlePresent: false,
      ricreRecordCount: 0,
      contractValidated: true,
    },
    hashSummary: {
      hashComputed: true,
      hashScheme: "x",
      hashPreview: "x",
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
  const analytics: SceneRunOutcomeAnalyticsViewModel = {
    contractVersion: "1",
    summary: {
      sceneId: "verify",
      totalRunsInWindow: 4,
      allowanceDistribution: { allowed: 3, allowed_with_risk: 0, blocked: 0, unknown: 0 },
      launchClassDistribution: {},
      launchSourceDistribution: {},
      machineRunCount: 0,
      interactiveRunCount: 0,
      rehearsalRunCount: 0,
      replayAttemptCount: 0,
      repairOrRevisionRunCount: 0,
      failedGenerationCount: 0,
      incompleteRunCount: 0,
      averageBlockerCount: 0,
      averageRiskCount: 0,
      averageAdvisoryCount: 0,
      legacyOrPartialRunCount: 0,
    },
    instabilitySignals: [],
    pressureSources: [],
    trend: {
      recentRunCount: 4,
      cleanLaunchShare: 1,
      riskyLaunchShare: 0,
      blockedLaunchShare: 0,
      trendNote: null,
    },
    advisoryNotes: [],
    currentGenerationTextStats: null,
  };
  const ledger: SceneRunLedgerViewModel = {
    summary: {
      sceneId: "verify",
      totalEntries: 4,
      entriesWithFullHistory: 4,
      legacyOrPartialCount: 0,
      contractVersion: "1",
    },
    entries: [],
  };
  const ctx: SceneDecisionAssistRuleContext = {
    sceneId: "verify",
    preflight,
    research: null,
    analytics,
    ledger,
    simRollup: null,
    materialRunDiff: false,
    boundedLatestPairDiff: null,
    outputChurnMaterial: false,
    outputChurnPersistentDrift: false,
    boundedOutputEvidenceLine: null,
    failedRunsInWindow: 0,
    replayFailedPattern: false,
    partialHistoryCodes: [],
  };
  const c = collectSceneDecisionRecommendations(ctx);
  assert.ok(c.some((r) => r.category === "replay_now"));
}

async function main() {
  const svc = read("lib/services/scene-decision-assist-service.ts");
  assert.ok(svc.includes("buildSceneDecisionAssistViewModel"), "service entry");
  assert.ok(svc.includes("applySceneDecisionRecommendationSuppression"), "suppression");
  assert.ok(svc.includes("logRecommendationShownFromAssistInput"), "recommendation learning log");
  assert.ok(svc.includes("applyEffectivenessToRecommendationSet"), "recommendation effectiveness merge");

  const domain = read("lib/domain/scene-decision-assist.ts");
  assert.ok(domain.includes("SceneDecisionRecommendationCategory"), "taxonomy");
  assert.ok(domain.includes("learningAugmentation"), "learning augmentation on recommendations");

  const action = read("app/actions/scene-decision-assist.ts");
  assert.ok(action.includes("loadSceneDecisionAssistAction"), "server action");

  const ui = read("components/admin/scene-decision-assist-client.tsx");
  assert.ok(ui.includes("Decision assist"), "UI");

  const page = read("app/admin/scenes/[id]/page.tsx");
  assert.ok(page.includes("tab=assist"), "scene assist tab route");

  smokeBlockedPreflight();
  smokeReplayCandidate();

  console.log("[verify-author-decision-assist] OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
