import { Prisma } from "@prisma/client";

import type {
  PopulationKinCluster,
  PopulationKinEdge,
  SocialFieldContext,
  SocialFieldQuery,
} from "@/lib/domain/population-social-field";
import { prisma } from "@/lib/prisma";
import * as Sf from "@/lib/social-field/social-field-engine";
import {
  buildGenealogicalKinCluster,
  buildHouseholdKinCluster,
  buildSurnameInferenceCluster,
  loadGenealogicalKinEdgesForPerson,
} from "@/lib/social-field/population-kin-projection";

function worldDesireGossipPrior(worldDesireJson: unknown): number {
  if (!worldDesireJson || typeof worldDesireJson !== "object") return 0.5;
  const o = worldDesireJson as Record<string, unknown>;
  const v = o.visibilityRiskForDesire;
  return typeof v === "number" && Number.isFinite(v) ? Sf.clamp01(v / 100) : 0.5;
}

const CIVIL_OCCUPATION_FRAGMENTS = [
  "judge",
  "marshal",
  "sheriff",
  "clerk",
  "mayor",
  "notary",
  "tax",
  "justice",
  "court",
  "official",
];

const ELITE_STATUS_FRAGMENTS = ["planter", "merchant", "elite", "gentleman", "lady", "owner"];

function orContainsFragments(field: keyof Prisma.PopulationEntityWhereInput, fragments: string[]): Prisma.PopulationEntityWhereInput[] {
  return fragments.map((f) => ({
    [field]: { contains: f, mode: Prisma.QueryMode.insensitive },
  })) as Prisma.PopulationEntityWhereInput[];
}

/**
 * Build structured social field for a scene + focal people (Phase 5F.1).
 */
export async function buildSocialFieldContextFromQuery(q: SocialFieldQuery): Promise<SocialFieldContext> {
  const wsWhere = q.worldStateId ? { worldStateReferenceId: q.worldStateId } : {};
  const parishPlaceId = q.parishPlaceId ?? null;
  const witnessSampleCap = q.witnessSampleCap ?? 8000;

  const focalPersonId = q.focalPersonIds[0] ?? null;

  const [entitiesInWorldSlice, entitiesAtPlace, focalPop, householdLabelRow] = await Promise.all([
    prisma.populationEntity.count({ where: { ...wsWhere } }),
    q.placeId
      ? prisma.populationEntity.count({
          where: { ...wsWhere, primaryLocationId: q.placeId },
        })
      : Promise.resolve(0),
    focalPersonId
      ? prisma.populationEntity.findFirst({
          where: { personId: focalPersonId },
          select: {
            id: true,
            displayName: true,
            householdId: true,
            primaryLocationId: true,
            kinVisibilityWeight: true,
            gossipWeight: true,
          },
        })
      : Promise.resolve(null),
    q.householdId
      ? prisma.populationHousehold.findUnique({
          where: { id: q.householdId },
          select: { label: true },
        })
      : Promise.resolve(null),
  ]);

  const focalHouseholdId = q.householdId ?? focalPop?.householdId ?? null;

  const [entitiesInFocalHousehold, entitiesNearbyPlaceExcludingHousehold, entitiesAtParish] =
    await Promise.all([
      focalHouseholdId
        ? prisma.populationEntity.count({ where: { ...wsWhere, householdId: focalHouseholdId } })
        : Promise.resolve(0),
      q.placeId
        ? prisma.populationEntity.count({
            where: {
              ...wsWhere,
              primaryLocationId: q.placeId,
              ...(focalHouseholdId
                ? {
                    OR: [{ householdId: null }, { householdId: { not: focalHouseholdId } }],
                  }
                : {}),
            },
          })
        : Promise.resolve(0),
      parishPlaceId
        ? prisma.populationEntity.count({
            where: { ...wsWhere, primaryLocationId: parishPlaceId },
          })
        : Promise.resolve(0),
    ]);

  const nearbyPopulationDensity = Sf.densityFromCount(entitiesInWorldSlice);

  const worldRow = q.worldStateId
    ? await prisma.worldStateReference.findUnique({
        where: { id: q.worldStateId },
        select: { desireEnvironmentJson: true },
      })
    : null;

  const gossipPrior = worldDesireGossipPrior(worldRow?.desireEnvironmentJson);

  const parishAttention = Sf.clamp01(0.35 + 0.02 * Math.min(entitiesAtPlace, 80));
  const militaryAttention = Sf.clamp01(0.12 + 0.015 * Math.min(entitiesInWorldSlice, 200));
  const churchAttention = Sf.clamp01(0.28 + 0.02 * parishAttention);

  const sameParishExclusive =
    parishPlaceId && q.placeId && parishPlaceId !== q.placeId
      ? Math.max(0, entitiesAtParish - entitiesAtPlace)
      : 0;

  const regional = parishPlaceId
    ? Math.max(0, entitiesInWorldSlice - entitiesAtParish)
    : Math.max(0, entitiesInWorldSlice - entitiesAtPlace);

  const distant = 0;

  const byBand = {
    same_house: entitiesInFocalHousehold,
    nearby_place: entitiesNearbyPlaceExcludingHousehold,
    same_parish: sameParishExclusive,
    regional,
    distant,
  };

  const proximityWitnessPressure = Sf.proximityPressureFromBands({
    sameHouse: byBand.same_house,
    nearbyPlace: byBand.nearby_place,
    sameParish: byBand.same_parish,
    regional: byBand.regional,
  });

  const witnessRisk = Sf.computeWitnessRiskV2({
    proximityWitnessPressure,
    nearbyDensity: nearbyPopulationDensity,
    placeBounded: Boolean(q.placeId),
  });

  const witnessEntityIdsSample = await prisma.populationEntity.findMany({
    where: { ...wsWhere },
    select: { id: true },
    take: Math.min(witnessSampleCap, 48),
    orderBy: { id: "asc" },
  });

  const effectiveWitnessSet = {
    byBand,
    witnessEntityIdsSample: witnessEntityIdsSample.map((r) => r.id),
    totalConsidered: entitiesInWorldSlice,
  };

  const visibilityFalloff01 = Sf.computeVisibilityFalloff({ byBand });

  const placeGossip = q.placeId
    ? await prisma.populationEntity.aggregate({
        where: { ...wsWhere, primaryLocationId: q.placeId },
        _sum: { gossipWeight: true },
        _avg: { gossipWeight: true }, // not used
        _count: true,
      })
    : null;

  const gossipSum = placeGossip?._sum.gossipWeight ?? 0;
  const gossipCount = placeGossip?._count ?? 0;
  const gossipSourceDensity = Sf.clamp01(gossipSum / (100 * Math.max(1, gossipCount)));

  const civilWhere: Prisma.PopulationEntityWhereInput = {
    ...wsWhere,
    ...(q.placeId ? { primaryLocationId: q.placeId } : {}),
    OR: orContainsFragments("occupationOrRole", CIVIL_OCCUPATION_FRAGMENTS),
  };
  const eliteWhere: Prisma.PopulationEntityWhereInput = {
    ...wsWhere,
    ...(q.placeId ? { primaryLocationId: q.placeId } : {}),
    OR: [
      ...orContainsFragments("statusOrClass", ELITE_STATUS_FRAGMENTS),
      { authorityWeight: { gte: 78 } },
    ],
  };

  const [civilAuthorityCount, eliteAuthorityAgg] = await Promise.all([
    prisma.populationEntity.count({ where: civilWhere }),
    prisma.populationEntity.aggregate({
      where: eliteWhere,
      _avg: { authorityWeight: true },
      _count: true,
    }),
  ]);

  const civilAuthorityPressure = Sf.clamp01(civilAuthorityCount / 28);
  const eliteClassPressure = Sf.clamp01(
    (eliteAuthorityAgg._avg.authorityWeight ?? 50) / 100 + Math.min(0.15, eliteAuthorityAgg._count / 120)
  );

  const churchAuthorityPressure = churchAttention;
  const militaryAuthorityPressure = militaryAttention;

  const authorityComposite = Sf.computeAuthorityCompositeV2({
    churchAuthorityPressure,
    militaryAuthorityPressure,
    civilAuthorityPressure,
    eliteClassPressure,
  });

  const authorityConsequence01 = authorityComposite;

  const clusters: PopulationKinCluster[] = [];

  const hhCluster = await buildHouseholdKinCluster(
    focalHouseholdId,
    householdLabelRow?.label ?? null
  );
  if (hhCluster) clusters.push(hhCluster);

  let kinEdges: PopulationKinEdge[] = [];
  if (focalPersonId) {
    kinEdges = await loadGenealogicalKinEdgesForPerson(focalPersonId, focalPop?.id ?? null);
    const gCluster = buildGenealogicalKinCluster(focalPop?.id ?? null, focalPersonId, kinEdges);
    if (gCluster) clusters.push(gCluster);
  }

  if (focalPop?.displayName) {
    const sCluster = await buildSurnameInferenceCluster({
      worldStateReferenceId: q.worldStateId ?? null,
      primaryLocationId: focalPop.primaryLocationId ?? q.placeId ?? null,
      focalDisplayName: focalPop.displayName,
    });
    if (sCluster) clusters.push(sCluster);
  }

  const kinAcceleration01 = Sf.kinAccelerationFromClusters(clusters);

  const gossipSpreadFactor = Sf.computeGossipSpreadFactor({
    gossipSourceDensity,
    kinAcceleration01,
    authorityConsequence01,
  });

  const gossipReachEstimate = Sf.computeGossipReachEstimate({
    gossipSpreadFactor,
    nearbyDensity: nearbyPopulationDensity,
    parishAttention,
  });

  const gossipPressure = Sf.computeGossipPressureV2({
    nearbyDensity: nearbyPopulationDensity,
    worldGossipPrior: gossipPrior,
    gossipSpreadFactor,
  });

  const kinProximityPressure = Sf.computeKinProximityPressureV2({
    householdCoLocationCount: entitiesInFocalHousehold,
    kinClusterCount: clusters.length,
    genealogicalEdgeCount: kinEdges.filter((e) =>
      ["genealogical_parent", "genealogical_spouse"].includes(e.kind)
    ).length,
    meanKinVisibilityWeight: focalPop?.kinVisibilityWeight ?? 55,
  });

  const householdVisibility = Sf.clamp01(
    focalHouseholdId ? Math.log1p(entitiesInFocalHousehold) / Math.log1p(20) : 0.25
  );

  const tabooAmplification = Sf.computeTabooAmplification({
    gossipPressure,
    authorityPressure: authorityComposite,
    desireVisibilityRisk: 60,
  });

  return {
    contractVersion: "2",
    storyYear: q.storyYear,
    worldStateId: q.worldStateId,
    placeId: q.placeId,
    parishPlaceId,
    nearbyPopulationDensity,
    witnessRisk,
    gossipPressure,
    authorityPressure: authorityComposite,
    kinProximityPressure,
    householdVisibility,
    tabooAmplification,
    parishAttention,
    militaryAttention,
    churchAttention,
    socialBreakdown: {
      witness: {
        effectiveWitnessSet,
        proximityWitnessPressure,
        visibilityFalloff01,
      },
      gossip: {
        gossipSpreadFactor,
        gossipSourceDensity,
        gossipReachEstimate,
        kinAcceleration01,
        authorityConsequence01,
      },
      authority: {
        churchAuthorityPressure,
        militaryAuthorityPressure,
        civilAuthorityPressure,
        eliteClassPressure,
        compositeAuthorityPressure: authorityComposite,
      },
      kin: {
        clusters,
        inferredEdges: kinEdges,
        focalKinVisibilityWeight: focalPop?.kinVisibilityWeight ?? 55,
      },
    },
    counts: {
      entitiesInWorldSlice,
      entitiesAtPlace,
      entitiesInFocalHousehold,
      entitiesNearbyPlaceExcludingHousehold,
      entitiesAtParish,
    },
  };
}
