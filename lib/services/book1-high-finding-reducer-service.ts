import { z } from "zod";

import { AdversarialSummarySchema } from "@/lib/services/book1-chapter-adversarial-review-service";
import { Book1CriticFeedbackMapSchema } from "@/lib/services/book1-critic-feedback-mapper-service";

const ClusterIdSchema = z.enum([
  "historical_texture_thin",
  "character_interior_blending",
  "paragraph_pressure_too_even",
  "abstraction_too_visible",
  "social_environmental_routing_underused",
]);

const RendererConstraintSchema = z.object({
  clusterId: ClusterIdSchema,
  targetSubsystem: z.enum([
    "narrative_distance_plan",
    "abstraction_suppression",
    "perspective_routing_plan",
    "render_directives",
    "voice_law_engine",
  ]),
  adjustmentType: z.string(),
  expectedImpactZone: z.enum(["segment", "paragraph", "global"]),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const Book1HighFindingReductionPlanSchema = z.object({
  artifact: z.literal("book1_chapter_01_high_finding_reduction_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  topFailureClusters: z.array(
    z.object({
      clusterId: ClusterIdSchema,
      weightedScore: z.number(),
      supportingCategories: z.array(z.string()),
      objective: z.string(),
      primaryFailureZone: z.enum(["segment", "paragraph", "global"]),
    }),
  ),
  targetedRendererConstraints: z.array(RendererConstraintSchema),
});

const CATEGORY_TO_CLUSTER: Record<string, z.infer<typeof ClusterIdSchema>> = {
  low_embodiment: "historical_texture_thin",
  weak_transition_texture: "social_environmental_routing_underused",
  character_interior_blending: "character_interior_blending",
  repeated_thought_content: "character_interior_blending",
  motive_restatement_clusters: "character_interior_blending",
  repeated_paragraph_shape: "paragraph_pressure_too_even",
  synthetic_rhythm: "paragraph_pressure_too_even",
  declarative_overload: "paragraph_pressure_too_even",
  abstraction_overuse_by_segment: "abstraction_too_visible",
  repeated_abstract_fear_language: "abstraction_too_visible",
  repeated_symbolic_paraphrase: "abstraction_too_visible",
};

const CLUSTER_OBJECTIVES: Record<z.infer<typeof ClusterIdSchema>, string> = {
  historical_texture_thin: "Increase lived material texture density in each segment and suppress expository substitutions.",
  character_interior_blending: "Separate interior channels so each character carries distinct notice-decide-withhold signatures.",
  paragraph_pressure_too_even: "Increase paragraph pressure variance and prevent repeated cadence templates.",
  abstraction_too_visible: "Convert abstract pressure labels into embodied social and material actions.",
  social_environmental_routing_underused: "Route more transitions through environmental and social-reading signals.",
};

function severityWeight(label: "critical" | "high" | "mixed"): number {
  if (label === "critical") return 3;
  if (label === "high") return 2;
  return 1;
}

export class Book1HighFindingReducerService {
  build(input: {
    feedbackMap: unknown;
    adversarialSummary: unknown;
  }): z.infer<typeof Book1HighFindingReductionPlanSchema> {
    const feedbackMap = Book1CriticFeedbackMapSchema.parse(input.feedbackMap);
    const adversarialSummary = AdversarialSummarySchema.parse(input.adversarialSummary);

    const clusterScores = new Map<z.infer<typeof ClusterIdSchema>, { score: number; categories: Set<string>; zone: "segment" | "paragraph" | "global" }>();
    for (const finding of feedbackMap.findings) {
      const clusterId = CATEGORY_TO_CLUSTER[finding.findingCategory];
      if (!clusterId) continue;
      const current = clusterScores.get(clusterId) ?? { score: 0, categories: new Set<string>(), zone: finding.expectedImpactZone };
      current.score += finding.findingCount * severityWeight(finding.findingSeverity);
      current.categories.add(finding.findingCategory);
      if (finding.expectedImpactZone === "global") current.zone = "global";
      clusterScores.set(clusterId, current);
    }

    const proseShapeHigh = adversarialSummary.critics.proseShape.findingCount - adversarialSummary.critics.proseShape.criticalCount;
    if (proseShapeHigh > 0) {
      const pressure = clusterScores.get("paragraph_pressure_too_even") ?? {
        score: 0,
        categories: new Set<string>(),
        zone: "paragraph" as const,
      };
      pressure.score += Math.max(1, Math.floor(proseShapeHigh / 2));
      clusterScores.set("paragraph_pressure_too_even", pressure);
    }

    const topFailureClusters = Array.from(clusterScores.entries())
      .map(([clusterId, value]) => ({
        clusterId,
        weightedScore: Number(value.score.toFixed(2)),
        supportingCategories: Array.from(value.categories).sort(),
        objective: CLUSTER_OBJECTIVES[clusterId],
        primaryFailureZone: value.zone,
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3);

    const targetedRendererConstraints: z.infer<typeof RendererConstraintSchema>[] = [];
    for (const cluster of topFailureClusters) {
      if (cluster.clusterId === "historical_texture_thin") {
        targetedRendererConstraints.push(
          {
            clusterId: cluster.clusterId,
            targetSubsystem: "render_directives",
            adjustmentType: "raise-minimum-sensory-object-beats",
            expectedImpactZone: "segment",
            parameters: {
              minSensoryOrObjectBeatsPerParagraph: 2,
              favorImagePermissionHighOnParagraphC: true,
            },
          },
          {
            clusterId: cluster.clusterId,
            targetSubsystem: "voice_law_engine",
            adjustmentType: "tighten-historical-embedding-law",
            expectedImpactZone: "global",
            parameters: {
              increaseHistoricalEmbeddingRuleWeight: 1,
            },
          },
        );
        continue;
      }
      if (cluster.clusterId === "character_interior_blending") {
        targetedRendererConstraints.push({
          clusterId: cluster.clusterId,
          targetSubsystem: "perspective_routing_plan",
          adjustmentType: "force-distinct-cognition-rotation",
          expectedImpactZone: "paragraph",
          parameters: {
            disallowConsecutiveSameCharacterAcrossParagraphs: true,
            requireSocialReadingSlot: true,
          },
        });
        continue;
      }
      if (cluster.clusterId === "paragraph_pressure_too_even") {
        targetedRendererConstraints.push(
          {
            clusterId: cluster.clusterId,
            targetSubsystem: "render_directives",
            adjustmentType: "enforce-pressure-curve-variance",
            expectedImpactZone: "paragraph",
            parameters: {
              pressurePattern: "compressed-mixed-expanded-rotating",
              minDistinctBeatOrdersPerSegment: 3,
            },
          },
          {
            clusterId: cluster.clusterId,
            targetSubsystem: "narrative_distance_plan",
            adjustmentType: "raise-distance-mode-diversity",
            expectedImpactZone: "paragraph",
            parameters: {
              maxConsecutiveSameDistanceMode: 1,
            },
          },
        );
        continue;
      }
      if (cluster.clusterId === "abstraction_too_visible") {
        targetedRendererConstraints.push({
          clusterId: cluster.clusterId,
          targetSubsystem: "abstraction_suppression",
          adjustmentType: "tighten-abstract-lexicon-blocklist",
          expectedImpactZone: "global",
          parameters: {
            maxAbstractSignalsPerParagraph: 1,
            addEmbodiedSubstitutions: true,
          },
        });
        continue;
      }
      targetedRendererConstraints.push({
        clusterId: cluster.clusterId,
        targetSubsystem: "render_directives",
        adjustmentType: "increase-social-environmental-routing-share",
        expectedImpactZone: "paragraph",
        parameters: {
          preferSocialReadingOrEnvironmentalParagraphB: true,
          requireWithheldCarryInParagraphC: true,
        },
      });
    }

    return Book1HighFindingReductionPlanSchema.parse({
      artifact: "book1_chapter_01_high_finding_reduction_plan",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      topFailureClusters,
      targetedRendererConstraints,
    });
  }
}
