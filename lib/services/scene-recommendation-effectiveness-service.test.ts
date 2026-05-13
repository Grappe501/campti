/**
 * Recommendation effectiveness aggregation (node:test).
 * Run: npx tsx --test lib/services/scene-recommendation-effectiveness-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneDecisionRecommendationSet } from "@/lib/domain/scene-decision-assist";
import {
  applyEffectivenessToRecommendationSet,
  buildOperatorInsightLines,
  computeCategoryCorrelationsFromEvents,
  type RecommendationEventSnapshot,
} from "@/lib/services/scene-recommendation-effectiveness-service";

function shown(cats: string[]): RecommendationEventSnapshot {
  return { eventType: "recommendation_shown", actionType: null, recommendationCategories: cats, meta: null };
}

function outcome(cats: string[], allowance: string, ok: boolean, linkStatus = "linked_outcome"): RecommendationEventSnapshot {
  return {
    eventType: "recommendation_outcome_linked",
    actionType: null,
    recommendationCategories: cats,
    meta: { launchAllowance: allowance, generationSucceeded: ok, linkStatus },
  };
}

function action(act: string, cats?: string[]): RecommendationEventSnapshot {
  return {
    eventType: "recommendation_action_taken",
    actionType: act,
    recommendationCategories: cats ?? [],
    meta: null,
  };
}

describe("computeCategoryCorrelationsFromEvents", () => {
  it("counts shown and outcomes per category", () => {
    const rows = [
      shown(["replay_now", "review_preflight_blockers"]),
      outcome(["replay_now"], "allowed", true),
    ];
    const corr = computeCategoryCorrelationsFromEvents(rows);
    const replay = corr.find((c) => c.category === "replay_now");
    assert.equal(replay?.shownCount, 1);
    assert.equal(replay?.outcomeLinkedCount, 1);
    assert.equal(replay?.subsequentAllowanceDistribution.allowed, 1);
  });

  it("marks sparse data honestly", () => {
    const rows = [shown(["replay_now"])];
    const replay = computeCategoryCorrelationsFromEvents(rows).find((c) => c.category === "replay_now");
    assert.equal(replay?.sparseData, true);
    assert.equal(replay?.historyStatus, "low_confidence_pattern");
  });

  it("labels ambiguous follow-up when meta requests it", () => {
    const rows = [shown(["replay_now"]), outcome(["replay_now"], "allowed_with_risk", true, "ambiguous_followup")];
    const replay = computeCategoryCorrelationsFromEvents(rows).find((c) => c.category === "replay_now");
    assert.equal(replay?.linkStatus, "ambiguous_followup");
  });

  it("maps follow-up actions to categories", () => {
    const rows = [shown(["resolve_research_pressure_first"]), action("opened_research")];
    const row = computeCategoryCorrelationsFromEvents(rows).find((c) => c.category === "resolve_research_pressure_first");
    assert.ok(row);
    assert.ok((row!.followedCount ?? 0) >= 1);
  });
});

describe("buildOperatorInsightLines", () => {
  it("flags sparse replay history", () => {
    const rows = computeCategoryCorrelationsFromEvents([shown(["replay_now"])]);
    const replay = rows.find((c) => c.category === "replay_now");
    assert.ok(replay);
    const lines = buildOperatorInsightLines("replay_now", replay!);
    assert.ok(lines.some((l) => l.toLowerCase().includes("sparse") || l.toLowerCase().includes("provisional")));
  });
});

describe("applyEffectivenessToRecommendationSet", () => {
  it("preserves rule-based title and basis while adjusting strength only when history supports it", () => {
    const set: SceneDecisionRecommendationSet = {
      primary: {
        id: "x-replay_now",
        category: "replay_now",
        priorityRank: 7,
        title: "Replay title",
        recommendationText: "Do replay",
        strength: "moderate",
        basis: { summary: "rules", factualEvidence: [], heuristicNotes: [], triggers: [] },
        actions: [],
        suppressionOrCautionNotes: [],
        confidenceCapReasons: [],
      },
      secondary: [],
    };
    const correlations = computeCategoryCorrelationsFromEvents([
      ...Array.from({ length: 4 }, () => shown(["replay_now"])),
      ...Array.from({ length: 6 }, () => outcome(["replay_now"], "allowed_with_risk", true)),
    ]);
    const out = applyEffectivenessToRecommendationSet(set, correlations);
    assert.equal(out.primary?.title, "Replay title");
    assert.equal(out.primary?.basis.summary, "rules");
    assert.ok(out.primary?.learningAugmentation);
    assert.equal(out.primary?.learningAugmentation?.confidenceAdjustment.kind, "confidence_adjusted_down");
    assert.equal(out.primary?.strength, "light");
    assert.equal(out.primary?.learningAugmentation?.strengthShiftPolarity, "weaker");
    assert.ok(out.primary?.learningAugmentation?.strengthShiftHeadline?.toLowerCase().includes("weaker"));
    const explain = out.primary?.learningAugmentation?.strengthChangeExplanationLines ?? [];
    assert.ok(explain.length >= 1);
    assert.ok(explain.some((l) => l.includes("Learning adjusted") || l.includes("→")));
  });
});
