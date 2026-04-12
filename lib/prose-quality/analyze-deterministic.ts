import { createHash } from "crypto";

import { scanCliches } from "@/lib/prose-quality/cliche-scan";
import { dialogueDistinctiveness, extractQuotedSegments } from "@/lib/prose-quality/dialogue";
import { analyzeHistoricalAnchors } from "@/lib/prose-quality/historical-anchors";
import { collectRepeatedPhrases } from "@/lib/prose-quality/ngrams";
import { analyzeRhythm } from "@/lib/prose-quality/rhythm";
import { analyzeSensory } from "@/lib/prose-quality/sensory-scan";
import { splitSentences } from "@/lib/prose-quality/sentence-split";
import type {
  AnalyzeProseContext,
  ProseIssue,
  ProseQualityReportV1,
} from "@/lib/prose-quality/types";
import { analyzeVoiceFit } from "@/lib/prose-quality/voice-fit";

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

export function analyzeProseDeterministic(
  text: string,
  ctx: AnalyzeProseContext = {}
): ProseQualityReportV1 {
  const trimmed = text.trim();
  if (!trimmed) {
    return emptyReport(ctx);
  }
  const sentences = splitSentences(trimmed);
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const rhythm = analyzeRhythm(lengths.length ? lengths : [trimmed.split(/\s+/).length || 1]);
  const wordCount = normalizeWordCount(trimmed);
  const paragraphCount = trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;

  const repetition = {
    phrases: collectRepeatedPhrases(trimmed, 3, 5, 2),
    maxNgram: 5,
  };

  const clicheHits = scanCliches(trimmed);
  const sensory = analyzeSensory(trimmed);
  const quoted = extractQuotedSegments(trimmed);
  const dialogue = dialogueDistinctiveness(quoted);

  const textLower = trimmed.toLowerCase();
  const voiceFit = analyzeVoiceFit(textLower, ctx);
  const historicalAnchors = analyzeHistoricalAnchors(
    textLower,
    ctx.historicalAnchorTerms
  );

  const issues: ProseIssue[] = [...voiceFit.issues];

  if (rhythm.monotonousRhythm) {
    issues.push({
      code: "rhythm.monotonous",
      severity: "warning",
      message:
        "Sentence lengths cluster tightly—consider varying cadence (fragment, long winding line, withheld predicate).",
    });
  }

  if (repetition.phrases.length >= 6) {
    issues.push({
      code: "repetition.ngrams",
      severity: "warning",
      message: `Repeated ${repetition.maxNgram}-word patterns detected—tighten or vary.`,
      excerpt: repetition.phrases[0]?.normalized,
    });
  }

  if (clicheHits.length >= 3) {
    issues.push({
      code: "cliche.density",
      severity: "warning",
      message: `Workshop cliché / generic phrasing hits: ${clicheHits.length}. Review flagged spans.`,
    });
  }

  if (sensory.ratio < 0.35 && wordCount > 220) {
    issues.push({
      code: "sensory.thin",
      severity: "info",
      message:
        "Concrete sensory lexicon is sparse relative to abstraction—add body, material, weather, labor texture.",
    });
  }

  if (
    dialogue.alternatingDistinctiveness !== null &&
    dialogue.alternatingDistinctiveness < 0.35 &&
    quoted.length >= 4
  ) {
    issues.push({
      code: "dialogue.sameness",
      severity: "info",
      message:
        "Alternating quoted lines share vocabulary—differentiate speakers (syntax, omission, code-switching).",
    });
  }

  if (historicalAnchors && historicalAnchors.hitRate < 0.25 && historicalAnchors.termsRequested.length >= 5) {
    issues.push({
      code: "historical.anchor_thin",
      severity: "warning",
      message:
        "Few author-specified historical anchor terms appear—layer period objects, law, labor, land, or material culture.",
    });
  }

  const hash = sha256Hex(trimmed);

  return {
    version: 1,
    analyzerKind: "deterministic_v1",
    proseStats: {
      wordCount,
      paragraphCount,
      sha256: hash,
    },
    rhythm,
    repetition,
    cliche: { hits: clicheHits },
    sensory,
    dialogue,
    voiceFit,
    historicalAnchors,
    issues,
  };
}

function normalizeWordCount(t: string): number {
  return t.split(/\s+/).filter(Boolean).length;
}

function emptyReport(ctx: AnalyzeProseContext): ProseQualityReportV1 {
  const hash = createHash("sha256").update("", "utf8").digest("hex");
  return {
    version: 1,
    analyzerKind: "deterministic_v1",
    proseStats: { wordCount: 0, paragraphCount: 0, sha256: hash },
    rhythm: analyzeRhythm([0]),
    repetition: { phrases: [], maxNgram: 5 },
    cliche: { hits: [] },
    sensory: { sensoryHits: 0, abstractHits: 0, ratio: 0, thinExcerpts: [] },
    dialogue: {
      quotedSegments: 0,
      alternatingDistinctiveness: null,
      note: "Empty input.",
    },
    voiceFit: analyzeVoiceFit("", ctx),
    historicalAnchors: analyzeHistoricalAnchors("", ctx.historicalAnchorTerms),
    issues: [
      {
        code: "input.empty",
        severity: "info",
        message: "No prose text to analyze.",
      },
    ],
  };
}
