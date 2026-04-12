import type { NarrativeAssemblyStatus, NarrativeContinuityState } from "@prisma/client";

/** How to pick a single “final” string for export when multiple layers exist (policy, not DB column). */
export type TextResolutionMode =
  | "reader_first"
  | "author_working_first"
  | "generation_only";

export type StalenessStatus = NarrativeAssemblyStatus;
export type ContinuityStatus = NarrativeContinuityState;

export type SceneAssemblyInput = {
  sceneId: string;
  /** Typically from DB Scene row */
  generationText?: string | null;
  humanText?: string | null;
  publishedReaderText?: string | null;
  legacyDraftText?: string | null;
  mode?: TextResolutionMode;
};

export type ChapterAssemblyInput = {
  chapterId: string;
  /** Ordered scene bodies after per-scene resolution */
  sceneTextsInOrder: string[];
  /** Join scenes with double newline (default in service) */
  separator?: string;
};

/**
 * Policy for “final” scene text for assembly (not necessarily reader-published).
 * Default: human working beats generation; publishedReaderText still wins when mode is reader_first.
 */
export function resolveSceneFinalText(
  input: SceneAssemblyInput,
  mode: TextResolutionMode = "author_working_first"
): string {
  const pub = input.publishedReaderText?.trim();
  const auth = input.humanText?.trim();
  const gen = input.generationText?.trim();
  const legacy = input.legacyDraftText?.trim();

  if (mode === "reader_first") {
    return pub || auth || gen || legacy || "";
  }
  if (mode === "generation_only") {
    return gen || legacy || "";
  }
  return auth || gen || pub || legacy || "";
}
