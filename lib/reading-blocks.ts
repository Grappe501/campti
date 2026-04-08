/** Split public reading text into paragraph blocks (same rules as SceneReader). */
export function splitReadingBlocks(text: string): string[] {
  return text.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
}
