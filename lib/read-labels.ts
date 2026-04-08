/** Shared reader-facing labels — safe for client components (no server-only imports). */

export function placeTypeReaderLabel(placeType: string): string {
  return placeType.replaceAll("_", " ");
}
