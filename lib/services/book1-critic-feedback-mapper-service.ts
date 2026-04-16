import { z } from "zod";

import { AdversarialSummarySchema } from "@/lib/services/book1-chapter-adversarial-review-service";
import { Book1ProseShapeCriticSchema } from "@/lib/services/book1-prose-shape-critic-service";

const ProseShapeCriticLiteSchema = z.object({
  generatedAt: z.string(),
  findings: z.array(
    z.object({
      category: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      excerpt: z.string(),
    }),
  ),
});

const DecisionPanelLiteSchema = z.object({
  chapterStatus: z.string().optional(),
  finalRecommendation: z.string().optional(),
  decisionRationalePlainLanguage: z.array(z.string()).optional(),
  voiceIdentityRisk: z.string().optional(),
  characterInteriorBlendingRisk: z.string().optional(),
  abstractionLeakRisk: z.string().optional(),
});

const RegenerationDiffLiteSchema = z.object({
  metrics: z.object({
    adversarialCriticalFindings: z.object({ before: z.number(), after: z.number(), trend: z.string() }),
    adversarialHighFindings: z.object({ before: z.number(), after: z.number(), trend: z.string() }),
    proseShapeCriticalFindings: z.object({ before: z.number(), after: z.number(), trend: z.string() }).optional(),
  }),
});

const ExpectedImpactZoneSchema = z.enum(["segment", "paragraph", "global"]);
const TargetSubsystemSchema = z.enum([
  "narrative_distance_plan",
  "abstraction_suppression",
  "perspective_routing_plan",
  "render_directives",
  "voice_law_engine",
  "language_suppression_map",
]);

const AdjustmentTypeSchema = z.enum([
  "tighten-narrative-distance-discipline",
  "tighten-abstraction-suppression",
  "enforce-character-interior-separation",
  "increase-historical-lived-texture",
  "increase-paragraph-pressure-variation",
  "increase-social-environmental-routing",
]);

export const Book1CriticFeedbackMapSchema = z.object({
  artifact: z.literal("book1_chapter_01_critic_feedback_map"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  sourceSnapshots: z.object({
    proseShapeCriticGeneratedAt: z.string(),
    adversarialGeneratedAt: z.string(),
    chapterStatus: z.string().nullable(),
    finalRecommendation: z.string().nullable(),
  }),
  findings: z.array(
    z.object({
      findingCategory: z.string(),
      findingSeverity: z.enum(["critical", "high", "mixed"]),
      findingCount: z.number().int().nonnegative(),
      likelyRendererCause: z.string(),
      targetSubsystem: TargetSubsystemSchema,
      recommendedAdjustmentType: AdjustmentTypeSchema,
      expectedImpactZone: ExpectedImpactZoneSchema,
      evidence: z.array(z.string()),
    }),
  ),
  convergenceSignals: z.object({
    adversarialHighTrend: z.string(),
    adversarialCriticalTrend: z.string(),
    proseShapeCriticalTrend: z.string().nullable(),
  }),
});

type FeedbackBlueprint = {
  likelyRendererCause: string;
  targetSubsystem: z.infer<typeof TargetSubsystemSchema>;
  recommendedAdjustmentType: z.infer<typeof AdjustmentTypeSchema>;
  expectedImpactZone: z.infer<typeof ExpectedImpactZoneSchema>;
};

const CATEGORY_BLUEPRINTS: Record<string, FeedbackBlueprint> = {
  repeated_opener: {
    likelyRendererCause: "Opening sequence families are reused too aggressively across segment starts.",
    targetSubsystem: "render_directives",
    recommendedAdjustmentType: "increase-paragraph-pressure-variation",
    expectedImpactZone: "paragraph",
  },
  repeated_paragraph_shape: {
    likelyRendererCause: "Sentence pressure and beat order profile is over-homogeneous.",
    targetSubsystem: "render_directives",
    recommendedAdjustmentType: "increase-paragraph-pressure-variation",
    expectedImpactZone: "paragraph",
  },
  synthetic_rhythm: {
    likelyRendererCause: "Cadence profile is insufficiently rotated between paragraph slots.",
    targetSubsystem: "narrative_distance_plan",
    recommendedAdjustmentType: "tighten-narrative-distance-discipline",
    expectedImpactZone: "paragraph",
  },
  abstraction_overuse_by_segment: {
    likelyRendererCause: "Abstract pressure lexicon escapes suppression without enough material substitutions.",
    targetSubsystem: "abstraction_suppression",
    recommendedAdjustmentType: "tighten-abstraction-suppression",
    expectedImpactZone: "segment",
  },
  repeated_abstract_fear_language: {
    likelyRendererCause: "Fear translation remains lexical rather than embodied.",
    targetSubsystem: "language_suppression_map",
    recommendedAdjustmentType: "tighten-abstraction-suppression",
    expectedImpactZone: "paragraph",
  },
  character_interior_blending: {
    likelyRendererCause: "Perspective routing allows interchangeable interior channels across cast.",
    targetSubsystem: "perspective_routing_plan",
    recommendedAdjustmentType: "enforce-character-interior-separation",
    expectedImpactZone: "paragraph",
  },
  repeated_thought_content: {
    likelyRendererCause: "Interior recursion guard is not producing enough divergent cognition routes.",
    targetSubsystem: "perspective_routing_plan",
    recommendedAdjustmentType: "enforce-character-interior-separation",
    expectedImpactZone: "segment",
  },
  low_embodiment: {
    likelyRendererCause: "Directive mix underweights sensory/object beats relative to abstract pressure beats.",
    targetSubsystem: "render_directives",
    recommendedAdjustmentType: "increase-historical-lived-texture",
    expectedImpactZone: "segment",
  },
  weak_transition_texture: {
    likelyRendererCause: "Transition routing overuses explanatory handoff instead of social/environmental carry.",
    targetSubsystem: "render_directives",
    recommendedAdjustmentType: "increase-social-environmental-routing",
    expectedImpactZone: "paragraph",
  },
};

function severityLabel(input: { critical: number; high: number }): "critical" | "high" | "mixed" {
  if (input.critical > 0) return "critical";
  if (input.high > 0) return "high";
  return "mixed";
}

export class Book1CriticFeedbackMapperService {
  map(input: {
    proseShapeCritic: unknown;
    adversarialSummary: unknown;
    decisionPanel: unknown;
    regenerationDiff: unknown;
  }): z.infer<typeof Book1CriticFeedbackMapSchema> {
    const proseShapeCritic = z
      .union([Book1ProseShapeCriticSchema, ProseShapeCriticLiteSchema])
      .parse(input.proseShapeCritic);
    const adversarialSummary = AdversarialSummarySchema.parse(input.adversarialSummary);
    const decisionPanel = DecisionPanelLiteSchema.parse(input.decisionPanel);
    const regenerationDiff = RegenerationDiffLiteSchema.parse(input.regenerationDiff);

    const categoryBuckets = new Map<
      string,
      {
        count: number;
        critical: number;
        high: number;
        evidence: string[];
      }
    >();
    for (const finding of proseShapeCritic.findings) {
      const category = finding.category ?? "uncategorized";
      const bucket = categoryBuckets.get(category) ?? { count: 0, critical: 0, high: 0, evidence: [] };
      bucket.count += 1;
      if (finding.severity === "critical") bucket.critical += 1;
      if (finding.severity === "high") bucket.high += 1;
      if (bucket.evidence.length < 3 && finding.excerpt.length > 0) {
        bucket.evidence.push(finding.excerpt);
      }
      categoryBuckets.set(category, bucket);
    }

    const findings = Array.from(categoryBuckets.entries())
      .map(([category, bucket]) => {
        const blueprint = CATEGORY_BLUEPRINTS[category];
        if (!blueprint) return null;
        return {
          findingCategory: category,
          findingSeverity: severityLabel({ critical: bucket.critical, high: bucket.high }),
          findingCount: bucket.count,
          likelyRendererCause: blueprint.likelyRendererCause,
          targetSubsystem: blueprint.targetSubsystem,
          recommendedAdjustmentType: blueprint.recommendedAdjustmentType,
          expectedImpactZone: blueprint.expectedImpactZone,
          evidence: bucket.evidence,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.findingCount - a.findingCount);

    return Book1CriticFeedbackMapSchema.parse({
      artifact: "book1_chapter_01_critic_feedback_map",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      sourceSnapshots: {
        proseShapeCriticGeneratedAt: proseShapeCritic.generatedAt,
        adversarialGeneratedAt: adversarialSummary.generatedAt,
        chapterStatus: decisionPanel.chapterStatus ?? null,
        finalRecommendation: decisionPanel.finalRecommendation ?? null,
      },
      findings,
      convergenceSignals: {
        adversarialHighTrend: regenerationDiff.metrics.adversarialHighFindings.trend,
        adversarialCriticalTrend: regenerationDiff.metrics.adversarialCriticalFindings.trend,
        proseShapeCriticalTrend: regenerationDiff.metrics.proseShapeCriticalFindings?.trend ?? null,
      },
    });
  }
}
