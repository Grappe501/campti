/**
 * Shared world-state chronology backbone (P2-B / P2-C / P2-D).
 *
 * **Rule:** Raw `WorldStateReference.id` order is not a timeline. All enforcement uses
 * `WorldStateReference.chronologyIndex` only (see `lib/domain/world-state-chronology.ts` for pure helpers).
 */

import { worldStateFallsWithinChronologyWindow } from "@/lib/domain/world-state-chronology";
import { prisma } from "@/lib/prisma";

export type { WorldStateChronologyIndexById } from "@/lib/domain/world-state-chronology";

export { compareWorldStatesChronologicallyInMap, worldStateFallsWithinChronologyWindow } from "@/lib/domain/world-state-chronology";

/** Load chronology indices for the given world-state ids (unknown ids omitted from the map). */
export async function loadWorldStateChronologyIndexMap(ids: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(ids)].filter((id) => id.length > 0);
  if (unique.length === 0) {
    return new Map();
  }
  const rows = await prisma.worldStateReference.findMany({
    where: { id: { in: unique } },
    select: { id: true, chronologyIndex: true },
  });
  return new Map(rows.map((r) => [r.id, r.chronologyIndex]));
}

/** @returns null if the world state does not exist. */
export async function getWorldStateChronologyIndex(worldStateId: string): Promise<number | null> {
  const row = await prisma.worldStateReference.findUnique({
    where: { id: worldStateId },
    select: { chronologyIndex: true },
  });
  return row?.chronologyIndex ?? null;
}

/**
 * Compare two world states by DB chronology index (negative if a is earlier than b).
 * @throws If either id is unknown.
 */
export async function compareWorldStatesChronologically(aId: string, bId: string): Promise<number> {
  const [a, b] = await Promise.all([
    getWorldStateChronologyIndex(aId),
    getWorldStateChronologyIndex(bId),
  ]);
  if (a === null || b === null) {
    throw new Error(
      `compareWorldStatesChronologically: unknown world state id (a=${aId}, b=${bId}).`
    );
  }
  return a - b;
}

/**
 * Whether `targetId` falls within [startId, endId] in chronology space (inclusive; null bound = unbounded).
 * Loads indices from the database for all non-null ids.
 */
export async function worldStateFallsWithinWindow(
  targetId: string,
  startId: string | null,
  endId: string | null
): Promise<boolean> {
  const ids = [targetId, ...(startId != null ? [startId] : []), ...(endId != null ? [endId] : [])];
  const map = await loadWorldStateChronologyIndexMap(ids);
  return worldStateFallsWithinChronologyWindow(targetId, startId, endId, map);
}
