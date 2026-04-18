import type { CharacterSimulationWorkbenchSceneRollup } from "@/lib/domain/character-simulation-workbench";
import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import type {
  SceneDecisionAssistHeuristicNote,
  SceneDecisionAssistRunFocus,
  SceneDecisionAssistSummary,
  SceneDecisionAssistSuppressionReason,
  SceneDecisionAssistViewModel,
  SceneDecisionRecommendation,
  SceneDecisionRecommendationAction,
  SceneDecisionRecommendationCategory,
  SceneDecisionRecommendationEvidenceSummary,
  SceneDecisionRecommendationSet,
  SceneDecisionRecommendationStrength,
  SceneDecisionRecommendationTrigger,
} from "@/lib/domain/scene-decision-assist";
import type { SceneRecommendationEffectivenessViewModel } from "@/lib/domain/scene-recommendation-learning";
import { SCENE_DECISION_ASSIST_CONTRACT_VERSION } from "@/lib/domain/scene-decision-assist";
import type { SceneResearchTabViewModel } from "@/lib/domain/scene-research-tab";
import type { SceneRunLedgerEntry, SceneRunLedgerViewModel } from "@/lib/domain/scene-run-ledger";
import type { SceneRunOutcomeAnalyticsViewModel } from "@/lib/domain/scene-run-diff-analytics";
import { prisma } from "@/lib/prisma";
import { buildSceneGenerationPreflight } from "@/lib/services/scene-generation-preflight-service";
import { buildCharacterSimulationWorkbenchSceneRollup } from "@/lib/services/character-simulation-workbench-scene-aggregate-service";
import { loadSceneResearchTab } from "@/lib/services/scene-research-tab-loader-service";
import { buildSceneRunDiffViewModel } from "@/lib/services/scene-run-diff-service";
import { loadSceneRunOutputChurnHints } from "@/lib/services/scene-run-output-churn-hints-service";
import { applyEffectivenessToRecommendationSet, buildSceneRecommendationEffectivenessViewModel } from "@/lib/services/scene-recommendation-effectiveness-service";
import {
  buildShownPayloadFromRecommendationSet,
  logRecommendationShownFromAssistInput,
} from "@/lib/services/scene-recommendation-learning-log-service";
import { loadSceneRunLedger } from "@/lib/services/scene-run-ledger-service";
import { buildSceneRunOutcomeAnalytics } from "@/lib/services/scene-run-outcome-analytics-service";

const CATEGORY_PRIORITY: Record<SceneDecisionRecommendationCategory, number> = {
  review_preflight_blockers: 1,
  resolve_research_pressure_first: 2,
  resolve_character_simulation_first: 3,
  pause_relaunch_churn: 4,
  inspect_run_diff_first: 5,
  repair_instead_of_replay: 6,
  replay_now: 7,
  proceed_stability_improving: 8,
  historical_review_only: 9,
};

export type SceneDecisionAssistRuleContext = {
  sceneId: string;
  preflight: SceneGenerationPreflightViewModel;
  research: SceneResearchTabViewModel | null;
  analytics: SceneRunOutcomeAnalyticsViewModel;
  ledger: SceneRunLedgerViewModel;
  simRollup: CharacterSimulationWorkbenchSceneRollup | null;
  materialRunDiff: boolean;
  failedRunsInWindow: number;
  replayFailedPattern: boolean;
  partialHistoryCodes: SceneDecisionAssistSummary["partialHistoryCodes"];
};

function evidence(id: string, text: string, kind: SceneDecisionRecommendationEvidenceSummary["kind"]): SceneDecisionRecommendationEvidenceSummary {
  return { id, text, kind };
}

function action(
  id: string,
  label: string,
  kind: SceneDecisionRecommendationAction["kind"],
  opts: { sceneTab?: SceneDecisionRecommendationAction["sceneTab"]; href?: string | null; explanation: string },
): SceneDecisionRecommendationAction {
  return { id, label, kind, sceneTab: opts.sceneTab, href: opts.href ?? null, explanation: opts.explanation };
}

function trigger(code: string, label: string, detail: string, kind: SceneDecisionRecommendationTrigger["kind"]): SceneDecisionRecommendationTrigger {
  return { code, label, detail, kind };
}

function rec(
  sceneId: string,
  category: SceneDecisionRecommendationCategory,
  title: string,
  recommendationText: string,
  strength: SceneDecisionRecommendationStrength,
  basis: SceneDecisionRecommendation["basis"],
  actions: SceneDecisionRecommendationAction[],
  notes: string[] = [],
  caps: SceneDecisionAssistSuppressionReason[] = [],
): SceneDecisionRecommendation {
  return {
    id: `${sceneId.slice(0, 12)}-${category}`,
    category,
    priorityRank: CATEGORY_PRIORITY[category],
    title,
    recommendationText,
    strength,
    basis,
    actions,
    suppressionOrCautionNotes: notes,
    confidenceCapReasons: caps,
  };
}

/** Exported for unit tests — builds candidates before suppression / ranking. */
export function collectSceneDecisionRecommendations(ctx: SceneDecisionAssistRuleContext): SceneDecisionRecommendation[] {
  const out: SceneDecisionRecommendation[] = [];
  const p = ctx.preflight;
  const s = p.summary;
  const a = ctx.analytics.summary;
  const blockingResearch = ctx.research?.contradictions.filter((c) => c.severity === "blocking").length ?? 0;
  const contradictionShaped = ctx.research?.summary.contradictionShapedCount ?? 0;
  const openClaims = ctx.research?.summary.openClaimsCount ?? 0;
  const simBlocking = ctx.simRollup?.perPerson.filter((x) => x.readinessImpact === "blocked").length ?? 0;
  const simSubsystemBlocked = p.subsystems.some((x) => x.subsystemKey === "character_simulation" && x.isBlocker);
  const envSubsystemBlocked = p.subsystems.some((x) => x.subsystemKey === "execution_environment" && x.isBlocker);
  const hashSubsystemBlocked = p.subsystems.some((x) => x.subsystemKey === "canonical_hash" && x.isBlocker);

  const preflightBlocked = s.launchAllowance === "blocked" || s.overallReadinessClass === "blocked";

  if (preflightBlocked || p.blockers.length > 0) {
    const blockerTitles = p.blockers.slice(0, 4).map((b) => b.title).join("; ");
    out.push(
      rec(
        ctx.sceneId,
        "review_preflight_blockers",
        "Resolve preflight blockers before relaunch",
        `Current preflight is not launch-clean (${s.launchAllowance}, ${s.overallReadinessClass}). Address blockers in Preflight rather than repeating runs.`,
        "strong",
        {
          summary: "Hard governance / environment / hash / subsystem blockers are active.",
          factualEvidence: [
            evidence("e-pf-1", `Launch allowance: ${s.launchAllowance}; readiness class: ${s.overallReadinessClass}.`, "fact"),
            evidence("e-pf-2", `Primary blockers recorded: ${p.blockers.length}; risks: ${p.risks.length}.`, "fact"),
            ...(blockerTitles
              ? [evidence("e-pf-3", `Examples: ${blockerTitles}.`, "fact")]
              : []),
            ...(envSubsystemBlocked
              ? [evidence("e-pf-env", "Execution environment subsystem reports a blocker (e.g. missing prerequisites).", "fact")]
              : []),
            ...(hashSubsystemBlocked
              ? [evidence("e-pf-hash", "Canonical hash / integrity subsystem reports a blocker.", "fact")]
              : []),
          ],
          heuristicNotes: [],
          triggers: [trigger("t-blocked", "Preflight blocked", "Summary and blockers list indicate launch should not proceed yet.", "fact")],
        },
        [
          action("a-pf-tab", "Open Preflight tab", "scene_tab", {
            sceneTab: "preflight",
            explanation: "Canonical subsystem breakdown and remediation links.",
          }),
          action("a-assist", "Open Decision Assist", "scene_tab", {
            sceneTab: "assist",
            explanation: "Re-read advisory context after fixes.",
          }),
        ],
      ),
    );
  }

  if (blockingResearch > 0 || (contradictionShaped >= 2 && openClaims >= 2)) {
    out.push(
      rec(
        ctx.sceneId,
        "resolve_research_pressure_first",
        "Triage research contradictions before stabilizing runs",
        blockingResearch > 0
          ? `${blockingResearch} contradiction(s) are severity-marked blocking in the scene research lens. Reconcile or record decisions before expecting cleaner launches.`
          : "Contradiction-shaped comparisons and open claims are both elevated — research pressure may be driving risky launches.",
        blockingResearch > 0 ? "strong" : "moderate",
        {
          summary: "RICRE / scene research tab signals unresolved canon tension.",
          factualEvidence: [
            evidence("e-rs-1", `Blocking-shaped contradictions: ${blockingResearch}.`, blockingResearch > 0 ? "fact" : "partial"),
            evidence("e-rs-2", `Contradiction-shaped count: ${contradictionShaped}; open claims: ${openClaims}.`, ctx.research ? "fact" : "unavailable"),
          ],
          heuristicNotes:
            a.allowanceDistribution.allowed_with_risk >= 2
              ? [
                  {
                    id: "h-rs-1",
                    text: "Multiple allowed-with-risk launches in the ledger window may correlate with unresolved research pressure — advisory pattern only.",
                    noteStrength: "medium",
                  },
                ]
              : [],
          triggers: [
            trigger("t-rs", "Research pressure", `${blockingResearch} blocking; ${contradictionShaped} contradiction-shaped.`, "fact"),
          ],
        },
        [
          action("a-rs-tab", "Open Scene Research tab", "scene_tab", {
            sceneTab: "research",
            explanation: "Scene-local RICRE truth and contradiction list.",
          }),
          action("a-rs-wb", "Open Research workbench", "href", {
            href: `/admin/research?sceneId=${ctx.sceneId}`,
            explanation: "Queue governance and author decisions.",
          }),
        ],
      ),
    );
  }

  if (simBlocking > 0 || simSubsystemBlocked) {
    const blockedPeople = ctx.simRollup?.perPerson.filter((x) => x.readinessImpact === "blocked").slice(0, 3) ?? [];
    const simActions: SceneDecisionRecommendationAction[] =
      blockedPeople.length === 0
        ? [
            action("a-sim-people", "Open People admin", "href", {
              href: "/admin/people",
              explanation: "Pick a cast member to open Character Simulation Workbench.",
            }),
          ]
        : blockedPeople.map((person, i) =>
            action(`a-sim-${i}`, `Workbench: ${person.displayName}`, "href", {
              href: person.workbenchHref,
              explanation: "Per-person simulation authoring surface.",
            }),
          );
    out.push(
      rec(
        ctx.sceneId,
        "resolve_character_simulation_first",
        "Resolve character simulation blockers on cast",
        simBlocking > 0
          ? `${simBlocking} cast member(s) show blocking simulation readiness in the workbench rollup.`
          : "Preflight marks character simulation as blocking — align workbench state before replay-heavy loops.",
        simBlocking > 0 ? "strong" : "moderate",
        {
          summary: "Cluster 8 readiness is not clean for one or more cast members.",
          factualEvidence: [
            evidence("e-sim-1", `Simulation rollup: ${ctx.simRollup?.summaryLine ?? "not loaded (no cast)."}.`, ctx.simRollup ? "fact" : "partial"),
            evidence("e-sim-2", `Cast blocking count (rollup): ${simBlocking}.`, "fact"),
            evidence("e-sim-3", `Preflight character_simulation isBlocker: ${simSubsystemBlocked}.`, "fact"),
          ],
          heuristicNotes: [],
          triggers: [trigger("t-sim", "Simulation blocked", "Workbench or preflight indicates simulation gate.", "fact")],
        },
        simActions,
      ),
    );
  }

  const churnScore = a.repairOrRevisionRunCount + Math.floor(a.replayAttemptCount / 2);
  const highChurn = churnScore >= 5 || (a.repairOrRevisionRunCount >= 3 && a.allowanceDistribution.allowed_with_risk >= 2);

  if (highChurn && !preflightBlocked) {
    out.push(
      rec(
        ctx.sceneId,
        "pause_relaunch_churn",
        "Pause rapid replay/repair loops",
        `Ledger window shows repair/revision activity (${a.repairOrRevisionRunCount}) and replay audits (${a.replayAttemptCount}). Without clearer stabilization, another immediate relaunch may repeat churn.`,
        "moderate",
        {
          summary: "Operational churn pattern from audit-derived counts.",
          factualEvidence: [
            evidence("e-ch-1", `Repair/revision-sourced runs: ${a.repairOrRevisionRunCount}.`, "fact"),
            evidence("e-ch-2", `Replay-tagged audits (scene): ${a.replayAttemptCount}.`, "fact"),
            evidence("e-ch-3", `Failed generation terminals: ${a.failedGenerationCount}.`, "fact"),
          ],
          heuristicNotes: [
            {
              id: "h-ch-1",
              text: "Churn score combines repairs and replay attempts — heuristic composite, not a quality verdict.",
              noteStrength: "medium",
            },
          ],
          triggers: [trigger("t-churn", "Churn", `churnScore≈${churnScore}`, "heuristic")],
        },
        [
          action("a-diff", "Open Runs tab (diff)", "scene_tab", {
            sceneTab: "runs",
            explanation: "Structured diff and analytics — compare before another launch.",
          }),
          action("a-pf", "Review Preflight", "scene_tab", {
            sceneTab: "preflight",
            explanation: "Confirm blockers and downgrade risks.",
          }),
        ],
      ),
    );
  }

  if (ctx.materialRunDiff && (highChurn || a.failedGenerationCount >= 1) && !preflightBlocked) {
    out.push(
      rec(
        ctx.sceneId,
        "inspect_run_diff_first",
        "Compare the latest two runs before choosing replay vs repair",
        "Latest runs differ materially on governance, execution, or proxies — inspect the structured diff to see what actually changed.",
        "moderate",
        {
          summary: "Structured diff between two most recent ledger entries shows non-trivial delta.",
          factualEvidence: [
            evidence("e-df-1", "Structured run diff: material change detected between newest pair.", ctx.ledger.entries.length >= 2 ? "fact" : "partial"),
          ],
          heuristicNotes: [],
          triggers: [trigger("t-diff", "Material diff", "Diff headline non-empty change categories.", "fact")],
        },
        [
          action("a-runs", "Open Runs tab", "scene_tab", {
            sceneTab: "runs",
            explanation: "Run comparison UI lives with the ledger.",
          }),
        ],
      ),
    );
  }

  const repairLean = a.repairOrRevisionRunCount >= 2 && a.replayAttemptCount >= 2 && !preflightBlocked;
  if (repairLean && highChurn) {
    out.push(
      rec(
        ctx.sceneId,
        "repair_instead_of_replay",
        "Favor targeted repair over another blind replay",
        "Repeated repair-sourced and replay activity suggests a continuity or governance fix may outperform another replay under similar guard conditions.",
        "light",
        {
          summary: "Heuristic: repair/revision signals dominate the window.",
          factualEvidence: [
            evidence("e-rp-1", `Repair/revision runs: ${a.repairOrRevisionRunCount}.`, "fact"),
            evidence("e-rp-2", `Replay audits: ${a.replayAttemptCount}.`, "fact"),
          ],
          heuristicNotes: [
            {
              id: "h-rp-1",
              text: "Does not auto-route repair jobs — use governed launch/repair paths you already operate.",
              noteStrength: "high",
            },
          ],
          triggers: [trigger("t-rp", "Repair lean", "Counts threshold met.", "heuristic")],
        },
        [
          action("a-cockpit", "Author cockpit (scene)", "href", {
            href: `/admin/narrative?scope=scene&sceneId=${ctx.sceneId}`,
            explanation: "Scene-scoped orchestration and launch panels (advisory routing).",
          }),
          action("a-runs", "Runs / ledger", "scene_tab", { sceneTab: "runs", explanation: "Confirm last intents and failures." }),
        ],
      ),
    );
  }

  const replayAllowed = s.launchAllowance === "allowed" || s.launchAllowance === "allowed_with_risk";
  const lowRiskWindow = a.allowanceDistribution.blocked === 0 && a.failedGenerationCount < 2 && !highChurn;
  if (replayAllowed && preflightBlocked === false && lowRiskWindow && blockingResearch === 0 && simBlocking === 0) {
    const strength: SceneDecisionRecommendationStrength = ctx.replayFailedPattern ? "light" : "moderate";
    out.push(
      rec(
        ctx.sceneId,
        "replay_now",
        "Guarded replay may be reasonable",
        s.launchAllowance === "allowed_with_risk"
          ? "Launch is allowed with risk — replay is possible if you acknowledge downgrade signals in the existing guard path."
          : "Preflight allows launch and cast/research gates are not blocking — replay can proceed via the Run Ledger guarded control.",
        strength,
        {
          summary: "Current preflight allowance and ledger window do not show dominant blockers.",
          factualEvidence: [
            evidence("e-rq-1", `Preflight allowance: ${s.launchAllowance}.`, "fact"),
            evidence("e-rq-2", `Recent failures in window: ${ctx.failedRunsInWindow}.`, "fact"),
          ],
          heuristicNotes: ctx.replayFailedPattern
            ? [
                {
                  id: "h-rq-1",
                  text: "Recent failures under similar risk/posture reduce default replay strength — still advisory.",
                  noteStrength: "high",
                },
              ]
            : [],
          triggers: [trigger("t-rq", "Replay window open", "Allowance and gates.", "fact")],
        },
        [
          action("a-runs-replay", "Go to Runs (guarded replay)", "scene_tab", {
            sceneTab: "runs",
            explanation: "Replay only through the ledger button — no auto-run from Decision Assist.",
          }),
        ],
        ctx.replayFailedPattern
          ? ["Recent generation failures detected — treat replay as experimental until root cause is reviewed."]
          : [],
        ctx.replayFailedPattern
          ? [{ code: "replay_recent_failures", message: "Strength capped after failures in window.", affectedRecommendationCategory: "replay_now" }]
          : [],
      ),
    );
  }

  const improving =
    a.allowanceDistribution.allowed > a.allowanceDistribution.allowed_with_risk &&
    a.failedGenerationCount === 0 &&
    !preflightBlocked &&
    !highChurn;

  if (improving && (a.totalRunsInWindow ?? 0) >= 2) {
    out.push(
      rec(
        ctx.sceneId,
        "proceed_stability_improving",
        "Stability signals look cleaner in this window",
        "Clean allows outnumber risky allows and no terminal failures were recorded — you may proceed, still subject to author judgment on prose.",
        "light",
        {
          summary: "Descriptive ledger statistics only — not a quality score.",
          factualEvidence: [
            evidence("e-ok-1", `allowed: ${a.allowanceDistribution.allowed}; allowed_with_risk: ${a.allowanceDistribution.allowed_with_risk}.`, "fact"),
            evidence("e-ok-2", `Failures: ${a.failedGenerationCount}.`, "fact"),
          ],
          heuristicNotes: [],
          triggers: [trigger("t-ok", "Cleaner window", "Distribution facts.", "fact")],
        },
        [
          action("a-pf", "Confirm Preflight", "scene_tab", { sceneTab: "preflight", explanation: "Double-check before major launches." }),
        ],
      ),
    );
  }

  const legacyHeavy =
    a.legacyOrPartialRunCount > 0 &&
    ctx.ledger.entries.length > 0 &&
    a.legacyOrPartialRunCount >= Math.ceil(ctx.ledger.entries.length * 0.4);

  if (legacyHeavy || ctx.partialHistoryCodes.includes("legacy_run_history")) {
    out.push(
      rec(
        ctx.sceneId,
        "historical_review_only",
        "Treat analytics as historical review",
        "A large share of runs are partial or legacy-shaped — diff and analytics precision are limited.",
        "informational",
        {
          summary: "Completeness honesty from ledger assembly.",
          factualEvidence: [
            evidence("e-lg-1", `Legacy/partial runs in window: ${a.legacyOrPartialRunCount} of ${ctx.ledger.entries.length}.`, "fact"),
          ],
          heuristicNotes: [],
          triggers: [trigger("t-lg", "Legacy mix", "Ledger completeness.", "fact")],
        },
        [action("a-runs", "Inspect Runs tab", "scene_tab", { sceneTab: "runs", explanation: "Row-level completeness badges." })],
      ),
    );
  }

  return out;
}

function materialDiffForLatestPair(entries: SceneRunLedgerEntry[]): boolean {
  if (entries.length < 2) return false;
  const a = entries[0];
  const b = entries[1];
  const d = buildSceneRunDiffViewModel(a, b);
  if (!d) return false;
  const changedSlices =
    (d.diff.governance.fields.some((f) => f.changed) ? 1 : 0) +
    (d.diff.preflight.fields.some((f) => f.changed) ? 1 : 0) +
    (d.diff.execution.fields.some((f) => f.changed) ? 1 : 0);
  return changedSlices >= 2;
}

function failedRunsCount(entries: SceneRunLedgerEntry[]): number {
  return entries.filter((e) => e.output.generationFailed).length;
}

function replayFailurePattern(entries: SceneRunLedgerEntry[]): boolean {
  const recent = entries.slice(0, 4);
  const fails = recent.filter((e) => e.output.generationFailed).length;
  const risky = recent.filter((e) => e.historicalGuard.launchAllowance === "allowed_with_risk").length;
  return fails >= 2 || (fails >= 1 && risky >= 2);
}

/** Exported for tests — final ranking, de-duplication, and demotion rules. */
export function applySceneDecisionRecommendationSuppression(sceneId: string, candidates: SceneDecisionRecommendation[]): {
  set: SceneDecisionRecommendationSet;
  suppressions: SceneDecisionAssistSuppressionReason[];
} {
  const suppressions: SceneDecisionAssistSuppressionReason[] = [];
  const hasDom = candidates.some((c) => c.category === "review_preflight_blockers" && c.strength === "strong");
  let list = [...candidates];

  if (hasDom) {
    list = list.map((c) => {
      if (c.category === "replay_now") {
        suppressions.push({
          code: "preflight_dominates",
          message: "Replay downgraded while preflight shows strong blockers.",
          affectedRecommendationCategory: "replay_now",
        });
        return {
          ...c,
          strength: "informational",
          suppressionOrCautionNotes: [...c.suppressionOrCautionNotes, "Preflight blockers dominate — resolve those before replay."],
        };
      }
      return c;
    });
  }

  const hasResearchStrong = list.some((c) => c.category === "resolve_research_pressure_first" && (c.strength === "strong" || c.strength === "moderate"));
  if (hasResearchStrong) {
    list = list.map((c) => {
      if (c.category === "replay_now" && c.strength !== "informational") {
        suppressions.push({
          code: "research_pressure",
          message: "Research pressure present — replay not prioritized.",
          affectedRecommendationCategory: "replay_now",
        });
        return {
          ...c,
          strength: "light",
          suppressionOrCautionNotes: [...c.suppressionOrCautionNotes, "Unresolved research signals warrant review before another replay."],
        };
      }
      return c;
    });
  }

  const hasSimStrong = list.some((c) => c.category === "resolve_character_simulation_first" && c.strength === "strong");
  if (hasSimStrong) {
    list = list.map((c) => {
      if (c.category === "replay_now" && c.strength !== "informational") {
        return {
          ...c,
          strength: "light",
          suppressionOrCautionNotes: [...c.suppressionOrCautionNotes, "Simulation blockers reduce replay priority."],
        };
      }
      return c;
    });
  }

  const pause = list.find((c) => c.category === "pause_relaunch_churn");
  const replay = list.find((c) => c.category === "replay_now");
  if (pause && replay && replay.strength !== "informational") {
    suppressions.push({
      code: "churn_vs_replay",
      message: "Churn pattern demotes replay recommendation.",
      affectedRecommendationCategory: "replay_now",
    });
    const replayIdx = list.findIndex((c) => c.category === "replay_now");
    if (replayIdx >= 0) {
      list[replayIdx] = {
        ...list[replayIdx],
        strength: "light",
        suppressionOrCautionNotes: [...list[replayIdx].suppressionOrCautionNotes, "High churn — prefer diff/repair triage over another immediate replay."],
      };
    }
  }

  const repairRec = list.find((c) => c.category === "repair_instead_of_replay");
  if (repairRec && replay) {
    const rIdx = list.findIndex((c) => c.category === "replay_now");
    if (rIdx >= 0 && list[rIdx].strength === "moderate") {
      list[rIdx] = { ...list[rIdx], strength: "light" };
      suppressions.push({
        code: "repair_alternate",
        message: "Repair-oriented signal present alongside replay.",
        affectedRecommendationCategory: "replay_now",
      });
    }
  }

  // De-dupe by category (keep strongest)
  const byCat = new Map<SceneDecisionRecommendationCategory, SceneDecisionRecommendation>();
  const rankStrength = (s: SceneDecisionRecommendationStrength) =>
    ({ strong: 0, moderate: 1, light: 2, informational: 3 } as const)[s];
  for (const c of list.sort((a, b) => a.priorityRank - b.priorityRank || rankStrength(a.strength) - rankStrength(b.strength))) {
    const ex = byCat.get(c.category);
    if (!ex || rankStrength(c.strength) < rankStrength(ex.strength)) byCat.set(c.category, c);
  }
  const deduped = [...byCat.values()].sort((a, b) => a.priorityRank - b.priorityRank || rankStrength(a.strength) - rankStrength(b.strength));

  const primary = deduped[0] ?? null;
  const secondary = deduped.slice(1).filter((c) => !(primary && c.category === primary.category));

  return {
    set: { primary, secondary: secondary.slice(0, 6) },
    suppressions,
  };
}

function buildRunFocus(
  sceneId: string,
  ledgerRunKey: string | undefined,
  entries: SceneRunLedgerEntry[],
): SceneDecisionAssistRunFocus | null {
  if (!ledgerRunKey) return null;
  const entry = entries.find((e) => e.ledgerRunKey === ledgerRunKey);
  if (!entry) {
    return {
      ledgerRunKey,
      replayEligibility: "unknown",
      notes: ["Selected run not found in current ledger window — run-scoped advice is partial."],
    };
  }
  return {
    ledgerRunKey,
    replayEligibility: entry.replayEligibility,
    notes: [
      `Replay eligibility (historical row + current guard when assembled): ${entry.replayEligibility}.`,
      ...(entry.replayNotes.length ? entry.replayNotes.slice(0, 3) : []),
    ],
  };
}

function partialCodes(ctx: {
  analytics: SceneRunOutcomeAnalyticsViewModel;
  ledger: SceneRunLedgerViewModel;
  research: SceneResearchTabViewModel | null;
}): SceneDecisionAssistSummary["partialHistoryCodes"] {
  const codes: SceneDecisionAssistSummary["partialHistoryCodes"] = [];
  const a = ctx.analytics.summary;
  if (a.legacyOrPartialRunCount > 0) codes.push("legacy_run_history");
  if ((a.totalRunsInWindow ?? 0) < 3) codes.push("insufficient_recent_runs");
  if (!ctx.research) codes.push("partial_history_limits_confidence");
  codes.push("output_linkage_unavailable");
  return codes;
}

export async function buildSceneDecisionAssistViewModel(
  sceneId: string,
  opts?: { ledgerRunKey?: string | null; maxLedgerEntries?: number },
): Promise<SceneDecisionAssistViewModel | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, persons: { select: { id: true } } },
  });
  if (!scene) return null;

  const max = opts?.maxLedgerEntries ?? 80;
  const [preflight, research, analytics, ledger, simRollup, outputChurnHints] = await Promise.all([
    buildSceneGenerationPreflight(sceneId),
    loadSceneResearchTab(sceneId),
    buildSceneRunOutcomeAnalytics(sceneId, max),
    loadSceneRunLedger(sceneId, max),
    scene.persons.length ? buildCharacterSimulationWorkbenchSceneRollup(scene.persons.map((p) => p.id)) : Promise.resolve(null),
    loadSceneRunOutputChurnHints(sceneId),
  ]);

  if (!preflight) return null;

  const materialRunDiff = materialDiffForLatestPair(ledger.entries);
  const failedRunsInWindow = failedRunsCount(ledger.entries);
  const replayFailedPattern = replayFailurePattern(ledger.entries);

  const partialHistoryCodes = partialCodes({ analytics, ledger, research });

  const ruleCtx: SceneDecisionAssistRuleContext = {
    sceneId,
    preflight,
    research,
    analytics,
    ledger,
    simRollup,
    materialRunDiff,
    failedRunsInWindow,
    replayFailedPattern,
    partialHistoryCodes,
  };

  let candidates = collectSceneDecisionRecommendations(ruleCtx);

  // Strength cap when history thin / partial
  if (partialHistoryCodes.includes("insufficient_recent_runs") || partialHistoryCodes.includes("legacy_run_history")) {
    candidates = candidates.map((c) => {
      if (c.strength === "strong") {
        return {
          ...c,
          strength: "moderate" as const,
          confidenceCapReasons: [
            ...c.confidenceCapReasons,
            { code: "thin_history", message: "Few or legacy-heavy runs — capped strong recommendations.", affectedRecommendationCategory: c.category },
          ],
        };
      }
      return c;
    });
  }

  const { set, suppressions } = applySceneDecisionRecommendationSuppression(sceneId, candidates);

  const shownPayload = buildShownPayloadFromRecommendationSet(sceneId, set, opts?.ledgerRunKey ?? null);
  await logRecommendationShownFromAssistInput(shownPayload);

  let effectivenessSummary: SceneRecommendationEffectivenessViewModel | null = null;
  let recommendations = set;
  try {
    effectivenessSummary = await buildSceneRecommendationEffectivenessViewModel(sceneId);
    recommendations = applyEffectivenessToRecommendationSet(set, effectivenessSummary.stats.categoryCorrelations);
  } catch {
    /* Effectiveness layer is optional — rule-based recommendations still apply. */
  }

  const headline = recommendations.primary?.title ?? "No primary recommendation";
  const honestyParts = [
    "Advisory only — does not change guard, preflight, or replay policy.",
    "Facts cite preflight, research tab, simulation rollup, and ledger; heuristics are labeled.",
  ];
  if (partialHistoryCodes.length) {
    honestyParts.push(`History / linkage notes: ${partialHistoryCodes.join(", ")}.`);
  }

  return {
    contractVersion: SCENE_DECISION_ASSIST_CONTRACT_VERSION,
    sceneId,
    evaluatedAtIso: new Date().toISOString(),
    summary: {
      headline,
      honestyBanner: honestyParts.join(" "),
      partialHistoryCodes,
      outputChurnHints,
    },
    recommendations,
    suppressionsApplied: suppressions,
    runFocus: buildRunFocus(sceneId, opts?.ledgerRunKey ?? undefined, ledger.entries),
    effectivenessSummary,
  };
}
