/** Query helpers for imported Louisiana colony census OCR (`CensusResearch*` tables). */
import { prisma } from "./prisma";

export const CAMPTI_CENSUS_DATASET_ID = "campti-census-sqlite-v1";

export async function getCamptiCensusDatasetSummary() {
  return prisma.censusResearchDataset.findUnique({
    where: { id: CAMPTI_CENSUS_DATASET_ID },
    include: {
      _count: {
        select: { pages: true, entries: true, nameRows: true, missingPages: true },
      },
    },
  });
}
