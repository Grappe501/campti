import { inferBindingsFromFragments } from "@/lib/narrative-binding";

export type FragmentNarrativeSuggestion = Awaited<
  ReturnType<typeof inferBindingsFromFragments>
>[number];

/**
 * Suggested theme/symbol/rule links for a fragment (token overlap; not persisted).
 */
export async function getFragmentNarrativeDnaSuggestions(
  fragmentId: string,
): Promise<FragmentNarrativeSuggestion[]> {
  return inferBindingsFromFragments(fragmentId);
}
