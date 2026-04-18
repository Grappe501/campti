import type {
  SceneDecisionRecommendation,
  SceneDecisionRecommendationCategory,
  SceneDecisionRecommendationSet,
} from "@/lib/domain/scene-decision-assist";
import {
  SCENE_RECOMMENDATION_LEARNING_CONTRACT_VERSION,
  type SceneRecommendationConfidenceAdjustment,
  type SceneRecommendationConfidenceAdjustmentKind,
  type SceneRecommendationEffectivenessStats,
  type SceneRecommendationEffectivenessViewModel,
  type SceneRecommendationHistoryStatus,
  type SceneRecommendationLearningAugmentation,
  type SceneRecommendationLearningNote,
  type SceneRecommendationOutcomeCorrelation,
  type SceneRecommendationOutcomeLinkStatus,
} from "@/lib/domain/scene-recommendation-learning";
import { prisma } from "@/lib/prisma";

const DEFAULT_WINDOW_DAYS = 90;
const MIN_SHOWN_FOR_PATTERN = 3;
const MIN_OUTCOMES_FOR_ADJUST = 5;
const CHURN_DOWN_THRESHOLD = 0.55;
const CHURN_UP_THRESHOLD = 0.32;

const ALL_CATEGORIES: SceneDecisionRecommendationCategory[] = [
  "review_preflight_blockers",
  "resolve_research_pressure_first",
  "resolve_character_simulation_first",
  "pause_relaunch_churn",
  "inspect_run_diff_first",
  "repair_instead_of_replay",
  "replay_now",
  "proceed_stability_improving",
  "historical_review_only",
];

export type RecommendationEventSnapshot = {
  eventType: string;
  actionType: string | null;
  recommendationCategories: unknown;
  meta: unknown;
  createdAt?: Date;
};

const CATEGORY_SET = new Set<SceneDecisionRecommendationCategory>(ALL_CATEGORIES);

function parseCategories(raw: unknown): SceneDecisionRecommendationCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is SceneDecisionRecommendationCategory => typeof x === "string" && CATEGORY_SET.has(x as SceneDecisionRecommendationCategory));
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

function actionImpliesCategory(action: string | null): SceneDecisionRecommendationCategory | null {
  switch (action) {
    case "replay_requested":
      return "replay_now";
    case "repair_requested":
      return "repair_instead_of_replay";
    case "opened_preflight":
      return "review_preflight_blockers";
    case "opened_research":
      return "resolve_research_pressure_first";
    case "opened_simulation":
      return "resolve_character_simulation_first";
    case "opened_diff":
      return "inspect_run_diff_first";
    case "launched_new_run":
      return "replay_now";
    default:
      return null;
  }
}

function categoriesFromActionEvent(e: RecommendationEventSnapshot): Set<SceneDecisionRecommendationCategory> {
  const fromJson = parseCategories(e.recommendationCategories);
  if (fromJson.length) return new Set(fromJson);
  const implied = actionImpliesCategory(e.actionType);
  return implied ? new Set([implied]) : new Set();
}

function bumpDistribution(
  dist: SceneRecommendationOutcomeCorrelation["subsequentAllowanceDistribution"],
  allowance: string | null,
  generationSucceeded: boolean,
): void {
  if (!generationSucceeded) {
    dist.failed_generation += 1;
    return;
  }
  if (allowance === "allowed") dist.allowed += 1;
  else if (allowance === "allowed_with_risk") dist.allowed_with_risk += 1;
  else if (allowance === "blocked") dist.blocked += 1;
  else dist.unknown += 1;
}

/** Exported for unit tests — pure aggregation. */
export function computeCategoryCorrelationsFromEvents(events: RecommendationEventSnapshot[]): SceneRecommendationOutcomeCorrelation[] {
  const shownByCat = new Map<SceneDecisionRecommendationCategory, number>();
  const followedByCat = new Map<SceneDecisionRecommendationCategory, number>();
  const outcomeDistByCat = new Map<
    SceneDecisionRecommendationCategory,
    SceneRecommendationOutcomeCorrelation["subsequentAllowanceDistribution"]
  >();
  const outcomeCountByCat = new Map<SceneDecisionRecommendationCategory, number>();
  const linkStatusByCat = new Map<SceneDecisionRecommendationCategory, SceneRecommendationOutcomeLinkStatus>();

  for (const c of ALL_CATEGORIES) {
    shownByCat.set(c, 0);
    followedByCat.set(c, 0);
    outcomeDistByCat.set(c, { allowed: 0, allowed_with_risk: 0, blocked: 0, failed_generation: 0, unknown: 0 });
    outcomeCountByCat.set(c, 0);
    linkStatusByCat.set(c, "no_observed_outcome");
  }

  for (const e of events) {
    if (e.eventType === "recommendation_shown") {
      for (const c of parseCategories(e.recommendationCategories)) {
        shownByCat.set(c, (shownByCat.get(c) ?? 0) + 1);
      }
    }
    if (e.eventType === "recommendation_action_taken") {
      for (const c of categoriesFromActionEvent(e)) {
        followedByCat.set(c, (followedByCat.get(c) ?? 0) + 1);
      }
    }
    if (e.eventType === "recommendation_outcome_linked") {
      const meta = parseMeta(e.meta);
      const allowance = typeof meta.launchAllowance === "string" ? meta.launchAllowance : null;
      const generationSucceeded = meta.generationSucceeded === true;
      const linkStatus = meta.linkStatus === "ambiguous_followup" ? "ambiguous_followup" : "linked_outcome";
      for (const c of parseCategories(e.recommendationCategories)) {
        bumpDistribution(outcomeDistByCat.get(c)!, allowance, generationSucceeded);
        outcomeCountByCat.set(c, (outcomeCountByCat.get(c) ?? 0) + 1);
        if (linkStatus === "ambiguous_followup") linkStatusByCat.set(c, "ambiguous_followup");
        else if (linkStatusByCat.get(c) === "no_observed_outcome") linkStatusByCat.set(c, "linked_outcome");
      }
    }
  }

  return ALL_CATEGORIES.map((category) => {
    const shownCount = shownByCat.get(category) ?? 0;
    const followedCount = followedByCat.get(category) ?? 0;
    const dist = outcomeDistByCat.get(category)!;
    const outcomeLinkedCount = outcomeCountByCat.get(category) ?? 0;
    const total = dist.allowed + dist.allowed_with_risk + dist.blocked + dist.failed_generation + dist.unknown;
    const nonClean = dist.allowed_with_risk + dist.blocked + dist.failed_generation;
    const churnPressureShare = total > 0 ? nonClean / total : null;

    const sparseData = shownCount < MIN_SHOWN_FOR_PATTERN || outcomeLinkedCount < 2;
    let historyStatus: SceneRecommendationHistoryStatus = "history_available";
    if (shownCount === 0 && outcomeLinkedCount === 0) historyStatus = "insufficient_history";
    else if (sparseData) historyStatus = "low_confidence_pattern";

    return {
      category,
      shownCount,
      followedCount,
      outcomeLinkedCount,
      subsequentAllowanceDistribution: dist,
      churnPressureShare,
      linkStatus: linkStatusByCat.get(category)!,
      sparseData,
      historyStatus,
    };
  });
}

function strengthDown(s: SceneDecisionRecommendation["strength"]): SceneDecisionRecommendation["strength"] {
  if (s === "strong") return "moderate";
  if (s === "moderate") return "light";
  return s;
}

function strengthUp(s: SceneDecisionRecommendation["strength"]): SceneDecisionRecommendation["strength"] {
  if (s === "informational") return "light";
  if (s === "light") return "moderate";
  if (s === "moderate") return "strong";
  return s;
}

function buildAdjustment(
  category: SceneDecisionRecommendationCategory,
  row: SceneRecommendationOutcomeCorrelation | undefined,
  ruleStrength: SceneDecisionRecommendation["strength"],
): SceneRecommendationLearningAugmentation {
  const emptyAdjustment: SceneRecommendationConfidenceAdjustment = {
    kind: "insufficient_history",
    explanation: null,
    notes: [],
  };

  if (!row || row.shownCount < MIN_SHOWN_FOR_PATTERN) {
    return {
      historicalNote: null,
      confidenceAdjustment: emptyAdjustment,
      ruleBasedStrength: ruleStrength,
      effectiveStrength: ruleStrength,
      historyStatus: "insufficient_history",
    };
  }

  const notes: SceneRecommendationLearningNote[] = [];
  let kind: SceneRecommendationConfidenceAdjustmentKind = "historical_note_only";
  let explanation: string | null = null;
  let historicalNote: string | null = null;
  let effectiveStrength = ruleStrength;
  let historyStatus: SceneRecommendationHistoryStatus = row.historyStatus;

  if (row.outcomeLinkedCount < MIN_OUTCOMES_FOR_ADJUST || row.sparseData) {
    historicalNote =
      "History in this scene is still thin — effectiveness patterns below are observational and may not predict the next run.";
    kind = "insufficient_history";
    historyStatus = "low_confidence_pattern";
    return {
      historicalNote,
      confidenceAdjustment: { kind, explanation, notes },
      ruleBasedStrength: ruleStrength,
      effectiveStrength,
      historyStatus,
    };
  }

  const churn = row.churnPressureShare ?? 0;
  const dist = row.subsequentAllowanceDistribution;
  const cleanShare = row.outcomeLinkedCount > 0 ? dist.allowed / row.outcomeLinkedCount : 0;

  if (category === "replay_now" && churn >= CHURN_DOWN_THRESHOLD) {
    kind = "confidence_adjusted_down";
    effectiveStrength = strengthDown(ruleStrength);
    explanation =
      "Observational only: after replay-style advice in this scene, many logged launches were still risky, blocked, or failed — not proof the advice was wrong.";
    historicalNote =
      "Similar replay-oriented guidance in this scene has often preceded launches that were not fully clean (ledger-linked outcomes).";
    notes.push({ text: "Non-clean outcome share is elevated in the logged window.", derivation: "observational_pattern" });
    if (row.linkStatus === "ambiguous_followup") {
      notes.push({ text: "Some pairings used ambiguous timing between advice and launch.", derivation: "ambiguous_linkage" });
      historyStatus = "ambiguous_followup";
    }
  } else if (category === "repair_instead_of_replay" && churn <= CHURN_UP_THRESHOLD && cleanShare >= 0.35) {
    kind = "confidence_adjusted_up";
    effectiveStrength = strengthUp(ruleStrength);
    explanation =
      "Observational only: repair-first guidance in this scene has more often preceded cleaner allowance outcomes in the log — not a guarantee.";
    historicalNote =
      "Repair-first recommendations here have more often aligned with cleaner subsequent launch records than average in this window.";
    notes.push({ text: "Clean allowance outcomes appear more common after this category in the bounded log.", derivation: "observational_pattern" });
  } else {
    kind = "historical_note_only";
    if (row.outcomeLinkedCount >= MIN_OUTCOMES_FOR_ADJUST) {
      historicalNote = `Logged outcomes for this category: ${dist.allowed} clean, ${dist.allowed_with_risk} risky, ${dist.blocked} blocked, ${dist.failed_generation} failed — correlation only.`;
    }
  }

  if (row.linkStatus === "ambiguous_followup" && kind === "historical_note_only") {
    notes.push({ text: "Some launches were linked to advice under tight timing — interpret cautiously.", derivation: "ambiguous_linkage" });
    historyStatus = "ambiguous_followup";
  }

  return {
    historicalNote,
    confidenceAdjustment: { kind, explanation, notes },
    ruleBasedStrength: ruleStrength,
    effectiveStrength,
    historyStatus,
  };
}

export function applyEffectivenessToRecommendationSet(
  set: SceneDecisionRecommendationSet,
  correlations: SceneRecommendationOutcomeCorrelation[],
): SceneDecisionRecommendationSet {
  const byCat = new Map(correlations.map((c) => [c.category, c]));

  const aug = (r: SceneDecisionRecommendation): SceneDecisionRecommendation => {
    const row = byCat.get(r.category);
    const learning = buildAdjustment(r.category, row, r.strength);
    return {
      ...r,
      strength: learning.effectiveStrength,
      learningAugmentation: learning,
    };
  };

  return {
    primary: set.primary ? aug(set.primary) : null,
    secondary: set.secondary.map(aug),
  };
}

export async function buildSceneRecommendationEffectivenessViewModel(
  sceneId: string,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<SceneRecommendationEffectivenessViewModel> {
  const since = new Date(Date.now() - windowDays * 86400_000);
  const events = await prisma.sceneRecommendationEvent.findMany({
    where: { sceneId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      eventType: true,
      actionType: true,
      recommendationCategories: true,
      meta: true,
      createdAt: true,
    },
  });

  const snapshots: RecommendationEventSnapshot[] = events.map((e) => ({
    eventType: e.eventType,
    actionType: e.actionType,
    recommendationCategories: e.recommendationCategories,
    meta: e.meta,
    createdAt: e.createdAt,
  }));

  const categoryCorrelations = computeCategoryCorrelationsFromEvents(snapshots);
  const totalShown = events.filter((e) => e.eventType === "recommendation_shown").length;
  const totalOutcomes = events.filter((e) => e.eventType === "recommendation_outcome_linked").length;

  const actionEvents = events.filter((e) => e.eventType === "recommendation_action_taken");
  const recentActionTypes = actionEvents.slice(-12).map((e) => e.actionType).filter((x): x is string => typeof x === "string");

  let overallHistoryStatus: SceneRecommendationHistoryStatus = "history_available";
  if (totalShown < 2 && totalOutcomes < 2) overallHistoryStatus = "insufficient_history";
  else if (categoryCorrelations.every((c) => c.sparseData || c.outcomeLinkedCount === 0)) overallHistoryStatus = "low_confidence_pattern";

  const stats: SceneRecommendationEffectivenessStats = {
    categoryCorrelations,
    windowDays,
    totalShownEvents: totalShown,
    totalOutcomeLinkedEvents: totalOutcomes,
  };

  const honestyBanner =
    "Learning loop is observational: it records what was shown, optional follow-ups, and ledger-linked launch outcomes. It does not know artistic causality and never changes guard or launch policy.";

  return {
    contractVersion: SCENE_RECOMMENDATION_LEARNING_CONTRACT_VERSION,
    sceneId,
    evaluatedAtIso: new Date().toISOString(),
    overallHistoryStatus,
    honestyBanner,
    stats,
    followup: {
      recentActionTypes: recentActionTypes as SceneRecommendationEffectivenessViewModel["followup"]["recentActionTypes"],
      lastActionAtIso: actionEvents.length ? actionEvents[actionEvents.length - 1]!.createdAt.toISOString() : null,
    },
  };
}
