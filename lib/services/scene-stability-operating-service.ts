import type { CharacterSimulationWorkbenchSceneRollup } from "@/lib/domain/character-simulation-workbench";
import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type { SceneResearchTabViewModel } from "@/lib/domain/scene-research-tab";
import type { SceneRunBoundedOutputDiff } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunOutputChurnHint } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunOutcomeAnalyticsViewModel } from "@/lib/domain/scene-run-diff-analytics";
import type { SceneRunLedgerViewModel } from "@/lib/domain/scene-run-ledger";
import {
  SCENE_STABILITY_OPERATING_CONTRACT_VERSION,
  type SceneOperatingMode,
  type SceneOperatingModeSummary,
  type SceneStabilityForecast,
  type SceneStabilityMemorySummary,
} from "@/lib/domain/scene-stability-operating";
import type { LinkedOutputChurnPersistence } from "@/lib/services/scene-run-output-churn-persistence-service";

export type StabilityOperatingInputs = {
  sceneId: string;
  preflight: SceneGenerationPreflightViewModel;
  analytics: SceneRunOutcomeAnalyticsViewModel;
  ledger: SceneRunLedgerViewModel;
  research: SceneResearchTabViewModel | null;
  simRollup: CharacterSimulationWorkbenchSceneRollup | null;
  outputChurnHints: SceneRunOutputChurnHint[];
  boundedLatestPairDiff: SceneRunBoundedOutputDiff | null;
  outputChurnPersistence: LinkedOutputChurnPersistence;
};

export function buildSceneStabilityMemorySummary(input: StabilityOperatingInputs): SceneStabilityMemorySummary {
  const a = input.analytics.summary;
  const dist = a.allowanceDistribution;
  const blockingResearch = input.research?.contradictions.filter((c) => c.severity === "blocking").length ?? 0;
  const simBlocked = input.simRollup?.perPerson.filter((p) => p.readinessImpact === "blocked").length ?? null;

  const outputLengthOscillation = input.outputChurnHints.some((h) => h.code === "recent_linked_output_length_shift");
  const outputOpeningEndingShift = input.outputChurnHints.some(
    (h) => h.code === "recent_opening_fingerprint_shift" || h.code === "recent_ending_fingerprint_shift",
  );
  const repeatedBlockedSaveOutputs = input.outputChurnHints.some((h) => h.code === "repeated_blocked_save_outputs");

  const completenessNotes: string[] = [];
  if (!input.research) completenessNotes.push("Research tab not loaded — research pressure memory is partial.");
  if (!input.simRollup) completenessNotes.push("Simulation rollup unavailable — character simulation pressure omitted.");

  return {
    contractVersion: SCENE_STABILITY_OPERATING_CONTRACT_VERSION,
    evaluatedAtIso: new Date().toISOString(),
    windowRunCount: a.totalRunsInWindow,
    riskyLaunchCount: dist.allowed_with_risk,
    blockedLaunchCount: dist.blocked,
    replayAuditCount: a.replayAttemptCount,
    repairOrRevisionCount: a.repairOrRevisionRunCount,
    failedGenerationCount: a.failedGenerationCount,
    legacyOrPartialRunCount: a.legacyOrPartialRunCount,
    researchBlockingContradictions: input.research ? blockingResearch : null,
    simulationBlockedPersons: simBlocked,
    preflightPrimaryBlockers: input.preflight.summary.primaryBlockerCount,
    preflightPrimaryRisks: input.preflight.summary.primaryRiskCount,
    outputLengthOscillation: outputLengthOscillation || (input.boundedLatestPairDiff?.signals.some((s) => s.code === "length_shift") ?? false),
    outputOpeningEndingShift:
      outputOpeningEndingShift ||
      (input.boundedLatestPairDiff?.signals.some((s) => s.code === "opening_shift" || s.code === "ending_shift") ?? false),
    repeatedBlockedSaveOutputs,
    outputChurnPersistentDrift: input.outputChurnPersistence.persistentDrift,
    linkedOutputMaterialPairCount: input.outputChurnPersistence.materialPairCount,
    linkedOutputPairsCompared: input.outputChurnPersistence.pairsCompared,
    completenessNotes,
  };
}

export function buildStabilityForecasts(memory: SceneStabilityMemorySummary, analytics: SceneRunOutcomeAnalyticsViewModel): SceneStabilityForecast[] {
  const out: SceneStabilityForecast[] = [];
  const churnScore = memory.repairOrRevisionCount + Math.floor(memory.replayAuditCount / 2);

  if (memory.replayAuditCount >= 3 && memory.riskyLaunchCount >= 2) {
    out.push({
      code: "replay_churn_risk",
      label: "Replay churn pattern",
      description:
        "Several replay-tagged audits and multiple risky allowances in the window suggest another immediate replay may not stabilize the scene without triage.",
      derivation: memory.windowRunCount >= 5 ? "fact" : "heuristic",
      basis: [
        `Replay-tagged audits (scene): ${memory.replayAuditCount}.`,
        `Risky launches in distribution: ${memory.riskyLaunchCount}.`,
      ],
    });
  }

  if ((memory.researchBlockingContradictions ?? 0) > 0 && memory.riskyLaunchCount >= 1) {
    out.push({
      code: "research_truth_pressure",
      label: "Research / canon pressure",
      description: "Blocking-shaped research contradictions coincide with risky launches — unresolved truth pressure may keep launches unstable.",
      derivation: "fact",
      basis: [`Blocking contradictions: ${memory.researchBlockingContradictions}.`, `Risky launches: ${memory.riskyLaunchCount}.`],
    });
  }

  if ((memory.simulationBlockedPersons ?? 0) > 0) {
    out.push({
      code: "simulation_instability",
      label: "Simulation readiness pressure",
      description: "Character simulation rollup shows blocked readiness for one or more people — may correlate with governance friction.",
      derivation: "fact",
      basis: [`Simulation-blocked people count: ${memory.simulationBlockedPersons}.`],
    });
  }

  if (churnScore >= 5 && (memory.outputLengthOscillation || memory.outputOpeningEndingShift)) {
    out.push({
      code: "output_churn_with_operational_churn",
      label: "Output churn plus operational churn",
      description: "Operational churn score is elevated and linked output fingerprints or length are moving — compare runs before another launch.",
      derivation: "heuristic",
      basis: [`Heuristic churn score ≈ ${churnScore}.`, "Durable output delta or hints show prose movement between recent linked runs."],
    });
  }

  const note = analytics.trend.trendNote;
  const riskyShare = analytics.trend.riskyLaunchShare;
  const cleanShareTrend = analytics.trend.cleanLaunchShare;
  if (note && riskyShare !== null && cleanShareTrend !== null && riskyShare < 0.2 && cleanShareTrend >= 0.5) {
    out.push({
      code: "trending_cleaner",
      label: "Window trending cleaner (advisory)",
      description: note,
      derivation: "heuristic",
      basis: ["Derived from outcome analytics trend summary — not a guarantee of the next launch."],
    });
  }

  if (memory.windowRunCount < 3) {
    out.push({
      code: "low_run_volume",
      label: "Thin run window",
      description: "Few runs in the analytics window — forecasts are low confidence until history deepens.",
      derivation: "low_confidence",
      basis: [`Runs in window: ${memory.windowRunCount}.`],
    });
  }

  if (memory.outputChurnPersistentDrift && memory.linkedOutputPairsCompared >= 2) {
    out.push({
      code: "linked_output_drift_persists",
      label: "Linked output drift persists",
      description:
        "Several consecutive durable snapshots show bounded length or fingerprint movement — treat prose as unstable across runs until you compare diffs; not a verdict on quality.",
      derivation: "fact",
      basis: [
        `Material snapshot transitions: ${memory.linkedOutputMaterialPairCount} of ${memory.linkedOutputPairsCompared} adjacent linked-output pair(s) in the recent fetch window.`,
        "Derived from stored SceneRunGenerationOutput rows only — independent of governance slice counts.",
      ],
    });
  }

  return out;
}

export function deriveSceneOperatingMode(
  memory: SceneStabilityMemorySummary,
  preflight: SceneGenerationPreflightViewModel,
  forecasts: SceneStabilityForecast[],
): SceneOperatingModeSummary {
  const trace: string[] = [];
  let mode: SceneOperatingMode = "caution";
  let headline = "Use preflight and ledger before relaunching.";
  let uncertaintyNote: string | null = null;

  const blocked = preflight.summary.launchAllowance === "blocked" || preflight.summary.overallReadinessClass === "blocked";
  const researchBlock = (memory.researchBlockingContradictions ?? 0) > 0;

  if (blocked || researchBlock) {
    mode = "blocked_by_truth_pressure";
    headline = blocked
      ? "Preflight / environment blockers dominate — resolve before expecting clean launches."
      : "Research shows blocking contradictions — reconcile canon pressure before chasing stability through reruns alone.";
    if (blocked) trace.push(`Preflight allowance: ${preflight.summary.launchAllowance}; readiness: ${preflight.summary.overallReadinessClass}.`);
    if (researchBlock) trace.push(`Blocking research contradictions: ${memory.researchBlockingContradictions}.`);
  } else if (forecasts.some((f) => f.code === "replay_churn_risk") && forecasts.some((f) => f.code === "research_truth_pressure")) {
    mode = "replay_unlikely_to_help";
    headline = "Replay alone is unlikely to help until research pressure and churn drivers are triaged.";
    trace.push("Forecast: replay churn + research truth pressure both present.");
  } else if (memory.replayAuditCount >= 3 && memory.riskyLaunchCount >= 2 && memory.repairOrRevisionCount >= 2) {
    mode = "churn_risk";
    headline = "Scene shows replay/repair churn — prefer diff, repair, or research triage over blind relaunch.";
    trace.push(`Replays: ${memory.replayAuditCount}; repairs/revisions: ${memory.repairOrRevisionCount}; risky launches: ${memory.riskyLaunchCount}.`);
  } else if (
    memory.outputChurnPersistentDrift &&
    memory.windowRunCount >= 3 &&
    (memory.replayAuditCount >= 2 || memory.repairOrRevisionCount >= 2)
  ) {
    mode = "churn_risk";
    headline =
      "Linked prose snapshots keep shifting while replay/repair activity is present — compare bounded output diffs before another relaunch.";
    trace.push(
      `Persistent linked-output drift: ${memory.linkedOutputMaterialPairCount}/${memory.linkedOutputPairsCompared} material snapshot transition(s); replays: ${memory.replayAuditCount}; repairs: ${memory.repairOrRevisionCount}.`,
    );
  } else if (
    memory.windowRunCount >= 4 &&
    memory.riskyLaunchCount <= 1 &&
    memory.failedGenerationCount === 0 &&
    !memory.outputOpeningEndingShift &&
    preflight.summary.launchAllowance === "allowed"
  ) {
    mode = "stable";
    headline = "Recent window looks comparatively stable — still verify preflight before each launch.";
    trace.push("Low risky count, no failed gens in summary, preflight allowed.");
  } else {
    mode = "caution";
    headline = "Mixed signals — review runs, research, and simulation before another launch.";
    trace.push(`Runs in window: ${memory.windowRunCount}; risky: ${memory.riskyLaunchCount}; failed gens: ${memory.failedGenerationCount}.`);
  }

  const hasLinkedOutputPersistenceTrace = trace.some(
    (t) => t.includes("Persistent linked-output drift") || t.includes("material snapshot transition"),
  );
  if (memory.outputChurnPersistentDrift && memory.linkedOutputPairsCompared >= 2 && !hasLinkedOutputPersistenceTrace) {
    trace.push(
      `Linked-output drift persists across stored snapshots (${memory.linkedOutputMaterialPairCount}/${memory.linkedOutputPairsCompared} material transition(s)) — bounded diffs show prose movement, not a verdict on quality.`,
    );
  }

  if (memory.completenessNotes.length) {
    uncertaintyNote = memory.completenessNotes.join(" ");
  }
  if (forecasts.some((f) => f.derivation === "low_confidence")) {
    uncertaintyNote = [uncertaintyNote, "Forecasts are limited by thin run history."].filter(Boolean).join(" ");
  }

  return { mode, headline, trace, uncertaintyNote };
}
