import type { EntityHints } from "@/lib/fragment-decomposition";
import type { CandidateFragmentUnit } from "@/lib/fragment-decomposition";

export type FragmentAssistResult =
  | { ok: true; units: CandidateFragmentUnit[]; notes?: string }
  | { ok: false; reason: string };

/**
 * Optional AI-assisted deeper breakdown. Stub: wire to OpenAI or another model later.
 * Base decomposition must not depend on this.
 */
export async function runFragmentDecompositionAssist(
  text: string,
  hints?: EntityHints,
): Promise<FragmentAssistResult> {
  void text;
  void hints;
  return { ok: false, reason: "not_implemented" };
}

export type PlacementAssistResult =
  | { ok: true; suggestions: { targetType: string; rationale?: string }[] }
  | { ok: false; reason: string };

export async function runFragmentPlacementAssist(
  fragmentText: string,
  hints?: EntityHints,
): Promise<PlacementAssistResult> {
  void fragmentText;
  void hints;
  return { ok: false, reason: "not_implemented" };
}

export type InsightAssistResult =
  | { ok: true; insights: { insightType: string; content: string; confidence?: number }[] }
  | { ok: false; reason: string };

export async function runFragmentInsightAssist(fragmentText: string): Promise<InsightAssistResult> {
  void fragmentText;
  return { ok: false, reason: "not_implemented" };
}
