import { z } from "zod";

const OpenerTypeSchema = z.enum(["declarative", "sensory", "motion", "dialogic", "observation", "interiority"]);

const SegmentPatternPlanSchema = z.object({
  segment: z.number().int().positive(),
  bannedRecentOpenings: z.array(z.string()),
  preferredNextOpeningTypes: z.array(OpenerTypeSchema),
  paragraphShapeRecommendations: z.object({
    targetSentenceRange: z.object({ min: z.number().int(), max: z.number().int() }),
    targetWordRange: z.object({ min: z.number().int(), max: z.number().int() }),
    clauseVarianceTarget: z.number(),
  }),
});

export const Book1SentencePatternPlanSchema = z.object({
  artifact: z.literal("chapter_sentence_pattern_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  globalConstraints: z.object({
    maxRepeatedOpenersInWindow: z.number().int(),
    sentenceLengthBands: z.array(z.object({ minWords: z.number().int(), maxWords: z.number().int(), targetShare: z.number() })),
    clauseCountTargets: z.object({ min: z.number().int(), max: z.number().int() }),
    paragraphRhythmGuidance: z.array(z.string()),
  }),
  segmentPlans: z.array(SegmentPatternPlanSchema),
});

export type Book1SentencePatternPlan = z.infer<typeof Book1SentencePatternPlanSchema>;

type SegmentLike = { segment: number; sceneFocus: string; setting: string };

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function openingRoot(text: string): string {
  return compact(text)
    .toLowerCase()
    .replace(/^[^a-z0-9]+/g, "")
    .split(/\s+/g)
    .slice(0, 3)
    .join(" ");
}

function preferredTypesForSegment(segment: number): Array<z.infer<typeof OpenerTypeSchema>> {
  const rotation: Array<Array<z.infer<typeof OpenerTypeSchema>>> = [
    ["sensory", "motion", "observation"],
    ["motion", "observation", "interiority"],
    ["interiority", "dialogic", "sensory"],
    ["observation", "declarative", "motion"],
    ["motion", "sensory", "dialogic"],
    ["interiority", "observation", "declarative"],
  ];
  return rotation[(segment - 1) % rotation.length];
}

export class Book1SentencePatternGovernorService {
  buildPlan(input: { segments: SegmentLike[] }): Book1SentencePatternPlan {
    const recentOpenings: string[] = [];
    const segmentPlans = input.segments.map((segment, index) => {
      const seedOpeners = [segment.sceneFocus, segment.setting, `segment-${segment.segment}`].map(openingRoot);
      const bannedRecentOpenings = Array.from(new Set(recentOpenings.concat(seedOpeners))).slice(-10);
      const targetSentenceRange = index % 2 === 0 ? { min: 5, max: 9 } : { min: 4, max: 7 };
      const targetWordRange = index % 3 === 0 ? { min: 95, max: 175 } : { min: 80, max: 155 };
      recentOpenings.push(...seedOpeners);
      return {
        segment: segment.segment,
        bannedRecentOpenings,
        preferredNextOpeningTypes: preferredTypesForSegment(segment.segment),
        paragraphShapeRecommendations: {
          targetSentenceRange,
          targetWordRange,
          clauseVarianceTarget: Number((0.35 + (index % 3) * 0.12).toFixed(2)),
        },
      };
    });

    return Book1SentencePatternPlanSchema.parse({
      artifact: "chapter_sentence_pattern_plan",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      globalConstraints: {
        maxRepeatedOpenersInWindow: 1,
        sentenceLengthBands: [
          { minWords: 5, maxWords: 12, targetShare: 0.28 },
          { minWords: 13, maxWords: 24, targetShare: 0.52 },
          { minWords: 25, maxWords: 40, targetShare: 0.2 },
        ],
        clauseCountTargets: { min: 1, max: 4 },
        paragraphRhythmGuidance: [
          "alternate compact and expansive sentence runs",
          "avoid repeating opener style in adjacent paragraphs",
          "inject one sensory or motion-led entry per paragraph",
        ],
      },
      segmentPlans,
    });
  }
}
