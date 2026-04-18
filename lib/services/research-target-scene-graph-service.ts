import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Resolves `AuthorResearchTarget` rows linked to a scene graph (scene, chapter, people, places in JSON arrays).
 * Uses bounded SQL over JSON arrays — no table scan of unrelated targets by id list from an unbounded global query.
 */
export async function findResearchTargetIdsLinkedToSceneContext(args: {
  sceneId: string;
  chapterId: string;
  personIds: string[];
  placeIds: string[];
}): Promise<string[]> {
  const { sceneId, chapterId, personIds, placeIds } = args;

  const parts: Prisma.Sql[] = [
    Prisma.sql`
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedSceneIds"::jsonb, '[]'::jsonb)) AS sc(v)
        WHERE v = ${sceneId}
      )
    `,
    Prisma.sql`
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedChapterIds"::jsonb, '[]'::jsonb)) AS ch(v)
        WHERE v = ${chapterId}
      )
    `,
  ];

  if (personIds.length > 0) {
    parts.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedPersonIds"::jsonb, '[]'::jsonb)) AS pe(v)
        WHERE v IN (${Prisma.join(personIds)})
      )
    `);
  }

  if (placeIds.length > 0) {
    parts.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedPlaceIds"::jsonb, '[]'::jsonb)) AS pl(v)
        WHERE v IN (${Prisma.join(placeIds)})
      )
    `);
  }

  const whereOr = Prisma.join(parts, " OR ");

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT t.id::text AS id
    FROM "AuthorResearchTarget" t
    WHERE (${whereOr})
  `);

  return rows.map((r) => r.id);
}

export async function findResearchTargetIdsLinkedToChapterId(chapterId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT t.id::text AS id
    FROM "AuthorResearchTarget" t
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedChapterIds"::jsonb, '[]'::jsonb)) AS ch(v)
      WHERE ch.v = ${chapterId}
    )
  `);
  return rows.map((r) => r.id);
}

export async function findResearchTargetIdsLinkedToPersonId(personId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT t.id::text AS id
    FROM "AuthorResearchTarget" t
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedPersonIds"::jsonb, '[]'::jsonb)) AS pe(v)
      WHERE pe.v = ${personId}
    )
  `);
  return rows.map((r) => r.id);
}

export async function findResearchTargetIdsLinkedToPlaceId(placeId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT t.id::text AS id
    FROM "AuthorResearchTarget" t
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(t."linkedPlaceIds"::jsonb, '[]'::jsonb)) AS pl(v)
      WHERE pl.v = ${placeId}
    )
  `);
  return rows.map((r) => r.id);
}

function intersectSortedIds(sets: string[][]): string[] {
  if (sets.length === 0) return [];
  const sorted = sets.map((s) => [...new Set(s)].sort());
  let acc = sorted[0]!;
  for (let i = 1; i < sorted.length; i++) {
    const b = new Set(sorted[i]);
    acc = acc.filter((id) => b.has(id));
  }
  return acc;
}

export type ResearchWorkbenchRouteNarrowing = {
  sceneId?: string;
  chapterId?: string;
  personId?: string;
  placeId?: string;
};

/**
 * AND-intersection of all provided dimensions (empty => no narrowing).
 */
export async function resolveNarrowResearchTargetIds(filters: ResearchWorkbenchRouteNarrowing): Promise<string[] | null> {
  const sets: string[][] = [];
  if (filters.sceneId?.trim()) {
    const scene = await prisma.scene.findUnique({
      where: { id: filters.sceneId },
      select: { id: true, chapterId: true, persons: { select: { id: true } }, places: { select: { id: true } } },
    });
    if (!scene) sets.push([]);
    else {
      sets.push(
        await findResearchTargetIdsLinkedToSceneContext({
          sceneId: scene.id,
          chapterId: scene.chapterId,
          personIds: scene.persons.map((p) => p.id),
          placeIds: scene.places.map((p) => p.id),
        }),
      );
    }
  }
  if (filters.chapterId?.trim() && !filters.sceneId?.trim()) {
    sets.push(await findResearchTargetIdsLinkedToChapterId(filters.chapterId));
  }
  if (filters.personId?.trim()) {
    sets.push(await findResearchTargetIdsLinkedToPersonId(filters.personId));
  }
  if (filters.placeId?.trim()) {
    sets.push(await findResearchTargetIdsLinkedToPlaceId(filters.placeId));
  }
  if (sets.length === 0) return null;
  return intersectSortedIds(sets);
}
