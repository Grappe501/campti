import { FragmentType } from "@prisma/client";
import {
  classifyFragmentType,
  normalizeFragmentText,
  scoreAmbiguity,
  scoreConfidence,
  type CandidateFragmentUnit,
} from "@/lib/fragment-decomposition";

const CONTRAST_START =
  /^\s*(but|yet|though|while|instead|except|even|still|however|nevertheless)\b/i;
const QUESTION_LINE = /\?/;
const DIALOGUE_LINE = /^\s*["“”']|[“”']\s*$/;
const RULE_MARKERS = /\b(always|never|must not|the rule is|law is)\b/i;

export type TextSpan = { start: number; end: number; text: string };

function stripForPreview(s: string, max = 220): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Split long blocks into finer units: paragraphs, then sentences around pivots,
 * contrast markers, dialogue boundaries, and questions.
 */
export function refineFragmentSplit(fragmentOrText: { text: string } | string): CandidateFragmentUnit[] {
  const raw = typeof fragmentOrText === "string" ? fragmentOrText : fragmentOrText.text;
  const text = normalizeFragmentText(raw);
  if (!text.length) return [];

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const units: CandidateFragmentUnit[] = [];

  for (const para of paragraphs) {
    const sub = splitParagraphFiner(para);
    for (const chunk of sub) {
      const t = chunk.trim();
      if (t.length < 12) continue;
      const suggestedType = classifyFragmentType(t);
      units.push({
        text: t,
        suggestedType,
        excerpt: stripForPreview(t),
        confidence: scoreConfidence(suggestedType, t),
        ambiguityLevel: scoreAmbiguity(t),
      });
    }
  }

  return mergeTinyNeighbors(units, 24);
}

function splitParagraphFiner(para: string): string[] {
  const s = para.trim();
  if (!s.length) return [];

  // Strong single-line dialogue / question often stands alone
  if (s.length < 320 && DIALOGUE_LINE.test(s) && s.split(/[.!?\n]/).length <= 3) {
    return [s];
  }

  const sentences = splitSentences(s);
  if (sentences.length <= 1) return [s];

  const chunks: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t.length) chunks.push(t);
    buf = "";
  };

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i].trim();
    if (!sent.length) continue;

    const pivot =
      CONTRAST_START.test(sent) ||
      QUESTION_LINE.test(sent) ||
      RULE_MARKERS.test(sent) ||
      (DIALOGUE_LINE.test(sent) && sent.length < 400);

    if (pivot && buf.trim()) {
      flush();
      buf = sent;
      flush();
      continue;
    }

    if (!buf.length) {
      buf = sent;
    } else if (buf.length + sent.length > 900) {
      flush();
      buf = sent;
    } else {
      buf = `${buf} ${sent}`;
    }
  }
  flush();

  return chunks.length ? chunks : [s];
}

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  return [text];
}

function mergeTinyNeighbors(units: CandidateFragmentUnit[], minLen: number): CandidateFragmentUnit[] {
  if (units.length <= 1) return units;
  const out: CandidateFragmentUnit[] = [];
  let i = 0;
  while (i < units.length) {
    let cur = units[i];
    i++;
    while (cur.text.length < minLen && i < units.length) {
      const mergedText = `${cur.text} ${units[i].text}`.trim();
      const suggestedType = classifyFragmentType(mergedText);
      cur = {
        text: mergedText,
        suggestedType,
        excerpt: stripForPreview(mergedText),
        confidence: scoreConfidence(suggestedType, mergedText),
        ambiguityLevel: scoreAmbiguity(mergedText),
      };
      i++;
    }
    out.push(cur);
  }
  return out;
}

/** Heuristic boundaries where interpretive “mode” may shift (indices into original string). */
export function detectMeaningShifts(text: string): TextSpan[] {
  const t = normalizeFragmentText(text);
  const spans: TextSpan[] = [];
  const sentences = splitSentences(t);
  let offset = 0;
  for (const s of sentences) {
    const idx = t.indexOf(s, offset);
    if (idx < 0) continue;
    if (CONTRAST_START.test(s) || RULE_MARKERS.test(s) || QUESTION_LINE.test(s)) {
      spans.push({ start: idx, end: idx + s.length, text: s });
    }
    offset = idx + s.length;
  }
  return spans;
}

export function detectSymbolicPivots(text: string): TextSpan[] {
  const t = normalizeFragmentText(text);
  const sym = /\b(smoke|fire|water|river|blood|stone|bread|root|grave|road|threshold|ring|bell)\b/gi;
  const spans: TextSpan[] = [];
  let m: RegExpExecArray | null;
  while ((m = sym.exec(t)) !== null) {
    const start = Math.max(0, m.index - 40);
    const end = Math.min(t.length, m.index + m[0].length + 80);
    spans.push({ start, end, text: t.slice(start, end).trim() });
  }
  return spans.slice(0, 8);
}

export function detectEmotionalPivots(text: string): TextSpan[] {
  const t = normalizeFragmentText(text);
  const emo =
    /\b(fear|grief|love|longing|rage|shame|hope|dread|joy|loss|ache|weep|silence|heavy|calm|dread)\b/gi;
  const spans: TextSpan[] = [];
  let m: RegExpExecArray | null;
  while ((m = emo.exec(t)) !== null) {
    const start = Math.max(0, m.index - 30);
    const end = Math.min(t.length, m.index + m[0].length + 90);
    spans.push({ start, end, text: t.slice(start, end).trim() });
  }
  return spans.slice(0, 8);
}

export function detectNarrativeFunctionPivots(text: string): TextSpan[] {
  const t = normalizeFragmentText(text);
  const spans: TextSpan[] = [];
  if (/^\s*["“”']/.test(t)) {
    spans.push({ start: 0, end: Math.min(t.length, 240), text: t.slice(0, 240) });
  }
  const reflect = /\b(i remember|we remember|childhood|back when|years later|now i see)\b/i;
  const m = reflect.exec(t);
  if (m) {
    spans.push({
      start: m.index,
      end: Math.min(t.length, m.index + 200),
      text: t.slice(m.index, m.index + 200),
    });
  }
  return spans;
}
