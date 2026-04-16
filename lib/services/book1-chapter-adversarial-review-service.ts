import { z } from "zod";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1OutlineReviewEngine, type Book1ReviewEngineReport } from "@/lib/services/book1-outline-review-engine";
import type { OutlineDrivenChapterDraft } from "@/lib/services/book1-outline-driven-chapter-composer";
import { Book1ProseShapeCriticService } from "@/lib/services/book1-prose-shape-critic-service";
import type { ChapterDraft } from "@/lib/services/book1-latent-epic-chapter-service";

const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
const FixTypeSchema = z.enum([
  "voice-spec fix",
  "chapter-law fix",
  "evidence-pack fix",
  "voice-contract fix",
  "prose-brief fix",
  "lived-history fix",
  "composer fix",
  "review-rule fix",
]);

export const CriticFindingSchema = z.object({
  category: z.string().optional(),
  segment: z.number().nullable().optional(),
  position: z.enum(["start", "middle", "transition", "unknown"]).optional(),
  severity: SeveritySchema,
  excerpt: z.string(),
  whyItFails: z.string(),
  recommendedFixType: FixTypeSchema,
  suggestedSystemTarget: FixTypeSchema.optional(),
});

export const CriticReportSchema = z.object({
  chapter: z.literal(1),
  critic: z.string(),
  generatedAt: z.string(),
  findings: z.array(CriticFindingSchema),
  verdict: z.string(),
});

export const AdversarialSummarySchema = z.object({
  chapter: z.literal(1),
  generatedAt: z.string(),
  critics: z.object({
    voice: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    historical: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    novel: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    proseShape: z.object({ findingCount: z.number(), criticalCount: z.number() }),
  }),
  severityTotals: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  proseShapeCategoryTotals: z.record(z.string(), z.number()).optional(),
  recommendedFixTotals: z.record(z.string(), z.number()),
  rerunChapterReview: z.object({
    chapterCoherence: z.number(),
    chapterPacing: z.number(),
    chapterEmotionalArc: z.number(),
    proseNaturalness: z.number(),
    outlineLeakage: z.number(),
    historicalIntegrationQuality: z.number(),
    characterCoherence: z.number(),
    narrativeContinuity: z.number(),
  }),
  releaseDecision: z.string(),
});

export type CriticFinding = z.infer<typeof CriticFindingSchema>;
export type CriticReport = z.infer<typeof CriticReportSchema>;
export type AdversarialSummary = z.infer<typeof AdversarialSummarySchema>;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function hasAny(value: string, tokens: string[]): boolean {
  const lower = value.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function repetitionRoots(segmentTexts: string[]): string[] {
  const counts = new Map<string, number>();
  for (const text of segmentTexts) {
    const firstSentence = sentences(text)[0] ?? text;
    const root = normalize(firstSentence)
      .split(/\s+/g)
      .slice(0, 7)
      .join(" ");
    counts.set(root, (counts.get(root) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([root]) => root);
}

function takeExcerpt(value: string): string {
  return value.length > 260 ? `${value.slice(0, 257)}...` : value;
}

function segmentDraftToOutlineDraft(chapterDraft: ChapterDraft, outline: Chapter1DeepOutline): OutlineDrivenChapterDraft {
  const segmentDrafts = chapterDraft.segments.map((segment, index) => {
    const expected = outline.timeline[index];
    const textLower = segment.text.toLowerCase();
    const focusTokens = (expected?.sceneFocus ?? "")
      .toLowerCase()
      .split(/\W+/g)
      .filter((token) => token.length > 4);
    return {
      segment: segment.segment,
      heading: `Movement ${segment.segment}`,
      text: segment.text,
      compliance: {
        followsOutline: focusTokens.some((token) => textLower.includes(token)),
        includesPsychologicalArc: /(fear|desire|duty|pressure|grief|loyalty|belonging|wound)/.test(textLower),
        includesHistoricalGrounding: /(river|settlement|lineage|council|kinship|ritual|clan|household)/.test(textLower),
      },
    };
  });
  return {
    chapter: 1,
    title: chapterDraft.title,
    segmentDrafts,
    fullText: chapterDraft.fullText,
  };
}

export class Book1ChapterAdversarialReviewService {
  run(input: { chapterDraft: ChapterDraft; outline: Chapter1DeepOutline }): {
    voiceCritic: CriticReport;
    historicalCritic: CriticReport;
    novelCritic: CriticReport;
    proseShapeCritic: CriticReport;
    summary: AdversarialSummary;
  } {
    const generatedAt = new Date().toISOString();
    const voiceCritic = this.runVoiceCritic(input.chapterDraft, generatedAt);
    const historicalCritic = this.runHistoricalCritic(input.chapterDraft, generatedAt);
    const novelCritic = this.runNovelCritic(input.chapterDraft, generatedAt);
    const proseShapeCritic = this.runProseShapeCritic(input.chapterDraft, generatedAt);
    const rerunReport = this.rerunChapterReview(input.chapterDraft, input.outline);
    const summary = this.buildSummary({
      voiceCritic,
      historicalCritic,
      novelCritic,
      proseShapeCritic,
      rerunReport,
      generatedAt,
    });
    return { voiceCritic, historicalCritic, novelCritic, proseShapeCritic, summary };
  }

  private runVoiceCritic(chapterDraft: ChapterDraft, generatedAt: string): CriticReport {
    const findings: CriticFinding[] = [];
    const allSentences = chapterDraft.segments.flatMap((segment) => sentences(segment.text));
    const genericTokens = ["appears ordinary", "rises by increments", "remains unresolved", "preserve future arc constraints"];
    const abstractionTokens = ["constraints", "signals", "system", "practical law", "future arc"];
    for (const sentence of allSentences) {
      if (hasAny(sentence, genericTokens)) {
        findings.push({
          severity: "high",
          excerpt: takeExcerpt(sentence),
          whyItFails: "Phrase template is generic and performs tension by declaration rather than voice-specific perception.",
          recommendedFixType: "voice-spec fix",
        });
      }
      if (hasAny(sentence, abstractionTokens) && !hasAny(sentence, ["ash", "cane", "river", "fire", "hands"])) {
        findings.push({
          severity: "medium",
          excerpt: takeExcerpt(sentence),
          whyItFails: "Abstract modern diction drifts from embodied period voice and flattens tonal distinctiveness.",
          recommendedFixType: "voice-spec fix",
        });
      }
      if (hasAny(sentence, ["no one names aloud", "unresolved debt"]) && sentence.split(/\s+/g).length < 24) {
        findings.push({
          severity: "medium",
          excerpt: takeExcerpt(sentence),
          whyItFails: "Emotional claim is unearned because scene-specific triggering action is absent.",
          recommendedFixType: "composer fix",
        });
      }
    }
    return CriticReportSchema.parse({
      chapter: 1,
      critic: "Voice Critic",
      generatedAt,
      findings,
      verdict: findings.length > 0 ? "Voice register fails stress test; rewrite system constraints before scaling." : "No failures detected.",
    });
  }

  private runHistoricalCritic(chapterDraft: ChapterDraft, generatedAt: string): CriticReport {
    const findings: CriticFinding[] = [];
    const segmentTexts = chapterDraft.segments.map((segment) => segment.text);
    for (const segmentText of segmentTexts) {
      const sentenceList = sentences(segmentText);
      for (const sentence of sentenceList) {
        if (hasAny(sentence, ["because memory operates as practical law", "evidence traces:"])) {
          findings.push({
            severity: "critical",
            excerpt: takeExcerpt(sentence),
            whyItFails: "Reads like explanatory notes and provenance logging instead of lived historical reality.",
            recommendedFixType: "composer fix",
          });
        }
        if (hasAny(sentence, ["ad onward", "layer one:", "history"])) {
          findings.push({
            severity: "high",
            excerpt: takeExcerpt(sentence),
            whyItFails: "Context is imported as research residue, not metabolized into period action.",
            recommendedFixType: "evidence-pack fix",
          });
        }
      }
      const expositoryLength = sentenceList.filter((row) => hasAny(row, ["because", "operates", "constraints", "future arc"])).length;
      if (expositoryLength >= 2) {
        findings.push({
          severity: "medium",
          excerpt: takeExcerpt(segmentText),
          whyItFails: "Exposition density overwhelms immediate scene embodiment and temporal immediacy.",
          recommendedFixType: "chapter-law fix",
        });
      }
    }
    return CriticReportSchema.parse({
      chapter: 1,
      critic: "Historical Texture Critic",
      generatedAt,
      findings,
      verdict: findings.length > 0 ? "Historical texture fails adversarial review; lived-world embedding is insufficient." : "No failures detected.",
    });
  }

  private runNovelCritic(chapterDraft: ChapterDraft, generatedAt: string): CriticReport {
    const findings: CriticFinding[] = [];
    const segmentTexts = chapterDraft.segments.map((segment) => segment.text);
    const roots = repetitionRoots(segmentTexts);
    for (const root of roots) {
      findings.push({
        severity: "critical",
        excerpt: takeExcerpt(root),
        whyItFails: "Repeated sentence architecture across segments signals synthesized templating rather than authored progression.",
        recommendedFixType: "composer fix",
      });
    }
    for (const segmentText of segmentTexts) {
      if (hasAny(segmentText, ["evidence traces:", "chapter law", "future arc constraints"])) {
        findings.push({
          severity: "critical",
          excerpt: takeExcerpt(segmentText),
          whyItFails: "Outline/governance residue leaks directly into prose surface and breaks novel illusion.",
          recommendedFixType: "review-rule fix",
        });
      }
      if (hasAny(segmentText, ["and each answer leaves one unresolved debt", "signals from hidden pressure"])) {
        findings.push({
          severity: "high",
          excerpt: takeExcerpt(segmentText),
          whyItFails: "Transition language reports stakes but does not enact stakes through concrete scene turns.",
          recommendedFixType: "composer fix",
        });
      }
    }
    return CriticReportSchema.parse({
      chapter: 1,
      critic: "Novel Critic",
      generatedAt,
      findings,
      verdict: findings.length > 0 ? "Draft fails novel-authorship stress test; synthesis signature remains obvious." : "No failures detected.",
    });
  }

  private runProseShapeCritic(chapterDraft: ChapterDraft, generatedAt: string): CriticReport {
    const report = new Book1ProseShapeCriticService().run({
      segments: chapterDraft.segments.map((segment) => ({ segment: segment.segment, text: segment.text })),
      fullText: chapterDraft.fullText,
    });
    return CriticReportSchema.parse({
      chapter: 1,
      critic: "Prose Shape Critic",
      generatedAt,
      findings: report.findings,
      verdict: report.verdict,
    });
  }

  private rerunChapterReview(chapterDraft: ChapterDraft, outline: Chapter1DeepOutline): Book1ReviewEngineReport {
    const adapterDraft = segmentDraftToOutlineDraft(chapterDraft, outline);
    return new Book1OutlineReviewEngine().review({
      outline,
      chapterDraft: adapterDraft,
    });
  }

  private buildSummary(input: {
    voiceCritic: CriticReport;
    historicalCritic: CriticReport;
    novelCritic: CriticReport;
    proseShapeCritic: CriticReport;
    rerunReport: Book1ReviewEngineReport;
    generatedAt: string;
  }): AdversarialSummary {
    const allFindings = input.voiceCritic.findings
      .concat(input.historicalCritic.findings, input.novelCritic.findings)
      .concat(input.proseShapeCritic.findings);
    const severityTotals = {
      low: allFindings.filter((finding) => finding.severity === "low").length,
      medium: allFindings.filter((finding) => finding.severity === "medium").length,
      high: allFindings.filter((finding) => finding.severity === "high").length,
      critical: allFindings.filter((finding) => finding.severity === "critical").length,
    };
    const fixMap = new Map<string, number>();
    for (const finding of allFindings) {
      fixMap.set(finding.recommendedFixType, (fixMap.get(finding.recommendedFixType) ?? 0) + 1);
    }
    const proseShapeCategoryTotals = input.proseShapeCritic.findings.reduce<Record<string, number>>((acc, finding) => {
      const category = finding.category ?? "uncategorized";
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});
    const recommendedFixTotals = Object.fromEntries(Array.from(fixMap.entries()).sort((a, b) => b[1] - a[1]));
    return AdversarialSummarySchema.parse({
      chapter: 1,
      generatedAt: input.generatedAt,
      critics: {
        voice: {
          findingCount: input.voiceCritic.findings.length,
          criticalCount: input.voiceCritic.findings.filter((finding) => finding.severity === "critical").length,
        },
        historical: {
          findingCount: input.historicalCritic.findings.length,
          criticalCount: input.historicalCritic.findings.filter((finding) => finding.severity === "critical").length,
        },
        novel: {
          findingCount: input.novelCritic.findings.length,
          criticalCount: input.novelCritic.findings.filter((finding) => finding.severity === "critical").length,
        },
        proseShape: {
          findingCount: input.proseShapeCritic.findings.length,
          criticalCount: input.proseShapeCritic.findings.filter((finding) => finding.severity === "critical").length,
        },
      },
      severityTotals,
      proseShapeCategoryTotals,
      recommendedFixTotals,
      rerunChapterReview: {
        chapterCoherence: input.rerunReport.chapter.coherence.score,
        chapterPacing: input.rerunReport.chapter.pacing.score,
        chapterEmotionalArc: input.rerunReport.chapter.emotionalArc.score,
        proseNaturalness: input.rerunReport.chapter1Summary.proseNaturalness.score,
        outlineLeakage: input.rerunReport.chapter1Summary.outlineLeakage.score,
        historicalIntegrationQuality: input.rerunReport.chapter1Summary.historicalIntegrationQuality.score,
        characterCoherence: input.rerunReport.chapter1Summary.characterCoherence.score,
        narrativeContinuity: input.rerunReport.chapter1Summary.narrativeContinuity.score,
      },
      releaseDecision:
        severityTotals.critical > 0 ||
        severityTotals.high > 3 ||
        input.proseShapeCritic.findings.filter((finding) => finding.severity === "high").length > 2
          ? "BLOCKED: Chapter 1 is not scale-ready. Apply system fixes and rerun adversarial review."
          : "CONDITIONAL: Proceed only after targeted fix verification.",
    });
  }
}
