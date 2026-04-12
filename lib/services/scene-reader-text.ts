import type { Scene } from "@prisma/client";

/**
 * Reader-facing scene body: prefer human-approved, then working author copy, then model draft, then legacy `draftText`.
 */
export function resolveSceneReaderText(s: Pick<
  Scene,
  | "publishedReaderText"
  | "authoringText"
  | "generationText"
  | "draftText"
>): string {
  const pick =
    s.publishedReaderText?.trim() ||
    s.authoringText?.trim() ||
    s.generationText?.trim() ||
    s.draftText?.trim() ||
    "";
  return pick;
}
