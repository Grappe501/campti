import assert from "node:assert/strict";
import { test } from "node:test";

import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type { SceneResearchTabViewModel } from "@/lib/domain/scene-research-tab";
import type { SceneRunLedgerViewModel } from "@/lib/domain/scene-run-ledger";
import type { SceneRunOutcomeAnalyticsViewModel } from "@/lib/domain/scene-run-diff-analytics";
import {
  applySceneDecisionRecommendationSuppression,
  collectSceneDecisionRecommendations,
  type SceneDecisionAssistRuleContext,
} from "@/lib/services/scene-decision-assist-service";

function basePreflight(over: Partial<SceneGenerationPreflightViewModel["summary"]> = {}): SceneGenerationPreflightViewModel {
  return {
    contractVersion: "1",
    sceneId: "scene-test",
    summary: {
      overallReadinessClass: "ready",
      launchAllowance: "allowed",
      headline: "",
      evaluatedAtIso: "2026-01-01T00:00:00.000Z",
      primaryBlockerCount: 0,
      primaryRiskCount: 0,
      advisoryCount: 0,
      observationalCount: 0,
      ...over,
    },
    subsystems: [],
    blockers: [],
    risks: [],
    advisories: [],
    observations: [],
    inputTruth: {
      loadSucceeded: true,
      loadError: null,
      sceneId: "scene-test",
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
      hashScheme: "test",
      hashPreview: "abc",
      hashError: null,
      protectsSummary: "",
    },
    honestyBanner: "",
  };
}

function baseAnalytics(over: Partial<SceneRunOutcomeAnalyticsViewModel["summary"]> = {}): SceneRunOutcomeAnalyticsViewModel {
  return {
    contractVersion: "1",
    summary: {
      sceneId: "scene-test",
      totalRunsInWindow: 4,
      allowanceDistribution: { allowed: 2, allowed_with_risk: 1, blocked: 0, unknown: 0 },
      launchClassDistribution: {},
      launchSourceDistribution: {},
      machineRunCount: 1,
      interactiveRunCount: 2,
      rehearsalRunCount: 0,
      replayAttemptCount: 1,
      repairOrRevisionRunCount: 0,
      failedGenerationCount: 0,
      incompleteRunCount: 0,
      averageBlockerCount: 0,
      averageRiskCount: 0,
      averageAdvisoryCount: 0,
      legacyOrPartialRunCount: 0,
      ...over,
    },
    instabilitySignals: [],
    pressureSources: [],
    trend: {
      recentRunCount: 4,
      cleanLaunchShare: 0.5,
      riskyLaunchShare: 0.25,
      blockedLaunchShare: 0,
      trendNote: null,
    },
    advisoryNotes: [],
    currentGenerationTextStats: null,
  };
}

const emptyLedger: SceneRunLedgerViewModel = {
  summary: {
    sceneId: "scene-test",
    totalEntries: 0,
    entriesWithFullHistory: 0,
    legacyOrPartialCount: 0,
    contractVersion: "1",
  },
  entries: [],
};

function ctx(partial: Partial<SceneDecisionAssistRuleContext>): SceneDecisionAssistRuleContext {
  return {
    sceneId: "scene-test",
    preflight: basePreflight(),
    research: null,
    analytics: baseAnalytics(),
    ledger: emptyLedger,
    simRollup: null,
    materialRunDiff: false,
    failedRunsInWindow: 0,
    replayFailedPattern: false,
    partialHistoryCodes: [],
    ...partial,
  };
}

test("blocked preflight recommends review_preflight_blockers, not strong replay", () => {
  const preflight = basePreflight({ launchAllowance: "blocked", overallReadinessClass: "blocked" });
  preflight.blockers = [
    {
      id: "b1",
      subsystemKey: "execution_environment",
      title: "Missing OPENAI_API_KEY",
      explanation: "Env prerequisite",
      remediationGuidance: "Set key",
      remediationHref: null,
      remediationLabel: null,
    },
  ];
  const c = collectSceneDecisionRecommendations(
    ctx({
      preflight,
    }),
  );
  const primary = applySceneDecisionRecommendationSuppression("scene-test", c).set.primary;
  assert.equal(primary?.category, "review_preflight_blockers");
  const replay = c.find((r) => r.category === "replay_now");
  assert.ok(!replay || replay.strength === "informational" || replay.strength === "light");
});

test("blocking research contradiction recommends resolve_research_pressure_first", () => {
  const research = {
    contractVersion: "1" as const,
    scene: { id: "scene-test", chapterId: "c", title: "T", chapterTitle: "Ch" },
    summary: {
      acceptedCanonCount: 0,
      openClaimsCount: 3,
      contradictionShapedCount: 2,
      linkedTargetsCount: 1,
      lastRelevantDecisionAtIso: null,
      advisoryLabels: [],
    },
    contradictions: [
      {
        claimId: "x",
        claimTextPreview: "",
        comparisonId: "y",
        comparisonResult: "contradicts_canon",
        contradictionType: null,
        impactScope: null,
        affectedTargetType: null,
        affectedTargetId: null,
        severity: "blocking" as const,
        recommendedNextStep: "",
        honestyLabel: "approximate_contradiction_shape" as const,
      },
    ],
    acceptedCanon: [],
    acceptedCanonGrouped: [],
    linkedTargets: [],
    openClaims: [],
    sources: [],
    entityImpacts: [],
    decisionHistory: [],
    promptImpact: {
      ricreAcceptedCanonBundleLoaded: false,
      activeAcceptedCanonRecordCount: 0,
      ricrePromptBlockEligible: false,
      subordinationNote: "",
      honestyNotes: [],
    },
    hashImpact: { canonicalHashIncludesRicreBundle: false, explanation: "" },
    quickActions: {
      canCreateSceneTarget: false,
      canIngestForSceneTargets: false,
      hasSceneLinkedTargets: false,
      unresolvedClaimIds: [],
    },
    honestyBanner: "",
  } satisfies SceneResearchTabViewModel;

  const c = collectSceneDecisionRecommendations(ctx({ research }));
  const primary = applySceneDecisionRecommendationSuppression("scene-test", c).set.primary;
  assert.equal(primary?.category, "resolve_research_pressure_first");
  const researchAction = primary?.actions.find((a) => a.id === "a-rs-tab");
  assert.equal(researchAction?.sceneTab, "research");
});

test("simulation rollup blocked recommends resolve_character_simulation_first with workbench href", () => {
  const c = collectSceneDecisionRecommendations(
    ctx({
      simRollup: {
        contractVersion: "1",
        summaryLine: "blocked",
        validationFlags: [],
        perPerson: [
          {
            personId: "p1",
            displayName: "Alex",
            readinessImpact: "blocked",
            blockingConflicts: 1,
            advisoryConflicts: 0,
            workbenchHref: "/admin/people/p1/simulation-workbench",
          },
        ],
      },
    }),
  );
  const r = c.find((x) => x.category === "resolve_character_simulation_first");
  assert.ok(r);
  assert.ok(r!.actions.some((a) => a.href?.includes("/simulation-workbench")));
});

test("repair + replay churn recommends pause_relaunch_churn", () => {
  const c = collectSceneDecisionRecommendations(
    ctx({
      preflight: basePreflight(),
      analytics: baseAnalytics({
        repairOrRevisionRunCount: 4,
        replayAttemptCount: 6,
        allowanceDistribution: { allowed: 0, allowed_with_risk: 3, blocked: 0, unknown: 0 },
      }),
    }),
  );
  assert.ok(c.some((r) => r.category === "pause_relaunch_churn"));
});

test("suppression demotes replay when preflight dominates", () => {
  const preflight = basePreflight({ launchAllowance: "blocked", overallReadinessClass: "blocked" });
  preflight.blockers = [
    {
      id: "b1",
      subsystemKey: "governance",
      title: "Blocked",
      explanation: "",
      remediationGuidance: "",
      remediationHref: null,
      remediationLabel: null,
    },
  ];
  const candidates = collectSceneDecisionRecommendations(
    ctx({
      preflight,
      analytics: baseAnalytics({ failedGenerationCount: 0, allowanceDistribution: { allowed: 1, allowed_with_risk: 0, blocked: 0, unknown: 0 } }),
    }),
  );
  const { set } = applySceneDecisionRecommendationSuppression("scene-test", candidates);
  assert.equal(set.primary?.category, "review_preflight_blockers");
  assert.ok(!candidates.some((r) => r.category === "replay_now"));
});

test("research pressure demotes replay_now via suppression", () => {
  const research = {
    contractVersion: "1" as const,
    scene: { id: "scene-test", chapterId: "c", title: "T", chapterTitle: "Ch" },
    summary: {
      acceptedCanonCount: 0,
      openClaimsCount: 3,
      contradictionShapedCount: 3,
      linkedTargetsCount: 1,
      lastRelevantDecisionAtIso: null,
      advisoryLabels: [],
    },
    contradictions: [],
    acceptedCanon: [],
    acceptedCanonGrouped: [],
    linkedTargets: [],
    openClaims: [],
    sources: [],
    entityImpacts: [],
    decisionHistory: [],
    promptImpact: {
      ricreAcceptedCanonBundleLoaded: false,
      activeAcceptedCanonRecordCount: 0,
      ricrePromptBlockEligible: false,
      subordinationNote: "",
      honestyNotes: [],
    },
    hashImpact: { canonicalHashIncludesRicreBundle: false, explanation: "" },
    quickActions: {
      canCreateSceneTarget: false,
      canIngestForSceneTargets: false,
      hasSceneLinkedTargets: false,
      unresolvedClaimIds: [],
    },
    honestyBanner: "",
  } satisfies SceneResearchTabViewModel;

  const candidates = collectSceneDecisionRecommendations(
    ctx({
      research,
      preflight: basePreflight(),
      analytics: baseAnalytics({
        repairOrRevisionRunCount: 0,
        replayAttemptCount: 0,
        allowanceDistribution: { allowed: 3, allowed_with_risk: 0, blocked: 0, unknown: 0 },
      }),
    }),
  );
  const replayBefore = candidates.find((r) => r.category === "replay_now");
  assert.ok(replayBefore && replayBefore.strength === "moderate");
  const { set, suppressions } = applySceneDecisionRecommendationSuppression("scene-test", candidates);
  const replayAfter = [...(set.primary ? [set.primary] : []), ...set.secondary].find((r) => r.category === "replay_now");
  assert.ok(replayAfter && replayAfter.strength === "light");
  assert.ok(suppressions.some((s) => s.code === "research_pressure"));
});
