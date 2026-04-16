import { z } from "zod";

const SuppressionDirectiveSchema = z.object({
  segment: z.number().int().positive(),
  blockedAbstractPatterns: z.array(z.string()),
  substitutionPriority: z.array(z.string()),
  maxAbstractFearMentionsPerParagraph: z.number().int().nonnegative(),
});

export const Book1AbstractFearSuppressionSchema = z.object({
  artifact: z.literal("chapter_abstract_fear_suppression"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  globalStopPatterns: z.array(z.string()),
  substitutionRules: z.array(
    z.object({
      from: z.string(),
      toPattern: z.string(),
      rule: z.string(),
    }),
  ),
  segmentDirectives: z.array(SuppressionDirectiveSchema),
});

export type Book1AbstractFearSuppression = z.infer<typeof Book1AbstractFearSuppressionSchema>;

const DEFAULT_STOP_PATTERNS = [
  "fear sits at",
  "hesitation sits at",
  "risk remains unresolved",
  "pressure remains",
  "threat remains",
  "erasure risk",
  "exposure fear",
];

const DEFAULT_RULES: Array<{ from: string; toPattern: string; rule: string }> = [
  {
    from: "fear",
    toPattern: "Replace with narrowed perception or interrupted movement.",
    rule: "convert abstract fear into perception",
  },
  {
    from: "motive restatement",
    toPattern: "Replace with action hesitation and object handling.",
    rule: "convert repeated motive into action hesitation",
  },
  {
    from: "emotional label",
    toPattern: "Replace with misreading, silence, breath, or posture shift.",
    rule: "convert repeated emotional label into bodily or social cue",
  },
];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function suppressAbstractFearLine(input: {
  text: string;
  stopPatterns: string[];
  substitutions: Array<{ from: string; toPattern: string }>;
}): string {
  let out = input.text;
  for (const pattern of input.stopPatterns) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), "");
  }
  for (const rule of input.substitutions) {
    const escaped = rule.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(escaped, "i").test(out)) {
      if (/fear|afraid|threat|risk/i.test(rule.from)) {
        out = out.replace(new RegExp(escaped, "gi"), "hands tighten, breath shortens, and attention narrows");
      } else if (/motive restatement/i.test(rule.from)) {
        out = out.replace(new RegExp(escaped, "gi"), "the hand pauses on unfinished work");
      } else {
        out = out.replace(new RegExp(escaped, "gi"), "silence and posture carry the meaning");
      }
    }
  }
  return compact(out);
}

export class Book1AbstractFearLanguageSuppressorService {
  build(input: { segments: Array<{ segment: number; dominantEnergy?: string }> }): Book1AbstractFearSuppression {
    const segmentDirectives = input.segments.map((segment) => ({
      segment: segment.segment,
      blockedAbstractPatterns: DEFAULT_STOP_PATTERNS,
      substitutionPriority: [
        "perception",
        "hesitation_action",
        "misreading_or_silence",
        "bodily_cue",
      ],
      maxAbstractFearMentionsPerParagraph: segment.segment % 2 === 0 ? 0 : 1,
    }));
    return Book1AbstractFearSuppressionSchema.parse({
      artifact: "chapter_abstract_fear_suppression",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      globalStopPatterns: DEFAULT_STOP_PATTERNS,
      substitutionRules: DEFAULT_RULES,
      segmentDirectives,
    });
  }
}
