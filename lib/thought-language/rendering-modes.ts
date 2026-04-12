import type { TranslationRenderMode } from "@/lib/domain/thought-language";

/** Concrete rendering rules per mode (English surface; cognition-shaped). */
export type ModeRenderingRules = {
  syntaxInfluenceCap: number;
  retainedTermCap: number;
  metaphorCarryover: "minimal" | "moderate" | "strong";
  honorificPreservation: "optional" | "prefer" | "require";
  accentTextureDefault: "none" | "light" | "medium";
  notes: string;
};

export const TRANSLATION_RENDER_MODE_RULES: Record<TranslationRenderMode, ModeRenderingRules> = {
  TRANSPARENT_ENGLISH: {
    syntaxInfluenceCap: 0.15,
    retainedTermCap: 0.1,
    metaphorCarryover: "minimal",
    honorificPreservation: "optional",
    accentTextureDefault: "none",
    notes:
      "Standard literary English. Keep era-true worldview and moral categories in content, not orthography.",
  },
  MEDIATED_ENGLISH: {
    syntaxInfluenceCap: 0.45,
    retainedTermCap: 0.35,
    metaphorCarryover: "moderate",
    honorificPreservation: "prefer",
    accentTextureDefault: "light",
    notes:
      "English with calqued rhythm, occasional retained terms (glossed once), hierarchy in address, period metaphors.",
  },
  HIGH_TEXTURE_ENGLISH: {
    syntaxInfluenceCap: 0.7,
    retainedTermCap: 0.5,
    metaphorCarryover: "strong",
    honorificPreservation: "require",
    accentTextureDefault: "medium",
    notes:
      "Dense mediation: visible syntax pressure, retained lexicon where it carries meaning, no crude phonetic accent.",
  },
};

export function rulesForMode(mode: TranslationRenderMode): ModeRenderingRules {
  return TRANSLATION_RENDER_MODE_RULES[mode];
}
