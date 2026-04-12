"use server";

import {
  buildCensusResearchStoryAssemblyContextBlock,
  searchCensusResearchForStoryAssembly,
} from "@/lib/census-research-story-assembly";
import type { CensusStoryAssemblyHit } from "@/lib/census-research-story-assembly";

/** Search structured census rows (normalized + raw) for tooling / scene assembly. */
export async function censusResearchSearchForAssemblyAction(
  query: string,
  take?: number,
): Promise<CensusStoryAssemblyHit[]> {
  return searchCensusResearchForStoryAssembly(query, take ?? 24);
}

/** Deterministic prompt block: dataset summary + sample entries + OCR snippets. */
export async function censusResearchStoryContextBlockAction(options?: {
  maxEntries?: number;
  maxPageSnippets?: number;
  ocrSnippetChars?: number;
}): Promise<string> {
  return buildCensusResearchStoryAssemblyContextBlock(options);
}
