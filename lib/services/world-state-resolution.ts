import type { Book, Chapter, Epic, NarrativeBeat, Scene } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type WorldStatePick = {
  epicDefaultId: string | null;
  bookDefaultId: string | null;
  chapterOverrideId: string | null;
  sceneOverrideId: string | null;
  beatOverrideId: string | null;
};

/**
 * Inheritance: Beat → Scene → Chapter → Book → Epic.
 * First non-null wins.
 */
export function resolveEffectiveWorldStateId(pick: WorldStatePick): string | null {
  return (
    pick.beatOverrideId ??
    pick.sceneOverrideId ??
    pick.chapterOverrideId ??
    pick.bookDefaultId ??
    pick.epicDefaultId ??
    null
  );
}

export function worldStatePickFromHierarchy(
  epic: Pick<Epic, "defaultWorldStateId"> | null,
  book: Pick<Book, "defaultWorldStateId"> | null,
  chapter: Pick<Chapter, "worldStateOverrideId"> | null,
  scene: Pick<Scene, "worldStateOverrideId"> | null,
  beat?: Pick<NarrativeBeat, "worldStateOverrideId"> | null
): WorldStatePick {
  return {
    epicDefaultId: epic?.defaultWorldStateId ?? null,
    bookDefaultId: book?.defaultWorldStateId ?? null,
    chapterOverrideId: chapter?.worldStateOverrideId ?? null,
    sceneOverrideId: scene?.worldStateOverrideId ?? null,
    beatOverrideId: beat?.worldStateOverrideId ?? null,
  };
}

/** Scene-level effective era slice (beat omitted; pass beat-specific resolver when generating a single beat). */
export async function resolveEffectiveWorldStateForScene(sceneId: string): Promise<{
  worldStateId: string | null;
  pick: WorldStatePick;
}> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: { include: { book: { include: { epic: true } } } },
    },
  });
  const pick = worldStatePickFromHierarchy(
    scene.chapter.book.epic,
    scene.chapter.book,
    scene.chapter,
    scene,
    null
  );
  return {
    worldStateId: resolveEffectiveWorldStateId(pick),
    pick,
  };
}
