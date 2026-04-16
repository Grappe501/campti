import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { OutlineDrivenChapterDraft } from "@/lib/services/book1-outline-driven-chapter-composer";

export type Book1ReviewEngineReport = {
  generatedAt: string;
  chapter1Summary: {
    proseNaturalness: { score: number; findings: string[] };
    outlineLeakage: { score: number; findings: string[] };
    historicalIntegrationQuality: { score: number; findings: string[] };
    characterCoherence: { score: number; findings: string[] };
    narrativeContinuity: { score: number; findings: string[] };
  };
  chapter: {
    coherence: { score: number; findings: string[] };
    pacing: { score: number; findings: string[] };
    emotionalArc: { score: number; findings: string[] };
  };
  scenes: Array<{
    segment: number;
    clarity: { score: number; notes: string[] };
    realism: { score: number; notes: string[] };
    continuity: { score: number; notes: string[] };
  }>;
  paragraphs: Array<{
    paragraphIndex: number;
    proseQuality: { score: number; notes: string[] };
    redundancy: { score: number; notes: string[] };
    toneConsistency: { score: number; notes: string[] };
  }>;
};

function scoreFromBoolean(flags: boolean[]): number {
  if (flags.length === 0) return 0;
  const hit = flags.filter(Boolean).length;
  return Math.round((hit / flags.length) * 100);
}

function proseStats(paragraph: string): { sentenceCount: number; wordCount: number } {
  const sentenceCount = paragraph.split(/[.!?]+/g).filter((piece) => piece.trim().length > 0).length;
  const wordCount = paragraph.split(/\s+/g).filter((word) => word.trim().length > 0).length;
  return { sentenceCount, wordCount };
}

function redundancyPenalty(paragraph: string): number {
  const words = paragraph
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length >= 4);
  const unique = new Set(words);
  if (words.length === 0) return 0;
  const duplicateRatio = 1 - unique.size / words.length;
  return Math.round(duplicateRatio * 100);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export class Book1OutlineReviewEngine {
  review(input: { outline: Chapter1DeepOutline; chapterDraft: OutlineDrivenChapterDraft }): Book1ReviewEngineReport {
    const chapterFindings: string[] = [];
    const hasAllSegments = input.chapterDraft.segmentDrafts.length === input.outline.timeline.length;
    if (!hasAllSegments) chapterFindings.push("Segment count differs from deep outline.");
    const complianceFlags = input.chapterDraft.segmentDrafts.map(
      (segment) => segment.compliance.followsOutline && segment.compliance.includesHistoricalGrounding && segment.compliance.includesPsychologicalArc,
    );
    const coherenceScore = scoreFromBoolean([hasAllSegments, ...complianceFlags]);
    if (coherenceScore < 90) chapterFindings.push("One or more segments miss required outline constraints.");

    const pacingNotes: string[] = [];
    const pacingScore = scoreFromBoolean(
      input.chapterDraft.segmentDrafts.map((segment) => {
        const words = segment.text.split(/\s+/g).filter((word) => word.trim().length > 0).length;
        const ok = words >= 50 && words <= 230;
        if (!ok) pacingNotes.push(`Segment ${segment.segment} is outside target density (${words} words).`);
        return ok;
      }),
    );

    const emotionalFindings: string[] = [];
    const emotionalScore = scoreFromBoolean(
      input.chapterDraft.segmentDrafts.map((segment) => {
        const text = segment.text.toLowerCase();
        const ok = text.includes("fear") || text.includes("desire") || text.includes("pressure") || text.includes("stakes");
        if (!ok) emotionalFindings.push(`Segment ${segment.segment} lacks explicit emotional pressure terms.`);
        return ok;
      }),
    );

    const scenes = input.chapterDraft.segmentDrafts.map((segment, index) => {
      const outlineSegment = input.outline.timeline[index];
      const text = segment.text.toLowerCase();
      const clarityFlags = [text.includes("focus"), text.includes("transition"), text.includes("reader should feel")];
      const realismFlags = [text.includes("historically"), text.includes("environment"), text.includes("setting")];
      const continuityFlags = [text.includes("foreshadowing"), text.includes("transition:"), text.includes("next")];
      return {
        segment: segment.segment,
        clarity: {
          score: scoreFromBoolean(clarityFlags),
          notes:
            scoreFromBoolean(clarityFlags) >= 67
              ? []
              : [`Segment ${segment.segment} should clarify action beats more concretely.`],
        },
        realism: {
          score: scoreFromBoolean(realismFlags),
          notes: scoreFromBoolean(realismFlags) >= 67 ? [] : [`Segment ${segment.segment} needs stronger historical/physical grounding.`],
        },
        continuity: {
          score: scoreFromBoolean(continuityFlags),
          notes:
            scoreFromBoolean(continuityFlags) >= 67
              ? []
              : [`Segment ${segment.segment} should strengthen carryover into ${outlineSegment.transitionToNext}`],
        },
      };
    });

    const paragraphs = input.chapterDraft.segmentDrafts.map((segment, index) => {
      const stats = proseStats(segment.text);
      const redundancy = redundancyPenalty(segment.text);
      const proseQuality = scoreFromBoolean([stats.sentenceCount >= 3, stats.wordCount >= 60, stats.wordCount <= 230]);
      const redundancyScore = Math.max(0, 100 - redundancy);
      const toneConsistency = scoreFromBoolean([
        segment.text.includes("Psychologically"),
        segment.text.includes("Historically"),
        segment.text.includes("Foreshadowing"),
      ]);
      return {
        paragraphIndex: index + 1,
        proseQuality: {
          score: proseQuality,
          notes: proseQuality >= 67 ? [] : ["Paragraph density or sentence structure is outside control envelope."],
        },
        redundancy: {
          score: redundancyScore,
          notes: redundancyScore >= 70 ? [] : ["Repeated lexical patterns detected; tighten diction."],
        },
        toneConsistency: {
          score: toneConsistency,
          notes: toneConsistency >= 67 ? [] : ["Narrative control markers are inconsistent across paragraph."],
        },
      };
    });

    const fullTextLower = input.chapterDraft.fullText.toLowerCase();
    const proseFindings: string[] = [];
    const sentenceLengths = input.chapterDraft.fullText
      .split(/[.!?]+/g)
      .map((sentence) => sentence.split(/\s+/g).filter((word) => word.trim().length > 0).length)
      .filter((count) => count > 0);
    const avgSentenceLength = average(sentenceLengths);
    const proseNaturalnessScore = scoreFromBoolean([
      avgSentenceLength >= 11,
      avgSentenceLength <= 30,
      !/\b(the focus turns to|psychologically,|this beat matters because|the reader should feel)\b/i.test(input.chapterDraft.fullText),
      input.chapterDraft.fullText.split("\n").length > 8,
    ]);
    if (proseNaturalnessScore < 80) proseFindings.push("Sentence rhythm or control markers still feel outline-shaped.");

    const leakageFindings: string[] = [];
    const leakageMarkers = [
      "segment ",
      "foreshadowing signal",
      "transition:",
      "this beat matters because",
      "the reader should feel",
      "psychologically,",
    ];
    const leakageHits = leakageMarkers.filter((marker) => fullTextLower.includes(marker));
    const outlineLeakageScore = Math.max(0, 100 - leakageHits.length * 18);
    if (leakageHits.length > 0) leakageFindings.push(`Detected outline leakage markers: ${leakageHits.join(", ")}.`);

    const historicalFindings: string[] = [];
    const historicalCleanFlags = input.chapterDraft.segmentDrafts.map((segment) => {
      const text = segment.text.toLowerCase();
      const hasGrounding = /(river|settlement|lineage|council|colonial|archive|historical|kinship)/.test(text);
      const hasDebris = /(https?:\/\/|\[[^\]]+\]\([^)]+\)|^\s*[-*]\s+)/m.test(segment.text);
      return hasGrounding && !hasDebris;
    });
    const historicalIntegrationScore = scoreFromBoolean(historicalCleanFlags);
    if (historicalIntegrationScore < 85) historicalFindings.push("Some segments are missing clean historical grounding or still contain citation debris.");

    const coherenceFindings: string[] = [];
    const chapterCharacters = Array.from(new Set(input.outline.timeline.flatMap((segment) => segment.characters)));
    const characterCoverage = chapterCharacters.map((character) => fullTextLower.includes(character.toLowerCase()));
    const characterCoherenceScore = scoreFromBoolean(characterCoverage);
    if (characterCoherenceScore < 80) coherenceFindings.push("One or more outlined characters have weak on-page presence.");

    const continuityFindings: string[] = [];
    const continuityFlags = input.chapterDraft.segmentDrafts.map((segment, index) => {
      if (index === 0) return true;
      const previous = input.chapterDraft.segmentDrafts[index - 1];
      const previousTail = previous.text.split(/\s+/g).slice(-40).join(" ").toLowerCase();
      const currentHead = segment.text.split(/\s+/g).slice(0, 40).join(" ").toLowerCase();
      const overlapTokens = previousTail
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 5)
        .filter((token) => currentHead.includes(token));
      return overlapTokens.length > 0;
    });
    const narrativeContinuityScore = scoreFromBoolean(continuityFlags);
    if (narrativeContinuityScore < 80) continuityFindings.push("Segment handoffs need stronger lexical continuity.");

    return {
      generatedAt: new Date().toISOString(),
      chapter1Summary: {
        proseNaturalness: { score: proseNaturalnessScore, findings: proseFindings },
        outlineLeakage: { score: outlineLeakageScore, findings: leakageFindings },
        historicalIntegrationQuality: { score: historicalIntegrationScore, findings: historicalFindings },
        characterCoherence: { score: characterCoherenceScore, findings: coherenceFindings },
        narrativeContinuity: { score: narrativeContinuityScore, findings: continuityFindings },
      },
      chapter: {
        coherence: { score: coherenceScore, findings: chapterFindings },
        pacing: { score: pacingScore, findings: pacingNotes },
        emotionalArc: { score: emotionalScore, findings: emotionalFindings },
      },
      scenes,
      paragraphs,
    };
  }
}
