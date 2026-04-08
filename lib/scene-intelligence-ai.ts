import type { Fragment } from "@prisma/client";
import type { ClusterProposal } from "@/lib/fragment-clustering";
import type { ConstructionSuggestionDraft } from "@/lib/scene-intelligence";

/**
 * Future: OpenAI-assisted enrichment of fragment meanings. Core flows must not depend on this.
 */
export async function runFragmentMeaningAssist(_fragment: Fragment): Promise<{ ok: true; note: string } | { ok: false; reason: string }> {
  return { ok: true, note: "Not implemented — rule-based interpretation runs without AI." };
}

export async function runFragmentClusterAssist(_proposals: ClusterProposal[]): Promise<{ ok: true; note: string } | { ok: false; reason: string }> {
  return { ok: true, note: `Stub: ${ _proposals.length } proposal(s) would be refined by AI in a later phase.` };
}

export async function runSceneConstructionAssist(_drafts: ConstructionSuggestionDraft[]): Promise<{ ok: true; note: string } | { ok: false; reason: string }> {
  return { ok: true, note: "Stub — construction drafts remain heuristic until AI assist is wired." };
}
