/**
 * Canonical world-state chronology (P2 backbone).
 *
 * Timeline position is carried only by `WorldStateReference.chronologyIndex` in the database (lower = earlier).
 * **Raw `WorldStateReference.id` string order must never be treated as chronology.**
 */

/** Resolved id → `WorldStateReference.chronologyIndex` for pure comparisons (no DB). */
export type WorldStateChronologyIndexById = ReadonlyMap<string, number>;

/**
 * Inclusive window in chronology-index space. Null `startId` / `endId` means unbounded on that side.
 * When both are null, returns true (fully unbounded window).
 */
export function worldStateFallsWithinChronologyWindow(
  targetId: string,
  startId: string | null,
  endId: string | null,
  chronologyIndexById: WorldStateChronologyIndexById
): boolean {
  if (startId == null && endId == null) {
    return true;
  }

  const t = chronologyIndexById.get(targetId);
  if (t === undefined) {
    return false;
  }

  if (startId != null) {
    const lo = chronologyIndexById.get(startId);
    if (lo === undefined || t < lo) {
      return false;
    }
  }
  if (endId != null) {
    const hi = chronologyIndexById.get(endId);
    if (hi === undefined || t > hi) {
      return false;
    }
  }
  return true;
}

/**
 * Compare two world states by resolved chronology indices. Throws if either id is missing from the map.
 */
export function compareWorldStatesChronologicallyInMap(
  aId: string,
  bId: string,
  chronologyIndexById: WorldStateChronologyIndexById
): number {
  const a = chronologyIndexById.get(aId);
  const b = chronologyIndexById.get(bId);
  if (a === undefined || b === undefined) {
    throw new Error("compareWorldStatesChronologicallyInMap: missing chronology index for world state id(s).");
  }
  return a - b;
}
