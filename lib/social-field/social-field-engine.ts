/**
 * Deterministic social-field scalars (no per-capita cognition).
 * Phase 5F.1 — proximity bands, gossip network hints, authority split, kin clusters.
 */

import type {
  EffectiveWitnessSet,
  PopulationKinCluster,
  SocialFieldDistanceBand,
} from "@/lib/domain/population-social-field";

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Map raw population count in slice to 0–1 density (saturating). */
export function densityFromCount(entityCount: number): number {
  return clamp01(Math.log1p(Math.max(0, entityCount)) / Math.log1p(5000));
}

function nSat(c: number): number {
  return clamp01(Math.log1p(Math.max(0, c)) / Math.log1p(120));
}

/**
 * Map band counts to a local witness pressure (before blending with world density).
 */
export function proximityPressureFromBands(input: {
  sameHouse: number;
  nearbyPlace: number;
  sameParish: number;
  regional: number;
}): number {
  return clamp01(
    0.42 * nSat(input.sameHouse) +
      0.28 * nSat(input.nearbyPlace) +
      0.18 * nSat(input.sameParish) +
      0.12 * nSat(input.regional)
  );
}

/**
 * Blend proximity witness pressure with global density + place boundedness (legacy-compatible).
 */
export function computeWitnessRiskV2(input: {
  proximityWitnessPressure: number;
  nearbyDensity: number;
  placeBounded: boolean;
}): number {
  const base = clamp01(
    0.52 * input.proximityWitnessPressure + 0.33 * input.nearbyDensity + (input.placeBounded ? 0.15 : 0.06)
  );
  return base;
}

/** @deprecated Prefer `computeWitnessRiskV2` + band counts. */
export function computeWitnessRisk(input: {
  nearbyDensity: number;
  placeBounded: boolean;
}): number {
  return computeWitnessRiskV2({
    proximityWitnessPressure: input.nearbyDensity,
    nearbyDensity: input.nearbyDensity,
    placeBounded: input.placeBounded,
  });
}

export function computeGossipPressure(input: {
  nearbyDensity: number;
  worldGossipPrior: number;
}): number {
  return clamp01(0.2 * input.worldGossipPrior + 0.65 * input.nearbyDensity);
}

/**
 * Network-influenced gossip scalar (feeds top-level `gossipPressure` for backward compat).
 */
export function computeGossipPressureV2(input: {
  nearbyDensity: number;
  worldGossipPrior: number;
  gossipSpreadFactor: number;
}): number {
  const base = computeGossipPressure({
    nearbyDensity: input.nearbyDensity,
    worldGossipPrior: input.worldGossipPrior,
  });
  return clamp01(0.72 * base + 0.28 * input.gossipSpreadFactor);
}

export function computeAuthorityPressure(input: {
  authorityPrior: number;
  parishAttention: number;
  militaryAttention: number;
}): number {
  return clamp01(
    0.45 * input.authorityPrior + 0.35 * input.parishAttention + 0.2 * input.militaryAttention
  );
}

export function computeAuthorityCompositeV2(input: {
  churchAuthorityPressure: number;
  militaryAuthorityPressure: number;
  civilAuthorityPressure: number;
  eliteClassPressure: number;
}): number {
  return clamp01(
    0.28 * input.churchAuthorityPressure +
      0.24 * input.militaryAuthorityPressure +
      0.26 * input.civilAuthorityPressure +
      0.22 * input.eliteClassPressure
  );
}

export function computeKinProximityPressure(input: {
  householdCoLocationCount: number;
  kinVisibilityWeight: number;
}): number {
  const h = clamp01(Math.log1p(input.householdCoLocationCount) / Math.log1p(12));
  return clamp01(0.55 * h + 0.45 * clamp01(input.kinVisibilityWeight / 100));
}

/**
 * Kin pressure from household size + cluster richness + mean kin visibility (Phase 5F.1).
 */
export function computeKinProximityPressureV2(input: {
  householdCoLocationCount: number;
  kinClusterCount: number;
  genealogicalEdgeCount: number;
  meanKinVisibilityWeight: number;
}): number {
  const h = clamp01(Math.log1p(input.householdCoLocationCount) / Math.log1p(12));
  const c = clamp01(Math.log1p(input.kinClusterCount) / Math.log1p(8));
  const g = clamp01(Math.log1p(input.genealogicalEdgeCount) / Math.log1p(6));
  const kv = clamp01(input.meanKinVisibilityWeight / 100);
  return clamp01(0.38 * h + 0.22 * c + 0.18 * g + 0.22 * kv);
}

export function computeTabooAmplification(input: {
  gossipPressure: number;
  authorityPressure: number;
  desireVisibilityRisk: number;
}): number {
  return clamp01(
    0.35 * input.gossipPressure +
      0.25 * input.authorityPressure +
      0.4 * clamp01(input.desireVisibilityRisk / 100)
  );
}

const BANDS: SocialFieldDistanceBand[] = [
  "same_house",
  "nearby_place",
  "same_parish",
  "regional",
  "distant",
];

const ZERO_BANDS: Record<SocialFieldDistanceBand, number> = {
  same_house: 0,
  nearby_place: 0,
  same_parish: 0,
  regional: 0,
  distant: 0,
};

/**
 * Deterministic witness classification from pre-sorted entity rows (single pass).
 */
export function computeEffectiveWitnessSet(input: {
  focalHouseholdId: string | null;
  focalPlaceId: string | null;
  parishPlaceId: string | null;
  entities: Array<{
    id: string;
    householdId: string | null;
    primaryLocationId: string | null;
  }>;
  sampleCap: number;
}): EffectiveWitnessSet {
  const byBand = { ...ZERO_BANDS };
  const sample: string[] = [];
  const parish = input.parishPlaceId ?? null;
  const place = input.focalPlaceId;

  let totalConsidered = 0;
  for (const e of input.entities) {
    totalConsidered++;
    let band: SocialFieldDistanceBand;
    if (input.focalHouseholdId && e.householdId === input.focalHouseholdId) {
      band = "same_house";
    } else if (place && e.primaryLocationId === place) {
      band = "nearby_place";
    } else if (parish && e.primaryLocationId === parish) {
      band = "same_parish";
    } else if (place || parish) {
      band = "regional";
    } else {
      band = "distant";
    }
    byBand[band]++;

    if (sample.length < input.sampleCap) {
      sample.push(e.id);
    }
  }

  return {
    byBand,
    witnessEntityIdsSample: sample,
    totalConsidered,
  };
}

export function computeVisibilityFalloff(input: {
  byBand: Record<SocialFieldDistanceBand, number>;
}): number {
  const { same_house, nearby_place, same_parish, regional, distant } = input.byBand;
  const local = same_house + nearby_place;
  const total = same_house + nearby_place + same_parish + regional + distant;
  if (total <= 0) return 0.5;
  const localShare = local / total;
  return clamp01(1 - localShare);
}

export function computeGossipSpreadFactor(input: {
  gossipSourceDensity: number;
  kinAcceleration01: number;
  authorityConsequence01: number;
}): number {
  return clamp01(
    0.48 * input.gossipSourceDensity +
      0.28 * input.kinAcceleration01 +
      0.24 * input.authorityConsequence01
  );
}

export function computeGossipReachEstimate(input: {
  gossipSpreadFactor: number;
  nearbyDensity: number;
  parishAttention: number;
}): number {
  return clamp01(0.45 * input.gossipSpreadFactor + 0.35 * input.nearbyDensity + 0.2 * input.parishAttention);
}

export function kinAccelerationFromClusters(clusters: PopulationKinCluster[]): number {
  if (!clusters.length) return 0;
  const members = clusters.reduce((acc, c) => acc + c.memberEntityIds.length, 0);
  return clamp01(0.55 * clamp01(Math.log1p(clusters.length) / Math.log1p(10)) + 0.45 * nSat(members));
}

export function sumBandCounts(b: Record<SocialFieldDistanceBand, number>): number {
  let t = 0;
  for (const k of BANDS) t += b[k] ?? 0;
  return t;
}
