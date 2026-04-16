import { z } from "zod";

const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
const FixTypeSchema = z.enum(["voice-contract fix", "prose-brief fix", "lived-history fix", "composer fix", "review-rule fix"]);
const CategorySchema = z.enum([
  "repeated_opener",
  "repeated_paragraph_shape",
  "declarative_overload",
  "summary_writing",
  "low_embodiment",
  "weak_transition_texture",
  "synthetic_rhythm",
  "repeated_thought_content",
  "paraphrased_motive_repetition",
  "repeated_abstract_fear_language",
  "repeated_symbolic_paraphrase",
  "motive_restatement_clusters",
  "character_interior_blending",
  "abstraction_overuse_by_segment",
  "fear_language_density",
]);

export const ProseShapeFindingSchema = z.object({
  category: CategorySchema,
  segment: z.number().int().positive().nullable(),
  position: z.enum(["start", "middle", "transition", "unknown"]),
  severity: SeveritySchema,
  excerpt: z.string(),
  whyItFails: z.string(),
  recommendedFixType: FixTypeSchema,
  suggestedSystemTarget: FixTypeSchema,
});

export const Book1ProseShapeCriticSchema = z.object({
  artifact: z.literal("chapter_prose_shape_critic"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  findings: z.array(ProseShapeFindingSchema),
  summary: z.object({
    repetitionSignals: z.number(),
    summaryWritingSignals: z.number(),
    syntheticRhythmSignals: z.number(),
    mostCommonFailurePattern: CategorySchema.nullable(),
    segmentsWithMostFailures: z.array(z.number().int().positive()),
    failureCluster: z.enum(["starts", "middles", "transitions", "mixed"]),
  }),
  verdict: z.string(),
});

export type Book1ProseShapeCritic = z.infer<typeof Book1ProseShapeCriticSchema>;

type SegmentLike = {
  segment: number;
  text: string;
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((row) => compact(row))
    .filter((row) => row.length > 0);
}

function takeExcerpt(value: string): string {
  const cleaned = compact(value);
  return cleaned.length > 260 ? `${cleaned.slice(0, 257)}...` : cleaned;
}

function sentencePosition(index: number, total: number): "start" | "middle" | "transition" {
  if (index <= 1) return "start";
  if (index >= total - 2) return "transition";
  return "middle";
}

function hasSensoryCue(value: string): boolean {
  return /\b(river|ash|hands|fire|weather|cane|clay|wind|smoke|reed|grain|mud|salt|skin|sound)\b/i.test(value);
}

function semanticStem(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|and|or|to|of|for|with|that|this|is|are|was|were|it|they|he|she)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

export class Book1ProseShapeCriticService {
  run(input: { segments: SegmentLike[]; fullText: string }): Book1ProseShapeCritic {
    const findings: z.infer<typeof ProseShapeFindingSchema>[] = [];
    const openings = new Map<string, number>();
    const openerSegments = new Map<string, number[]>();
    const paragraphShapes = new Map<string, number[]>();
    const paragraphLengths: Array<{ segment: number; words: number }> = [];
    const thoughtStemCounts = new Map<string, { count: number; segment: number; excerpt: string }>();
    const motiveStemCounts = new Map<string, { count: number; segment: number; excerpt: string }>();
    const fearStemCounts = new Map<string, { count: number; segment: number; excerpt: string }>();
    const symbolStemCounts = new Map<string, { count: number; segment: number; excerpt: string }>();
    const characterInteriorPredicates = new Map<string, { names: Set<string>; segment: number; excerpt: string }>();
    const segmentAbstraction = new Map<number, { abstractHits: number; sensoryHits: number; fearHits: number; excerpt: string }>();
    const registerStem = (
      map: Map<string, { count: number; segment: number; excerpt: string }>,
      stem: string,
      segment: number,
      excerpt: string,
    ) => {
      if (stem.length < 10) return;
      const existing = map.get(stem);
      if (!existing) {
        map.set(stem, { count: 1, segment, excerpt });
        return;
      }
      map.set(stem, { ...existing, count: existing.count + 1 });
    };

    for (const segment of input.segments) {
      const sentences = sentenceSplit(segment.text);
      const words = segment.text.split(/\s+/g).filter((token) => token.trim().length > 0).length;
      paragraphLengths.push({ segment: segment.segment, words });
      paragraphShapes.set(`${sentences.length}:${Math.round(words / 25)}`, [
        ...(paragraphShapes.get(`${sentences.length}:${Math.round(words / 25)}`) ?? []),
        segment.segment,
      ]);
      let declarativeCount = 0;
      let sensoryCount = 0;
      let abstractHits = 0;
      let fearHits = 0;
      for (const [sentenceIndex, sentence] of sentences.entries()) {
        const key = sentence
          .toLowerCase()
          .split(/\s+/g)
          .slice(0, 4)
          .join(" ");
        openings.set(key, (openings.get(key) ?? 0) + 1);
        openerSegments.set(key, [...(openerSegments.get(key) ?? []), segment.segment]);
        if (/^\b(the|a|an|this|that|it|they|he|she)\b.+\b(is|are|was|were)\b/i.test(sentence)) declarativeCount += 1;
        if (hasSensoryCue(sentence)) sensoryCount += 1;
        if (/\b(think|thought|know|knew|remember|decide|decided|worry|wonder)\b/i.test(sentence)) {
          registerStem(thoughtStemCounts, semanticStem(sentence), segment.segment, sentence);
        }
        if (/\b(want|wanted|need|needed|must|owe|obligation|duty|cannot afford)\b/i.test(sentence)) {
          registerStem(motiveStemCounts, semanticStem(sentence), segment.segment, sentence);
        }
        if (/\b(fear|afraid|dread|danger|risk|threat|doom)\b/i.test(sentence) && !hasSensoryCue(sentence)) {
          registerStem(fearStemCounts, semanticStem(sentence), segment.segment, sentence);
        }
        if (/\b(silence|shadow|river|fire|blood|oath)\b/i.test(sentence) && /\b(means|sign|stands for|symbol)\b/i.test(sentence)) {
          registerStem(symbolStemCounts, semanticStem(sentence), segment.segment, sentence);
        }
        const namePredicate = sentence.match(/\b([A-Z][a-z]+)\s+(runs a|chooses in|keeps|wants|reads)\s+([^.!?]+)/);
        if (namePredicate) {
          const name = namePredicate[1] ?? "Unknown";
          const predicateStem = semanticStem(namePredicate[3] ?? sentence);
          if (predicateStem.length >= 8) {
            const existing = characterInteriorPredicates.get(predicateStem);
            if (!existing) {
              characterInteriorPredicates.set(predicateStem, {
                names: new Set([name]),
                segment: segment.segment,
                excerpt: sentence,
              });
            } else {
              existing.names.add(name);
            }
          }
        }
        if (/\b(pressure|risk|threat|danger|fear|erasure|exposure|constraint|unresolved|uncertainty)\b/i.test(sentence)) {
          abstractHits += 1;
        }
        if (/\b(fear|afraid|threat|risk|danger|doom|dread)\b/i.test(sentence)) {
          fearHits += 1;
        }
      }
      segmentAbstraction.set(segment.segment, {
        abstractHits,
        sensoryHits: sensoryCount,
        fearHits,
        excerpt: segment.text,
      });
      const summarySignals = sentences.filter((row) =>
        /\b(in this|this scene|the purpose|the chapter|the segment|what follows|this movement)\b/i.test(row),
      );
      if (summarySignals.length > 0) {
        findings.push({
          category: "summary_writing",
          segment: segment.segment,
          position: "start",
          severity: "high",
          excerpt: takeExcerpt(summarySignals[0]),
          whyItFails: "Sentence reports what the prose is doing instead of enacting lived action and perception.",
          recommendedFixType: "prose-brief fix",
          suggestedSystemTarget: "prose-brief fix",
        });
      }
      const connectorCount = sentences.filter((row) => /\btherefore|thus|meanwhile|consequently|in turn|as a result\b/i.test(row)).length;
      if (connectorCount >= 2) {
        findings.push({
          category: "weak_transition_texture",
          segment: segment.segment,
          position: "transition",
          severity: "medium",
          excerpt: takeExcerpt(segment.text),
          whyItFails: "Explanatory connective density creates summary drift and reduces scene immediacy.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
      const declarativeRatio = declarativeCount / Math.max(sentences.length, 1);
      if (declarativeRatio >= 0.45) {
        findings.push({
          category: "declarative_overload",
          segment: segment.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(segment.text),
          whyItFails: "Declarative framing dominates sentence flow and suppresses enacted scene pressure.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
      if (sensoryCount < Math.max(2, Math.floor(sentences.length * 0.25))) {
        findings.push({
          category: "low_embodiment",
          segment: segment.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(segment.text),
          whyItFails: "Embodied sensory and material cues are too sparse for lived historical texture.",
          recommendedFixType: "lived-history fix",
          suggestedSystemTarget: "lived-history fix",
        });
      }
    }

    const repeatedStarts = Array.from(openings.entries()).filter(([, count]) => count >= 3);
    for (const [opening] of repeatedStarts) {
      findings.push({
        category: "repeated_opener",
        segment: (openerSegments.get(opening) ?? [])[0] ?? null,
        position: "start",
        severity: "critical",
        excerpt: opening,
        whyItFails: "Repeated sentence openings indicate templated cadence and synthetic assembly patterns.",
        recommendedFixType: "composer fix",
        suggestedSystemTarget: "voice-contract fix",
      });
    }

    const repeatedShapes = Array.from(paragraphShapes.entries()).filter(([, segments]) => segments.length >= 3);
    for (const [shape, segments] of repeatedShapes) {
      findings.push({
        category: "repeated_paragraph_shape",
        segment: segments[0] ?? null,
        position: "middle",
        severity: "high",
        excerpt: `shape=${shape}; segments=${segments.join(",")}`,
        whyItFails: "Paragraphs carry near-identical shape, flattening pace and erasing syntactic surprise.",
        recommendedFixType: "voice-contract fix",
        suggestedSystemTarget: "voice-contract fix",
      });
    }

    for (const [stem, row] of thoughtStemCounts.entries()) {
      if (row.count >= 3) {
        findings.push({
          category: "repeated_thought_content",
          segment: row.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(`${stem} :: ${row.excerpt}`),
          whyItFails: "Thought content recurs with minimal causal shift, signaling synthetic internal repetition.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
    }
    for (const [stem, row] of motiveStemCounts.entries()) {
      if (row.count >= 3) {
        findings.push({
          category: "paraphrased_motive_repetition",
          segment: row.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(`${stem} :: ${row.excerpt}`),
          whyItFails: "Motive language repeats in paraphrase without new pressure or altered decision stakes.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "review-rule fix",
        });
        findings.push({
          category: "motive_restatement_clusters",
          segment: row.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(`${stem} :: ${row.excerpt}`),
          whyItFails: "Motive progression stalls because similar motive payload recurs across clusters.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
    }
    for (const [stem, row] of fearStemCounts.entries()) {
      if (row.count >= 2) {
        findings.push({
          category: "repeated_abstract_fear_language",
          segment: row.segment,
          position: "middle",
          severity: "medium",
          excerpt: takeExcerpt(`${stem} :: ${row.excerpt}`),
          whyItFails: "Abstract fear wording repeats without embodied escalation markers.",
          recommendedFixType: "lived-history fix",
          suggestedSystemTarget: "composer fix",
        });
      }
    }
    for (const [stem, row] of symbolStemCounts.entries()) {
      if (row.count >= 2) {
        findings.push({
          category: "repeated_symbolic_paraphrase",
          segment: row.segment,
          position: "transition",
          severity: "medium",
          excerpt: takeExcerpt(`${stem} :: ${row.excerpt}`),
          whyItFails: "Symbolic paraphrase repeats conceptual framing instead of scene-specific consequence.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "voice-contract fix",
        });
      }
    }
    for (const [predicateStem, value] of characterInteriorPredicates.entries()) {
      if (value.names.size >= 2) {
        findings.push({
          category: "character_interior_blending",
          segment: value.segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(`${Array.from(value.names).join(", ")} :: ${predicateStem} :: ${value.excerpt}`),
          whyItFails: "Different characters are rendered with interchangeable interior syntax and inference texture.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
    }
    for (const [segment, info] of segmentAbstraction.entries()) {
      if (info.abstractHits >= 4 && info.sensoryHits <= 2) {
        findings.push({
          category: "abstraction_overuse_by_segment",
          segment,
          position: "middle",
          severity: "high",
          excerpt: takeExcerpt(info.excerpt),
          whyItFails: "Segment leans on abstract pressure labels instead of embodied causal detail.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "lived-history fix",
        });
      }
      if (info.fearHits >= 3) {
        findings.push({
          category: "fear_language_density",
          segment,
          position: "middle",
          severity: "medium",
          excerpt: takeExcerpt(info.excerpt),
          whyItFails: "Fear language density is too high for nearby paragraphs at similar abstraction level.",
          recommendedFixType: "composer fix",
          suggestedSystemTarget: "composer fix",
        });
      }
    }

    const avgLength = paragraphLengths.reduce((sum, value) => sum + value.words, 0) / Math.max(paragraphLengths.length, 1);
    const lengthVariance = paragraphLengths.reduce((sum, row) => sum + Math.pow(row.words - avgLength, 2), 0) / Math.max(paragraphLengths.length, 1);
    if (lengthVariance < 180) {
      findings.push({
        category: "synthetic_rhythm",
        segment: paragraphLengths[0]?.segment ?? null,
        position: "middle",
        severity: "high",
        excerpt: `paragraphWordVariance=${Number(lengthVariance.toFixed(2))}`,
        whyItFails: "Paragraph rhythm variance is too low, producing a synthetic cadence profile.",
        recommendedFixType: "voice-contract fix",
        suggestedSystemTarget: "voice-contract fix",
      });
    }

    const balancedClauses = (input.fullText.match(/\bnot only\b|\bon the one hand\b|\bboth\b/gi) ?? []).length;
    if (balancedClauses >= 3) {
      findings.push({
        category: "synthetic_rhythm",
        segment: null,
        position: "middle",
        severity: "medium",
        excerpt: takeExcerpt(input.fullText),
        whyItFails: "Balanced clause constructions recur often enough to reveal rhetorical automation.",
        recommendedFixType: "composer fix",
        suggestedSystemTarget: "review-rule fix",
      });
    }

    const categoryCounts = new Map<string, number>();
    const segmentCounts = new Map<number, number>();
    const positionCounts = { start: 0, middle: 0, transition: 0, unknown: 0 };
    for (const finding of findings) {
      categoryCounts.set(finding.category, (categoryCounts.get(finding.category) ?? 0) + 1);
      if (finding.segment !== null) segmentCounts.set(finding.segment, (segmentCounts.get(finding.segment) ?? 0) + 1);
      positionCounts[finding.position] += 1;
    }
    const mostCommonFailurePattern =
      Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const maxFailures = Math.max(0, ...Array.from(segmentCounts.values()));
    const segmentsWithMostFailures = Array.from(segmentCounts.entries())
      .filter(([, count]) => count === maxFailures && count > 0)
      .map(([segment]) => segment)
      .sort((a, b) => a - b);
    const failureCluster =
      positionCounts.start > positionCounts.middle && positionCounts.start > positionCounts.transition
        ? "starts"
        : positionCounts.middle > positionCounts.start && positionCounts.middle > positionCounts.transition
          ? "middles"
          : positionCounts.transition > positionCounts.start && positionCounts.transition > positionCounts.middle
            ? "transitions"
            : "mixed";

    const summary = {
      repetitionSignals: repeatedStarts.length,
      summaryWritingSignals: findings.filter((row) => row.category === "summary_writing").length,
      syntheticRhythmSignals: findings.filter((row) => row.category === "synthetic_rhythm").length,
      mostCommonFailurePattern: mostCommonFailurePattern as z.infer<typeof CategorySchema> | null,
      segmentsWithMostFailures,
      failureCluster,
    };

    return Book1ProseShapeCriticSchema.parse({
      artifact: "chapter_prose_shape_critic",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      findings,
      summary,
      verdict:
        findings.some((row) => row.severity === "critical") || findings.filter((row) => row.severity === "high").length >= 2
          ? "Synthetic prose signatures remain; regenerate after system-level fixes."
          : "Prose shape passes minimum synthetic-risk threshold.",
    });
  }
}
