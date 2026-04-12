/**
 * Cross-reference queries: Campti history atlas ↔ place ↔ census dataset pointers.
 */
import { prisma } from "./prisma";
import {
  CAMPTI_CENSUS_DATASET_ID,
  CAMPTI_HISTORY_ATLAS_SOURCE_ID,
  CAMPTI_SEED_PLACE_ID,
} from "./campti-history-atlas-constants";

export async function getCamptiHistoryAtlasSource() {
  return prisma.source.findUnique({
    where: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID },
    include: {
      sourceText: true,
      _count: { select: { sourceChunks: true } },
    },
  });
}

/** All events linked to the atlas source and/or Campti place (for admin / assembly). */
export async function getCamptiCrossReferenceEvents() {
  return prisma.event.findMany({
    where: {
      OR: [
        { sources: { some: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID } } },
        {
          AND: [
            { places: { some: { id: CAMPTI_SEED_PLACE_ID } } },
            {
              OR: [
                { id: { startsWith: "campti-atlas-ev-" } },
                { id: { startsWith: "timeline-ev-" } },
              ],
            },
          ],
        },
      ],
    },
    orderBy: [{ startYear: "asc" }, { title: "asc" }],
    include: {
      places: { select: { id: true, name: true } },
      sources: { select: { id: true, title: true } },
      chapters: { select: { id: true, title: true, chapterNumber: true } },
    },
  });
}

export async function getCamptiResearchCrossRefSummary() {
  const [atlas, census, events] = await Promise.all([
    prisma.source.findUnique({
      where: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID },
      select: { id: true, title: true, summary: true },
    }),
    prisma.censusResearchDataset.findUnique({
      where: { id: CAMPTI_CENSUS_DATASET_ID },
      select: {
        id: true,
        label: true,
        storyAssemblySummary: true,
        _count: {
          select: { pages: true, entries: true, nameRows: true, missingPages: true },
        },
      },
    }),
    prisma.event.count({
      where: { sources: { some: { id: CAMPTI_HISTORY_ATLAS_SOURCE_ID } } },
    }),
  ]);

  return { atlas, census, eventCount: events };
}
