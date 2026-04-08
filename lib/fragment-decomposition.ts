import { FragmentType } from "@prisma/client";
import {
  FRAGMENT_LINK_ROLES,
  type FragmentLinkRole,
} from "@/lib/fragment-types";

export type CandidateFragmentUnit = {
  text: string;
  suggestedType: FragmentType;
  excerpt: string;
  confidence: number;
  ambiguityLevel: number;
};

export type PlacementSuggestionInput = {
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  confidence?: number | null;
  rationale?: string | null;
};

export type EntityHints = {
  chapterTitles?: { id: string; title: string }[];
  sceneLabels?: { id: string; label: string; chapterTitle?: string }[];
  symbolNames?: { id: string; name: string }[];
  placeNames?: { id: string; name: string }[];
  personNames?: { id: string; name: string }[];
  openQuestionTitles?: { id: string; title: string }[];
};

const EMOTION_WORDS =
  /\b(fear|grief|love|longing|rage|shame|hope|dread|joy|loss|ache|tremble|weep|silence|heavy)\b/i;
const ORAL_MARKERS =
  /\b(they say|grandmother|grandpa|oral|told me|family story|remember hearing|elders|folks used to)\b/i;
const OUTLINE_MARKERS = /^(#{1,6}\s|chapter\s+\d|scene\s+\d|part\s+[ivx\d])/i;
const QUESTIONISH = /\?/;
const SENSORY_WORDS =
  /\b(smell|taste|touch|sound|heard|saw|felt|cold|warm|light|dark|color|texture|rain|wind)\b/i;
const TIME_HINT = /\b(1[0-9]{3}|18\d{2}|19\d{2}|20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

export function scoreAmbiguity(text: string): number {
  let s = 1;
  if (QUESTIONISH.test(text)) s += 1;
  if (/\b(maybe|perhaps|unclear|might|could be|unsure|contradict)\b/i.test(text)) s += 1;
  if (/\b(or|either|versus)\b/i.test(text) && text.length < 400) s += 1;
  if (text.split(/[.;]/).length > 4) s += 1;
  return Math.min(5, s);
}

export function scoreConfidence(type: FragmentType, text: string): number {
  let c = 3;
  if (type === FragmentType.DIALOGUE_SNIPPET && /^\s*["“”]/.test(text)) c += 1;
  if (type === FragmentType.HISTORICAL_ANCHOR && TIME_HINT.test(text)) c += 1;
  if (type === FragmentType.ORAL_HISTORY && ORAL_MARKERS.test(text)) c += 1;
  if (type === FragmentType.STRUCTURAL_OUTLINE && OUTLINE_MARKERS.test(text)) c += 1;
  if (text.length < 80) c -= 1;
  return Math.min(5, Math.max(1, c));
}

function stripForPreview(s: string, max = 220): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function normalizeFragmentText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function classifyFragmentType(text: string): FragmentType {
  const t = text.trim();
  if (!t.length) return FragmentType.OTHER;
  const lower = t.toLowerCase();

  if (OUTLINE_MARKERS.test(t) || /^[A-Z][A-Za-z\s]{0,40}:?\s*$/.test(t) && t.length < 80) {
    if (/\bchapter\b/i.test(t)) return FragmentType.CHAPTER_SEED;
    if (/\bscene\b/i.test(t)) return FragmentType.SCENE_SEED;
    return FragmentType.STRUCTURAL_OUTLINE;
  }

  if (/^\s*["“”']/.test(t) || /["“”']\s*$/.test(t)) {
    return FragmentType.DIALOGUE_SNIPPET;
  }

  if (ORAL_MARKERS.test(t)) return FragmentType.ORAL_HISTORY;
  if (/\b(i remember|we remember|childhood memory|back when)\b/i.test(t)) return FragmentType.MEMORY;

  if (QUESTIONISH.test(t) && t.length < 500 && (t.match(/\?/g)?.length ?? 0) <= 3) {
    return FragmentType.QUESTION_SEED;
  }

  if (TIME_HINT.test(t) && /\b(land|treaty|parish|record|war|born|died|signed)\b/i.test(t)) {
    return FragmentType.HISTORICAL_ANCHOR;
  }

  if (/\b(must not|must|continuity|cannot contradict|timeline|retcon)\b/i.test(t)) {
    return FragmentType.CONTINUITY_CONSTRAINT;
  }

  if (/\b(theme|motif|means|represents|stands for)\b/i.test(lower) && t.length < 400) {
    return FragmentType.THEME_STATEMENT;
  }

  if (/\b(smoke|water|fire|river|blood|root|bread|stone)\b/i.test(t) && EMOTION_WORDS.test(t)) {
    return FragmentType.SYMBOLIC_NOTE;
  }

  if (EMOTION_WORDS.test(t) && t.length < 600) return FragmentType.EMOTIONAL_BEAT;
  if (SENSORY_WORDS.test(t) && t.length < 500) return FragmentType.IMAGE_OR_SENSORY;

  if (/\b(she|he|they|character|voice|pov)\b/i.test(lower) && t.length < 400) {
    return FragmentType.CHARACTER_INSIGHT;
  }

  if (/\b(i|we)\s+(speak|narrate|tell you|confess)\b/i.test(lower)) {
    return FragmentType.NARRATOR_VOICE;
  }

  if (/\b(research|source|citation|archive|footnote)\b/i.test(lower)) {
    return FragmentType.RESEARCH_NOTE;
  }

  if (/\b(motif|rule|pattern|repeat)\b/i.test(lower)) return FragmentType.MOTIF_RULE;

  if (t.length > 120 && /[.!?]/.test(t) && !/\n/.test(t)) {
    return FragmentType.SCENE_SEED;
  }

  return FragmentType.CREATIVE_FRAGMENT;
}

function splitIntoParagraphs(text: string): string[] {
  const n = normalizeFragmentText(text);
  return n
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitLongParagraph(p: string, maxLen = 900): string[] {
  if (p.length <= maxLen) return [p];
  const sentences = p.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return [p];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length + 1 > maxLen && buf.length > 0) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = buf.length ? `${buf} ${s}` : s;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [p];
}

export function splitTextIntoCandidateFragments(text: string): CandidateFragmentUnit[] {
  const raw = normalizeFragmentText(text);
  if (!raw.length) return [];

  const paragraphs = splitIntoParagraphs(raw);
  const units: CandidateFragmentUnit[] = [];

  for (const para of paragraphs) {
    const chunks = splitLongParagraph(para);
    for (const chunk of chunks) {
      const suggestedType = classifyFragmentType(chunk);
      const ambiguityLevel = scoreAmbiguity(chunk);
      const confidence = scoreConfidence(suggestedType, chunk);
      units.push({
        text: chunk,
        suggestedType,
        excerpt: stripForPreview(chunk),
        confidence,
        ambiguityLevel,
      });
    }
  }

  return units;
}

export function buildFragmentSummary(text: string): string {
  const t = normalizeFragmentText(text);
  if (!t.length) return "";
  const first = t.split(/(?<=[.!?])\s+/)[0]?.trim() ?? t;
  return stripForPreview(first, 180);
}

export type InsightDraft = {
  insightType: string;
  content: string;
  confidence: number | null;
  notes: string | null;
};

export function deriveFragmentInsights(text: string): InsightDraft[] {
  const t = normalizeFragmentText(text);
  if (!t.length) return [];
  const insights: InsightDraft[] = [];
  const lower = t.toLowerCase();

  if (/\b(theme|motif|means)\b/i.test(t)) {
    insights.push({
      insightType: "theme",
      content: `Possible thematic thread: ${stripForPreview(t, 400)}`,
      confidence: 2,
      notes: "Heuristic; confirm in review.",
    });
  }
  if (/\b(tension|conflict|but|however|yet)\b/i.test(lower)) {
    insights.push({
      insightType: "tension",
      content: "Text suggests friction between ideas or accounts.",
      confidence: 2,
      notes: null,
    });
  }
  if (/\b(smoke|water|fire|blood|stone|road)\b/i.test(t)) {
    insights.push({
      insightType: "symbol",
      content: "Concrete images may carry symbolic weight.",
      confidence: 2,
      notes: null,
    });
  }
  if (/\b(voice|i speak|we tell|narrator)\b/i.test(lower)) {
    insights.push({
      insightType: "voice",
      content: "Watch stance and address — who is speaking to whom?",
      confidence: 2,
      notes: null,
    });
  }
  if (/\b(because|therefore|pattern|again|repeat)\b/i.test(lower)) {
    insights.push({
      insightType: "hidden-pattern",
      content: "Causal or repeated structure may be worth tracking.",
      confidence: 2,
      notes: null,
    });
  }

  return insights.slice(0, 4);
}

function matchHint(text: string, name: string): boolean {
  if (!name.trim()) return false;
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}\\b`, "i").test(text);
}

export function suggestFragmentPlacements(
  fragmentType: FragmentType,
  text: string,
  hints?: EntityHints,
): PlacementSuggestionInput[] {
  const n = normalizeFragmentText(text);
  const out: PlacementSuggestionInput[] = [];

  const push = (p: PlacementSuggestionInput) => {
    if (!out.some((x) => x.targetType === p.targetType && x.targetId === p.targetId)) {
      out.push(p);
    }
  };

  if (fragmentType === FragmentType.CHAPTER_SEED || fragmentType === FragmentType.STRUCTURAL_OUTLINE) {
    push({
      targetType: "chapter",
      rationale: "Outline-shaped fragment may seed or anchor a chapter.",
      confidence: 2,
    });
  }
  if (fragmentType === FragmentType.SCENE_SEED || fragmentType === FragmentType.DIALOGUE_SNIPPET) {
    push({
      targetType: "scene",
      rationale: "Scene- or dialogue-shaped fragment may sit in a scene.",
      confidence: 3,
    });
  }
  if (fragmentType === FragmentType.QUESTION_SEED) {
    push({
      targetType: "question",
      rationale: "Question-shaped fragment may become an open question.",
      confidence: 3,
    });
  }
  if (fragmentType === FragmentType.CONTINUITY_CONSTRAINT) {
    push({
      targetType: "continuity",
      rationale: "Constraint language may map to continuity notes.",
      confidence: 3,
    });
  }
  if (fragmentType === FragmentType.SYMBOLIC_NOTE || fragmentType === FragmentType.MOTIF_RULE) {
    push({
      targetType: "symbol",
      rationale: "Symbolic or motif language may tie to symbols.",
      confidence: 2,
    });
  }
  if (fragmentType === FragmentType.NARRATOR_VOICE) {
    push({
      targetType: "scene",
      rationale: "Narrator voice lines may ground or inspire scene drafting.",
      confidence: 2,
    });
  }

  if (hints?.chapterTitles) {
    for (const ch of hints.chapterTitles) {
      if (matchHint(n, ch.title)) {
        push({
          targetType: "chapter",
          targetId: ch.id,
          targetLabel: ch.title,
          rationale: "Title overlap with fragment text.",
          confidence: 4,
        });
      }
    }
  }
  if (hints?.sceneLabels) {
    for (const sc of hints.sceneLabels) {
      if (matchHint(n, sc.label)) {
        push({
          targetType: "scene",
          targetId: sc.id,
          targetLabel: sc.chapterTitle ? `${sc.chapterTitle} — ${sc.label}` : sc.label,
          rationale: "Label overlap with fragment text.",
          confidence: 3,
        });
      }
    }
  }
  if (hints?.symbolNames) {
    for (const sym of hints.symbolNames) {
      if (matchHint(n, sym.name)) {
        push({
          targetType: "symbol",
          targetId: sym.id,
          targetLabel: sym.name,
          rationale: "Symbol name appears in fragment.",
          confidence: 4,
        });
      }
    }
  }
  if (hints?.personNames) {
    for (const p of hints.personNames) {
      if (matchHint(n, p.name)) {
        push({
          targetType: "person",
          targetId: p.id,
          targetLabel: p.name,
          rationale: "Person name appears in fragment.",
          confidence: 4,
        });
      }
    }
  }
  if (hints?.placeNames) {
    for (const pl of hints.placeNames) {
      if (matchHint(n, pl.name)) {
        push({
          targetType: "place",
          targetId: pl.id,
          targetLabel: pl.name,
          rationale: "Place name appears in fragment.",
          confidence: 4,
        });
      }
    }
  }
  if (hints?.openQuestionTitles) {
    for (const q of hints.openQuestionTitles) {
      if (matchHint(n, q.title.slice(0, 80))) {
        push({
          targetType: "question",
          targetId: q.id,
          targetLabel: q.title,
          rationale: "Similar phrasing to an open question.",
          confidence: 2,
        });
      }
    }
  }

  return out.slice(0, 12);
}

export function isValidLinkRole(role: string): role is FragmentLinkRole {
  return (FRAGMENT_LINK_ROLES as readonly string[]).includes(role);
}
