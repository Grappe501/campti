import type {
  SceneRunInstabilitySignal,
  SceneRunOutcomeAnalyticsViewModel,
  SceneRunAnalyticsSummary,
  SceneRunPressureSourceSummary,
  SceneRunTrendSummary,
} from "@/lib/domain/scene-run-diff-analytics";
import { SCENE_RUN_DIFF_ANALYTICS_VERSION } from "@/lib/domain/scene-run-diff-analytics";
import { prisma } from "@/lib/prisma";
import { loadSceneRunLedger } from "@/lib/services/scene-run-ledger-service";

function countParagraphs(text: string): number {
  const parts = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return parts.length > 0 ? parts.length : text.trim() ? 1 : 0;
}

export async function countReplayAuditEvents(sceneId: string): Promise<number> {
  return prisma.sceneLaunchAuditLog.count({
    where: {
      sceneId,
      eventType: { startsWith: "replay_" },
    },
  });
}

function emptyAllowanceDistribution(): SceneRunAnalyticsSummary["allowanceDistribution"] {
  return { allowed: 0, allowed_with_risk: 0, blocked: 0, unknown: 0 };
}

export async function buildSceneRunOutcomeAnalytics(
  sceneId: string,
  maxEntries = 80,
): Promise<SceneRunOutcomeAnalyticsViewModel> {
  const { entries } = await loadSceneRunLedger(sceneId, maxEntries);
  const replayAttemptCount = await countReplayAuditEvents(sceneId);

  const allowanceDistribution = emptyAllowanceDistribution();
  const launchClassDistribution: Record<string, number> = {};
  const launchSourceDistribution: Record<string, number> = {};
  let machineRunCount = 0;
  let interactiveRunCount = 0;
  let rehearsalRunCount = 0;
  let repairOrRevisionRunCount = 0;
  let failedGenerationCount = 0;
  let incompleteRunCount = 0;
  let legacyOrPartialRunCount = 0;
  let sumBlockers = 0;
  let sumRisks = 0;
  let sumAdvisories = 0;
  let nCounts = 0;

  for (const e of entries) {
    const al = e.historicalGuard.launchAllowance;
    if (al === "allowed") allowanceDistribution.allowed++;
    else if (al === "allowed_with_risk") allowanceDistribution.allowed_with_risk++;
    else if (al === "blocked") allowanceDistribution.blocked++;
    else allowanceDistribution.unknown++;

    const lc = e.audit.launchClass ?? "unknown";
    launchClassDistribution[lc] = (launchClassDistribution[lc] ?? 0) + 1;
    const ls = e.audit.launchSource ?? "unknown";
    launchSourceDistribution[ls] = (launchSourceDistribution[ls] ?? 0) + 1;

    if (e.audit.launchClass === "machine") machineRunCount++;
    if (e.audit.launchClass === "interactive") interactiveRunCount++;
    if (e.audit.launchClass === "rehearsal") rehearsalRunCount++;

    if (e.audit.launchSource === "revision_job" || e.audit.launchSource === "scene_repair_service") {
      repairOrRevisionRunCount++;
    }

    if (e.output.generationFailed) failedGenerationCount++;
    if (e.output.generationStarted && !e.output.generationFinished && !e.output.generationFailed) incompleteRunCount++;
    if (e.historyCompleteness !== "full") legacyOrPartialRunCount++;

    if (e.historicalGuard.blockerCount != null) {
      sumBlockers += e.historicalGuard.blockerCount;
      nCounts++;
    }
    if (e.historicalGuard.riskCount != null) sumRisks += e.historicalGuard.riskCount;
    if (e.historicalGuard.advisoryCount != null) sumAdvisories += e.historicalGuard.advisoryCount;
  }

  const total = entries.length;
  const summary: SceneRunAnalyticsSummary = {
    sceneId,
    totalRunsInWindow: total,
    allowanceDistribution,
    launchClassDistribution,
    launchSourceDistribution,
    machineRunCount,
    interactiveRunCount,
    rehearsalRunCount,
    replayAttemptCount,
    repairOrRevisionRunCount,
    failedGenerationCount,
    incompleteRunCount,
    averageBlockerCount: nCounts ? sumBlockers / nCounts : null,
    averageRiskCount: nCounts ? sumRisks / nCounts : null,
    averageAdvisoryCount: nCounts ? sumAdvisories / nCounts : null,
    legacyOrPartialRunCount,
  };

  const instabilitySignals = buildInstabilitySignals(summary, entries.length);
  const pressureSources = buildPressureSources(summary);
  const trend = buildTrend(summary, entries.length);
  const advisoryNotes = buildAdvisoryNotes(summary);

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { generationText: true },
  });
  const text = scene?.generationText?.trim() ?? "";
  const currentGenerationTextStats =
    text.length > 0
      ? {
          present: true,
          characterCount: text.length,
          paragraphCount: countParagraphs(text),
          kind: "fact" as const,
        }
      : { present: false, characterCount: null, paragraphCount: null, kind: "fact" as const };

  return {
    contractVersion: SCENE_RUN_DIFF_ANALYTICS_VERSION,
    summary,
    instabilitySignals,
    pressureSources,
    trend,
    advisoryNotes,
    currentGenerationTextStats,
  };
}

function buildInstabilitySignals(s: SceneRunAnalyticsSummary, window: number): SceneRunInstabilitySignal[] {
  const out: SceneRunInstabilitySignal[] = [];
  if (s.allowanceDistribution.allowed_with_risk >= 2) {
    out.push({
      code: "repeated_risky_launches",
      label: "Multiple allowed-with-risk launches",
      description: `${s.allowanceDistribution.allowed_with_risk} runs in window launched under downgrade risk (audit allowance). Review preflight before stabilizing.`,
      strength: s.allowanceDistribution.allowed_with_risk >= 4 ? "high" : "medium",
      kind: "fact",
      metric: s.allowanceDistribution.allowed_with_risk,
    });
  }
  if (s.repairOrRevisionRunCount >= 2) {
    out.push({
      code: "repair_churn",
      label: "Repeated repair / revision launches",
      description: `${s.repairOrRevisionRunCount} machine repair/revision-sourced runs — possible churn loop (heuristic).`,
      strength: s.repairOrRevisionRunCount >= 4 ? "medium" : "low",
      kind: "heuristic",
      metric: s.repairOrRevisionRunCount,
    });
  }
  if (s.failedGenerationCount >= 1) {
    out.push({
      code: "execution_failures",
      label: "Recorded generation failures",
      description: `${s.failedGenerationCount} terminal failure audits in window.`,
      strength: s.failedGenerationCount >= 2 ? "high" : "medium",
      kind: "fact",
      metric: s.failedGenerationCount,
    });
  }
  if (s.incompleteRunCount >= 1) {
    out.push({
      code: "incomplete_runs",
      label: "Incomplete run records",
      description: `${s.incompleteRunCount} runs lack completion audit — operator or crash interruption possible.`,
      strength: "low",
      kind: "fact",
      metric: s.incompleteRunCount,
    });
  }
  if (s.replayAttemptCount >= 3) {
    out.push({
      code: "replay_activity",
      label: "Frequent replay attempts",
      description: `${s.replayAttemptCount} replay-tagged audits — check convergence vs divergence manually (no auto quality verdict).`,
      strength: "low",
      kind: "heuristic",
      metric: s.replayAttemptCount,
    });
  }
  if (window === 0) {
    out.push({
      code: "no_history",
      label: "No ledger window",
      description: "No runs in current ledger slice — analytics are empty.",
      strength: "low",
      kind: "fact",
    });
  }
  return out;
}

function buildPressureSources(s: SceneRunAnalyticsSummary): SceneRunPressureSourceSummary[] {
  const out: SceneRunPressureSourceSummary[] = [];
  const add = (sourceId: string, label: string, description: string, n: number) => {
    if (n <= 0) return;
    out.push({ sourceId, label, description, kind: "heuristic", indicativeCount: n });
  };
  add("governance", "Governance / allowance pressure", "Runs where allowance was not plain `allowed` dominate risk signals.", s.allowanceDistribution.allowed_with_risk + s.allowanceDistribution.blocked);
  add("repair_automation", "Repair & revision automation", "Machine repair/revision jobs indicate operational follow-up load.", s.repairOrRevisionRunCount);
  add("replay", "Replay experiments", "Replay audits suggest iterative experimentation.", s.replayAttemptCount);
  add("machine_orchestration", "Draft orchestration / machine launches", "Non-interactive launch sources in window.", s.machineRunCount);
  return out;
}

function buildTrend(s: SceneRunAnalyticsSummary, window: number): SceneRunTrendSummary {
  if (!window) {
    return {
      recentRunCount: 0,
      cleanLaunchShare: null,
      riskyLaunchShare: null,
      blockedLaunchShare: null,
      trendNote: "No runs to trend.",
    };
  }
  const totalAllow =
    s.allowanceDistribution.allowed + s.allowanceDistribution.allowed_with_risk + s.allowanceDistribution.blocked + s.allowanceDistribution.unknown;
  const denom = totalAllow || window;
  return {
    recentRunCount: window,
    cleanLaunchShare: s.allowanceDistribution.allowed / denom,
    riskyLaunchShare: s.allowanceDistribution.allowed_with_risk / denom,
    blockedLaunchShare: s.allowanceDistribution.blocked / denom,
    trendNote:
      s.allowanceDistribution.blocked > s.allowanceDistribution.allowed
        ? "Blocked launches exceed clean allows in this window — investigate preflight blockers first."
        : s.allowanceDistribution.allowed_with_risk >= s.allowanceDistribution.allowed
          ? "Risky launches are common — stabilization may need explicit human triage."
          : null,
  };
}

function buildAdvisoryNotes(s: SceneRunAnalyticsSummary): string[] {
  const notes: string[] = [
    "Analytics are computed from ledger slices and audit facts — not a substitute for reading preflight and prose.",
  ];
  if (s.legacyOrPartialRunCount > 0) {
    notes.push(`${s.legacyOrPartialRunCount} run(s) have partial or legacy history — treat aggregates as lower precision.`);
  }
  return notes;
}
