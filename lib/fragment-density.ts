import type { Fragment } from "@prisma/client";
import { detectEmotionalPivots, detectMeaningShifts, detectSymbolicPivots } from "@/lib/fragment-refinement";

export type DensityFactors = {
  charLength: number;
  clauseEstimate: number;
  symbolHits: number;
  entityHints: number;
  emotionalShifts: number;
  meaningShifts: number;
  score: number;
};

const ENTITY_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;

function countClauses(text: string): number {
  const t = text.trim();
  if (!t.length) return 0;
  const split = t.split(/[,;:]|\s+—\s+|\s+–\s+/);
  return Math.max(1, split.filter((x) => x.trim().length > 0).length);
}

function countCapitalNameHints(text: string): number {
  const m = text.match(ENTITY_PATTERN);
  return m ? Math.min(8, m.length) : 0;
}

/**
 * Rule-based density score (higher = more packed / more pressure to split).
 */
export function calculateFragmentDensity(fragment: Pick<Fragment, "text" | "summary">): DensityFactors {
  const text = fragment.text ?? "";
  const charLength = text.length;
  const clauseEstimate = countClauses(text);
  const sym = detectSymbolicPivots(text);
  const emo = detectEmotionalPivots(text);
  const mean = detectMeaningShifts(text);
  const symbolHits = sym.length;
  const emotionalShifts = emo.length;
  const meaningShifts = mean.length;
  const entityHints = countCapitalNameHints(text);

  let score = 0;
  score += Math.min(4, Math.floor(charLength / 450));
  score += Math.min(3, Math.floor(clauseEstimate / 5));
  score += Math.min(3, symbolHits);
  score += Math.min(3, emotionalShifts);
  score += Math.min(2, meaningShifts);
  score += Math.min(2, entityHints);

  return {
    charLength,
    clauseEstimate,
    symbolHits,
    entityHints,
    emotionalShifts,
    meaningShifts,
    score,
  };
}

export function deriveDecompositionPressure(
  fragment: Pick<Fragment, "text" | "summary"> & { decompositionPressure?: string | null },
): "low" | "medium" | "high" {
  if (fragment.decompositionPressure === "low" || fragment.decompositionPressure === "medium" || fragment.decompositionPressure === "high") {
    return fragment.decompositionPressure;
  }
  const { score } = calculateFragmentDensity(fragment);
  if (score >= 10) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export function isFragmentTooDense(
  fragment: Pick<Fragment, "text" | "summary"> & { decompositionPressure?: string | null },
): boolean {
  return deriveDecompositionPressure(fragment) === "high";
}
