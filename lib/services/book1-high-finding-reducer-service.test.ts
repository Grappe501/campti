import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1HighFindingReducerService } from "@/lib/services/book1-high-finding-reducer-service";

describe("book1-high-finding-reducer-service", () => {
  it("selects top clusters and emits targeted constraints", () => {
    const plan = new Book1HighFindingReducerService().build({
      feedbackMap: {
        artifact: "book1_chapter_01_critic_feedback_map",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        sourceSnapshots: {
          proseShapeCriticGeneratedAt: new Date().toISOString(),
          adversarialGeneratedAt: new Date().toISOString(),
          chapterStatus: "blocked",
          finalRecommendation: "iterate again",
        },
        findings: [
          {
            findingCategory: "abstraction_overuse_by_segment",
            findingSeverity: "high",
            findingCount: 3,
            likelyRendererCause: "Abstract pressure lexicon escapes suppression.",
            targetSubsystem: "abstraction_suppression",
            recommendedAdjustmentType: "tighten-abstraction-suppression",
            expectedImpactZone: "segment",
            evidence: ["e1"],
          },
          {
            findingCategory: "character_interior_blending",
            findingSeverity: "high",
            findingCount: 2,
            likelyRendererCause: "Interiors blend.",
            targetSubsystem: "perspective_routing_plan",
            recommendedAdjustmentType: "enforce-character-interior-separation",
            expectedImpactZone: "paragraph",
            evidence: ["e2"],
          },
          {
            findingCategory: "synthetic_rhythm",
            findingSeverity: "high",
            findingCount: 2,
            likelyRendererCause: "Rhythm too even.",
            targetSubsystem: "narrative_distance_plan",
            recommendedAdjustmentType: "tighten-narrative-distance-discipline",
            expectedImpactZone: "paragraph",
            evidence: ["e3"],
          },
        ],
        convergenceSignals: {
          adversarialHighTrend: "improved",
          adversarialCriticalTrend: "improved",
          proseShapeCriticalTrend: "improved",
        },
      },
      adversarialSummary: {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        critics: {
          voice: { findingCount: 1, criticalCount: 0 },
          historical: { findingCount: 1, criticalCount: 0 },
          novel: { findingCount: 1, criticalCount: 0 },
          proseShape: { findingCount: 7, criticalCount: 1 },
        },
        severityTotals: { low: 0, medium: 2, high: 5, critical: 1 },
        recommendedFixTotals: { "composer fix": 3 },
        rerunChapterReview: {
          chapterCoherence: 0.4,
          chapterPacing: 0.4,
          chapterEmotionalArc: 0.4,
          proseNaturalness: 0.4,
          outlineLeakage: 0.4,
          historicalIntegrationQuality: 0.4,
          characterCoherence: 0.4,
          narrativeContinuity: 0.4,
        },
        releaseDecision: "BLOCKED",
      },
    });

    assert.equal(plan.artifact, "book1_chapter_01_high_finding_reduction_plan");
    assert.equal(plan.topFailureClusters.length <= 3, true);
    assert.equal(plan.targetedRendererConstraints.length >= 3, true);
  });
});
