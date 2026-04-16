import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1CriticFeedbackMapperService } from "@/lib/services/book1-critic-feedback-mapper-service";

describe("book1-critic-feedback-mapper-service", () => {
  it("maps critic categories to renderer adjustment instructions", () => {
    const map = new Book1CriticFeedbackMapperService().map({
      proseShapeCritic: {
        artifact: "chapter_prose_shape_critic",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt: new Date().toISOString(),
        findings: [
          {
            category: "character_interior_blending",
            segment: 1,
            position: "middle",
            severity: "high",
            excerpt: "Alexis and Augustin share identical interior stance.",
            whyItFails: "Interiority blurs.",
            recommendedFixType: "composer fix",
            suggestedSystemTarget: "composer fix",
          },
          {
            category: "abstraction_overuse_by_segment",
            segment: 2,
            position: "middle",
            severity: "high",
            excerpt: "Risk remains unresolved across system pressure.",
            whyItFails: "Too abstract.",
            recommendedFixType: "composer fix",
            suggestedSystemTarget: "lived-history fix",
          },
        ],
        summary: {
          repetitionSignals: 0,
          summaryWritingSignals: 0,
          syntheticRhythmSignals: 0,
          mostCommonFailurePattern: "abstraction_overuse_by_segment",
          segmentsWithMostFailures: [2],
          failureCluster: "middles",
        },
        verdict: "Synthetic prose signatures remain; regenerate after system-level fixes.",
      },
      adversarialSummary: {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        critics: {
          voice: { findingCount: 1, criticalCount: 0 },
          historical: { findingCount: 1, criticalCount: 0 },
          novel: { findingCount: 1, criticalCount: 0 },
          proseShape: { findingCount: 2, criticalCount: 0 },
        },
        severityTotals: { low: 0, medium: 0, high: 2, critical: 0 },
        recommendedFixTotals: { "composer fix": 2 },
        rerunChapterReview: {
          chapterCoherence: 0.5,
          chapterPacing: 0.5,
          chapterEmotionalArc: 0.5,
          proseNaturalness: 0.5,
          outlineLeakage: 0.5,
          historicalIntegrationQuality: 0.5,
          characterCoherence: 0.5,
          narrativeContinuity: 0.5,
        },
        releaseDecision: "BLOCKED",
      },
      decisionPanel: {
        chapterStatus: "blocked",
        finalRecommendation: "iterate again",
      },
      regenerationDiff: {
        metrics: {
          adversarialCriticalFindings: { before: 2, after: 1, trend: "improved" },
          adversarialHighFindings: { before: 6, after: 5, trend: "improved" },
          proseShapeCriticalFindings: { before: 1, after: 0, trend: "improved" },
        },
      },
    });

    assert.equal(map.artifact, "book1_chapter_01_critic_feedback_map");
    assert.equal(map.findings.length >= 2, true);
    assert.equal(map.findings.some((finding) => finding.recommendedAdjustmentType === "enforce-character-interior-separation"), true);
  });
});
