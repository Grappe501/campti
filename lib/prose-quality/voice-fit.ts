import { normalizeWords } from "@/lib/prose-quality/sentence-split";
import type {
  AnalyzeProseContext,
  ProseIssue,
  VoiceFitMetrics,
} from "@/lib/prose-quality/types";

function profileTerms(
  fields: Record<string, string | null | undefined>
): string[] {
  const raw = Object.values(fields)
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join(" ");
  const words = normalizeWords(raw);
  const uniq = [...new Set(words.filter((w) => w.length >= 3))];
  return uniq.slice(0, 120);
}

export function analyzeVoiceFit(
  textLower: string,
  ctx: AnalyzeProseContext
): VoiceFitMetrics {
  const issues: ProseIssue[] = [];

  const nv = ctx.narrativeVoiceProfile;
  const cv = ctx.characterVoiceProfile;

  let narrativeProfileTermsMatched = 0;
  let narrativeProfileTermsTotal = 0;
  let characterProfileTermsMatched = 0;
  let characterProfileTermsTotal = 0;

  if (nv) {
    const terms = profileTerms({
      sentenceRhythm: nv.sentenceRhythm,
      dictionStyle: nv.dictionStyle,
      sensoryBias: nv.sensoryBias,
      silenceStyle: nv.silenceStyle,
      memoryStyle: nv.memoryStyle,
      interiorityStyle: nv.interiorityStyle,
      notes: nv.notes,
    });
    narrativeProfileTermsTotal = terms.length;
    for (const t of terms) {
      if (textLower.includes(t)) narrativeProfileTermsMatched += 1;
    }
    if (terms.length >= 8 && narrativeProfileTermsMatched / terms.length < 0.04) {
      issues.push({
        code: "voice.narrative_sparse",
        severity: "info",
        message:
          "Few lexical echoes from the narrative voice profile—intentional distance, or profile not reflected in diction yet.",
      });
    }
  }

  if (cv) {
    const terms = profileTerms({
      dictionLevel: cv.dictionLevel,
      rhythmStyle: cv.rhythmStyle,
      metaphorStyle: cv.metaphorStyle,
      dialectNotes: cv.dialectNotes,
      silencePatterns: cv.silencePatterns,
      emotionalExpressionStyle: cv.emotionalExpressionStyle,
      notes: cv.notes,
    });
    characterProfileTermsTotal = terms.length;
    for (const t of terms) {
      if (textLower.includes(t)) characterProfileTermsMatched += 1;
    }
    if (terms.length >= 8 && characterProfileTermsMatched / terms.length < 0.04) {
      issues.push({
        code: "voice.character_sparse",
        severity: "info",
        message:
          "Character voice profile terms rarely appear on-page—check POV depth, dialect notes, or update the profile to match drafted diction.",
      });
    }
  }

  return {
    narrativeProfileTermsMatched,
    narrativeProfileTermsTotal,
    characterProfileTermsMatched,
    characterProfileTermsTotal,
    issues,
  };
}
