import type {
  HumanizationAdvisoryFinding,
  HumanizationAdvisoryReport,
} from "@/lib/domain/author-voice-humanization";

const GENERIC_PHRASES =
  /\b(something about|a sense of|it felt like|for some reason|somehow|almost as if)\b/gi;
const EXPLAIN_PHRASES = /\b(because|which meant|in order to|the reason|therefore|thus)\b/gi;
const ABSTRACT_EMOTION = /\b(fear|anger|sadness|joy|anxiety|relief)\b/gi;

function tokenizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sentenceLengths(text: string): number[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((s) => tokenizeWords(s).length);
}

function sensoryHits(text: string): number {
  const t = text.toLowerCase();
  let n = 0;
  if (/\b(smell|scent|odor|reek)\b/.test(t)) n++;
  if (/\b(hear|heard|sound|silence|quiet|rustle)\b/.test(t)) n++;
  if (/\b(touch|cold|warm|rough|smooth|skin)\b/.test(t)) n++;
  if (/\b(taste|bitter|salt|sour)\b/.test(t)) n++;
  if (/\b(saw|see|saw|sight|light|dark|color)\b/.test(t)) n++;
  return n;
}

function shortSentenceRatio(lengths: number[]): number {
  if (lengths.length === 0) return 0;
  const m = lengths.filter((l) => l > 0 && l <= 7).length;
  return m / lengths.length;
}

/**
 * Deterministic advisory only — not a quality gate; append to generation warnings.
 */
export function assessProseHumanizationAdvisory(text: string): HumanizationAdvisoryReport {
  const findings: HumanizationAdvisoryFinding[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    return { contractVersion: "1", findings: [], advisoryOnly: true };
  }

  const words = tokenizeWords(trimmed);
  const wc = words.length;
  const genericMatches = trimmed.match(GENERIC_PHRASES);
  const genericRate = genericMatches ? genericMatches.length / Math.max(1, wc / 100) : 0;
  if (genericRate > 0.35 && wc > 80) {
    findings.push({
      code: "generic_diction_risk",
      severity: "warning",
      message: "Elevated generic framing phrases—consider sharper particulars.",
      evidence: { hits: genericMatches?.length ?? 0 },
    });
  }

  const explainMatches = trimmed.match(EXPLAIN_PHRASES);
  const explainRate = explainMatches ? explainMatches.length / Math.max(1, wc / 100) : 0;
  if (explainRate > 0.55 && wc > 80) {
    findings.push({
      code: "over_explanation_risk",
      severity: "info",
      message: "Frequent causal/explanatory connectors—action may be over-glossed.",
      evidence: { hits: explainMatches?.length ?? 0 },
    });
  }

  const lengths = sentenceLengths(trimmed);
  if (lengths.length >= 5) {
    const m = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const v =
      lengths.reduce((s, x) => s + (x - m) ** 2, 0) / lengths.length;
    const sd = Math.sqrt(v);
    if (sd < 4 && m > 12) {
      findings.push({
        code: "over_smooth_cadence",
        severity: "info",
        message: "Sentence lengths are unusually uniform—may read over-polished.",
        evidence: { sentenceSd: sd },
      });
    }
  }

  const sensory = sensoryHits(trimmed);
  if (wc > 120 && sensory < 2) {
    findings.push({
      code: "thin_sensory_detail",
      severity: "info",
      message: "Few sensory anchors (non-visual channels especially).",
      evidence: { sensoryHits: sensory },
    });
  }

  if (wc > 120 && shortSentenceRatio(lengths) < 0.08 && lengths.length >= 6) {
    findings.push({
      code: "insufficient_silence_or_gap",
      severity: "info",
      message: "Few short sentences or breaths—consider white space and truncation.",
      evidence: { shortSentenceRatio: shortSentenceRatio(lengths) },
    });
  }

  const abstractEmotion = trimmed.match(ABSTRACT_EMOTION);
  if (abstractEmotion && abstractEmotion.length >= 4 && sensory < 3 && wc > 150) {
    findings.push({
      code: "unwitnessed_scene_risk",
      severity: "warning",
      message: "Named emotions outpace embodied/sensory cues—scene may feel summarized.",
      evidence: { abstractEmotionHits: abstractEmotion.length },
    });
  }

  return { contractVersion: "1", findings, advisoryOnly: true };
}
