import { z } from "zod";

import {
  Book1RegenerationLoopService,
  type Book1RegenerationLoopInput,
} from "@/lib/services/book1-regeneration-loop-service";

export const Book1RenderStabilityReportSchema = z.object({
  artifact: z.literal("book1_chapter_01_render_stability"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  runCount: z.number().int().positive(),
  stabilityScore: z.number(),
  variation: z.object({
    proseShapeCritical: z.object({ min: z.number(), max: z.number(), spread: z.number() }),
    adversarialCritical: z.object({ min: z.number(), max: z.number(), spread: z.number() }),
    adversarialHigh: z.object({ min: z.number(), max: z.number(), spread: z.number() }),
  }),
  unstableZones: z.array(
    z.object({
      segment: z.number().int().positive(),
      recurrenceRate: z.number(),
      categoryCount: z.number(),
      categories: z.array(z.string()),
    }),
  ),
  recurringFailureClusters: z.array(
    z.object({
      category: z.string(),
      recurrenceRate: z.number(),
      runHits: z.number(),
    }),
  ),
});

function spread(values: number[]): { min: number; max: number; spread: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, spread: max - min };
}

export class Book1RenderStabilityService {
  measure(input: {
    canonicalInput: Book1RegenerationLoopInput;
    runCount?: number;
  }): z.infer<typeof Book1RenderStabilityReportSchema> {
    const runCount = Math.max(2, input.runCount ?? 4);
    const service = new Book1RegenerationLoopService();
    const proseShapeCriticalCounts: number[] = [];
    const adversarialCriticalCounts: number[] = [];
    const adversarialHighCounts: number[] = [];
    const categoryRunHits = new Map<string, number>();
    const segmentCategoryHits = new Map<number, Set<string>>();

    for (let index = 0; index < runCount; index += 1) {
      const runResult = service.run(input.canonicalInput);
      const proseShape = runResult.proseShapeCritic as {
        findings: Array<{ category: string; severity: "low" | "medium" | "high" | "critical"; segment: number | null }>;
      };
      const adversarialSummary = (
        runResult.regenerationReview as {
          regenerated: { adversarialReview: { summary: { severityTotals: { high: number; critical: number } } } };
        }
      ).regenerated.adversarialReview.summary;

      proseShapeCriticalCounts.push(proseShape.findings.filter((finding) => finding.severity === "critical").length);
      adversarialCriticalCounts.push(adversarialSummary.severityTotals.critical);
      adversarialHighCounts.push(adversarialSummary.severityTotals.high);

      const runCategories = new Set(proseShape.findings.map((finding) => finding.category));
      for (const category of runCategories) {
        categoryRunHits.set(category, (categoryRunHits.get(category) ?? 0) + 1);
      }

      for (const finding of proseShape.findings) {
        if (finding.segment === null) continue;
        const current = segmentCategoryHits.get(finding.segment) ?? new Set<string>();
        current.add(finding.category);
        segmentCategoryHits.set(finding.segment, current);
      }
    }

    const proseVariation = spread(proseShapeCriticalCounts);
    const adversarialCriticalVariation = spread(adversarialCriticalCounts);
    const adversarialHighVariation = spread(adversarialHighCounts);
    const variationPenalty = proseVariation.spread * 8 + adversarialCriticalVariation.spread * 10 + adversarialHighVariation.spread * 6;
    const recurringPenalty = Array.from(categoryRunHits.values()).filter((hits) => hits === runCount).length * 3;
    const stabilityScore = Math.max(0, Number((100 - variationPenalty - recurringPenalty).toFixed(2)));

    const recurringFailureClusters = Array.from(categoryRunHits.entries())
      .map(([category, runHits]) => ({
        category,
        recurrenceRate: Number((runHits / runCount).toFixed(2)),
        runHits,
      }))
      .filter((row) => row.recurrenceRate >= 0.5)
      .sort((a, b) => b.recurrenceRate - a.recurrenceRate || b.runHits - a.runHits);

    const unstableZones = Array.from(segmentCategoryHits.entries())
      .map(([segment, categories]) => ({
        segment,
        recurrenceRate: Number((categories.size / Math.max(recurringFailureClusters.length, 1)).toFixed(2)),
        categoryCount: categories.size,
        categories: Array.from(categories).sort(),
      }))
      .filter((row) => row.categoryCount > 0)
      .sort((a, b) => b.recurrenceRate - a.recurrenceRate || b.categoryCount - a.categoryCount)
      .slice(0, 5);

    return Book1RenderStabilityReportSchema.parse({
      artifact: "book1_chapter_01_render_stability",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      runCount,
      stabilityScore,
      variation: {
        proseShapeCritical: proseVariation,
        adversarialCritical: adversarialCriticalVariation,
        adversarialHigh: adversarialHighVariation,
      },
      unstableZones,
      recurringFailureClusters,
    });
  }
}
