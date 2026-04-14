/**
 * World state ↔ narrative book (spine) enforcement.
 *
 * **Rule:** No scene may exist outside a valid book timeline. Every resolved world state must fall under
 * exactly one `EpicBook` world-state window once the spine is world-state-calibrated; narrative `Book`
 * movement indices must align with that same spine row.
 *
 * World-state containment uses **canonical** `WorldStateReference.chronologyIndex` (see `lib/domain/epic-book.ts`
 * and `getBookForWorldState` in `epic-book-service.ts`). Raw id string order is not chronology.
 *
 * When no `EpicBook` row defines `startWorldStateId` or `endWorldStateId`, enforcement is inactive until
 * the spine is calibrated on that axis.
 */

export {
  listEpicBooksMatchingWorldState,
  type WorldStateChronologyIndexById,
} from "@/lib/domain/epic-book";

import { prisma } from "@/lib/prisma";
import { getBookForWorldState } from "@/lib/services/epic-book-service";

export { getBookForWorldState };
import { resolveEffectiveWorldStateForScene } from "@/lib/services/world-state-resolution";

/** True once at least one spine row defines a world-state window (enforcement can activate). */
export async function epicBookSpineHasWorldStateCalibration(): Promise<boolean> {
  const count = await prisma.epicBook.count({
    where: {
      OR: [{ startWorldStateId: { not: null } }, { endWorldStateId: { not: null } }],
    },
  });
  return count > 0;
}

/**
 * Ensures the scene’s resolved world state belongs to the same spine book as the narrative `Book`
 * (`movementIndex` ↔ `EpicBook.orderIndex`). No-op when the spine has no world-state calibration yet.
 *
 * @throws When calibrated and the world state does not map exactly to this narrative book’s spine row.
 */
export async function assertWorldStateMatchesBook(sceneId: string, bookId: string): Promise<void> {
  const calibrated = await epicBookSpineHasWorldStateCalibration();
  if (!calibrated) {
    return;
  }

  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: {
      chapter: {
        select: {
          book: { select: { id: true, movementIndex: true } },
        },
      },
    },
  });

  const narrativeBook = scene.chapter.book;
  if (narrativeBook.id !== bookId) {
    throw new Error(
      `Scene "${sceneId}" is under narrative book "${narrativeBook.id}", not "${bookId}".`
    );
  }

  const { worldStateId } = await resolveEffectiveWorldStateForScene(sceneId);
  if (!worldStateId) {
    throw new Error(
      `Scene "${sceneId}" has no resolved world state; cannot enforce book timeline. No scene may exist outside a valid book timeline.`
    );
  }

  const spineForWorld = await getBookForWorldState(worldStateId);
  if (spineForWorld == null) {
    throw new Error(
      `World state "${worldStateId}" does not fall within any EpicBook spine range, or the id is unknown.`
    );
  }

  const spineForNarrativeBook = await prisma.epicBook.findFirst({
    where: { orderIndex: narrativeBook.movementIndex },
  });
  if (!spineForNarrativeBook) {
    throw new Error(
      `No EpicBook spine row for narrative book movementIndex ${narrativeBook.movementIndex}. Add or align EpicBook.orderIndex with Book.movementIndex.`
    );
  }

  if (spineForWorld.id !== spineForNarrativeBook.id) {
    throw new Error(
      `World state "${worldStateId}" maps to EpicBook spine "${spineForWorld.title}" (${spineForWorld.id}), but this scene is under narrative Book movement ${narrativeBook.movementIndex} (spine "${spineForNarrativeBook.title}"). No scene may exist outside a valid book timeline.`
    );
  }
}
