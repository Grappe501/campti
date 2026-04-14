import { PopulationEntityRecordStatus } from "@prisma/client";

import { normalizePopulationName } from "@/lib/population/population-name-normalize";
import { prisma } from "@/lib/prisma";

export type PopulationIngestRow = {
  displayName: string;
  aliases?: string[];
  birthYear?: number | null;
  deathYear?: number | null;
  gender?: string | null;
  ethnicityOrBackground?: string | null;
  statusOrClass?: string | null;
  occupationOrRole?: string | null;
  householdKey?: string | null;
  primaryPlaceId?: string | null;
  worldStateReferenceId?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  sourceDataset?: string | null;
  sourceRecordId?: string | null;
  confidence?: number | null;
};

/**
 * Idempotent-ish ingest: match by normalized name + birth year + household when possible.
 */
export async function ingestPopulationRows(
  rows: PopulationIngestRow[],
  options?: {
    worldStateReferenceId?: string | null;
    defaultRecordStatus?: PopulationEntityRecordStatus;
  }
): Promise<{ created: number; updated: number; entityIds: string[] }> {
  let created = 0;
  let updated = 0;
  const entityIds: string[] = [];

  const defaultWs = options?.worldStateReferenceId ?? undefined;
  const status = options?.defaultRecordStatus ?? PopulationEntityRecordStatus.CENSUS_INGESTED;

  for (const r of rows) {
    const normalizedName = normalizePopulationName(r.displayName);
    const ws = r.worldStateReferenceId ?? defaultWs ?? null;

    const existing = await prisma.populationEntity.findFirst({
      where: {
        normalizedName,
        birthYear: r.birthYear ?? undefined,
        worldStateReferenceId: ws ?? undefined,
      },
    });

    if (existing) {
      await prisma.populationEntity.update({
        where: { id: existing.id },
        data: {
          displayName: r.displayName,
          deathYear: r.deathYear ?? undefined,
          gender: r.gender ?? undefined,
          occupationOrRole: r.occupationOrRole ?? undefined,
          confidence: r.confidence ?? undefined,
          sourceDataset: r.sourceDataset ?? undefined,
          sourceRecordId: r.sourceRecordId ?? undefined,
        },
      });
      updated++;
      entityIds.push(existing.id);
      continue;
    }

    let householdId: string | null = null;
    if (r.householdKey?.trim()) {
      const h = await prisma.populationHousehold.findFirst({
        where: { censusHouseholdKey: r.householdKey.trim() },
      });
      if (h) {
        householdId = h.id;
      } else {
        const nh = await prisma.populationHousehold.create({
          data: {
            label: r.householdKey.trim(),
            censusHouseholdKey: r.householdKey.trim(),
            worldStateReferenceId: ws ?? undefined,
            primaryPlaceId: r.primaryPlaceId ?? undefined,
          },
        });
        householdId = nh.id;
      }
    }

    const ent = await prisma.populationEntity.create({
      data: {
        displayName: r.displayName.trim(),
        normalizedName,
        birthYear: r.birthYear ?? undefined,
        deathYear: r.deathYear ?? undefined,
        gender: r.gender ?? undefined,
        ethnicityOrBackground: r.ethnicityOrBackground ?? undefined,
        statusOrClass: r.statusOrClass ?? undefined,
        occupationOrRole: r.occupationOrRole ?? undefined,
        householdId: householdId ?? undefined,
        primaryLocationId: r.primaryPlaceId ?? undefined,
        worldStateReferenceId: ws ?? undefined,
        recordStatus: status,
        confidence: r.confidence ?? 0.7,
        sourceDataset: r.sourceDataset ?? undefined,
        sourceRecordId: r.sourceRecordId ?? undefined,
        aliasesCompact: r.aliases?.length ? (r.aliases as unknown as object) : undefined,
      },
    });

    if (r.aliases?.length) {
      for (const a of r.aliases) {
        const na = normalizePopulationName(a);
        if (!na) continue;
        await prisma.populationEntityAlias.upsert({
          where: {
            populationEntityId_normalizedAlias: {
              populationEntityId: ent.id,
              normalizedAlias: na,
            },
          },
          create: {
            populationEntityId: ent.id,
            alias: a.trim(),
            normalizedAlias: na,
            source: r.sourceDataset ?? undefined,
          },
          update: {},
        });
      }
    }

    if (r.primaryPlaceId && (r.yearStart != null || r.yearEnd != null)) {
      await prisma.populationEntityPresence.create({
        data: {
          populationEntityId: ent.id,
          placeId: r.primaryPlaceId,
          yearStart: r.yearStart ?? undefined,
          yearEnd: r.yearEnd ?? undefined,
          confidence: r.confidence ?? 0.7,
        },
      });
    }

    created++;
    entityIds.push(ent.id);
  }

  return { created, updated, entityIds };
}
