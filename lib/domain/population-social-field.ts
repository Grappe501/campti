/**
 * Phase 5F — Population substrate & social field (lightweight; no full cognition per capita).
 * Phase 5F.1 — Structured social reality (witness bands, gossip network hints, authority split, kin clusters).
 */

export type PopulationEntityRole = string;

export type PopulationEntityStatus =
  | "unverified"
  | "census_ingested"
  | "linked_person"
  | "promoted_modeled"
  | "merged";

export type PopulationHousehold = {
  id: string;
  label: string;
  displayName: string | null;
  worldStateReferenceId: string | null;
  primaryPlaceId: string | null;
  censusHouseholdKey: string | null;
};

/** Time-bounded presence for queries (may mirror DB or projection). */
export type PopulationPresenceWindow = {
  yearStart: number | null;
  yearEnd: number | null;
  placeId: string | null;
  confidence: number | null;
};

export type PopulationLocationBinding = {
  placeId: string | null;
  label: string | null;
};

export type PopulationEntity = {
  id: string;
  displayName: string;
  aliases: string[];
  birthYear: number | null;
  deathYear: number | null;
  gender: string | null;
  ethnicityOrBackground: string | null;
  statusOrClass: string | null;
  occupationOrRole: string | null;
  householdId: string | null;
  primaryLocationId: string | null;
  worldStateReferenceId: string | null;
  personId: string | null;
  isModeledCharacter: boolean;
  isPromotable: boolean;
  authorityWeight: number;
  gossipWeight: number;
  kinVisibilityWeight: number;
  visibilityProfileJson: Record<string, unknown> | null;
  recordStatus: PopulationEntityStatus;
  notes: string | null;
};

/** Distance bands for witness / proximity (deterministic labels). */
export type SocialFieldDistanceBand =
  | "same_house"
  | "nearby_place"
  | "same_parish"
  | "regional"
  | "distant";

/** Lightweight kin edge (projected; not persisted). */
export type PopulationKinEdgeKind =
  | "household"
  | "surname_inference"
  | "genealogical_parent"
  | "genealogical_spouse";

export type PopulationKinEdge = {
  kind: PopulationKinEdgeKind;
  /** Population row ids when both ends exist in census substrate. */
  fromPopulationEntityId?: string | null;
  toPopulationEntityId?: string | null;
  toPersonId?: string | null;
  fromPersonId?: string | null;
  confidence: number;
};

export type PopulationKinClusterKind = "household" | "surname_inference" | "genealogical";

export type PopulationKinCluster = {
  id: string;
  kind: PopulationKinClusterKind;
  memberEntityIds: string[];
  label: string | null;
};

export type EffectiveWitnessSet = {
  /** Counts per band (population entities in scope). */
  byBand: Record<SocialFieldDistanceBand, number>;
  /** Deterministic sample of entity ids for audit (capped). */
  witnessEntityIdsSample: string[];
  /** Total rows used to compute bands (after cap). */
  totalConsidered: number;
};

export type SocialFieldWitnessBreakdown = {
  effectiveWitnessSet: EffectiveWitnessSet;
  /** Proximity-weighted witness pressure before global density blend (0–1). */
  proximityWitnessPressure: number;
  /** Higher = more “what happens here stays local” vs distant rumor (0–1). */
  visibilityFalloff01: number;
};

export type SocialFieldGossipBreakdown = {
  gossipSpreadFactor: number;
  gossipSourceDensity: number;
  gossipReachEstimate: number;
  /** Kin + authority amplifiers used in spread (0–1). */
  kinAcceleration01: number;
  authorityConsequence01: number;
};

export type SocialFieldAuthorityBreakdown = {
  churchAuthorityPressure: number;
  militaryAuthorityPressure: number;
  civilAuthorityPressure: number;
  eliteClassPressure: number;
  /** Same composite as top-level `authorityPressure` (backward compat). */
  compositeAuthorityPressure: number;
};

export type SocialFieldKinBreakdown = {
  clusters: PopulationKinCluster[];
  inferredEdges: PopulationKinEdge[];
  /** Focal entity aggregate kin visibility (0–100 scale in engine). */
  focalKinVisibilityWeight: number;
};

export type SocialFieldSocialBreakdown = {
  witness: SocialFieldWitnessBreakdown;
  gossip: SocialFieldGossipBreakdown;
  authority: SocialFieldAuthorityBreakdown;
  kin: SocialFieldKinBreakdown;
};

/** Deterministic pressures for prompts (0–1 scalars unless noted). */
export type SocialFieldContext = {
  contractVersion: "2";
  /** Story year used for window overlap heuristics. */
  storyYear: number | null;
  worldStateId: string | null;
  placeId: string | null;
  /** Optional parish / county seat for “same parish” banding. */
  parishPlaceId: string | null;
  nearbyPopulationDensity: number;
  witnessRisk: number;
  gossipPressure: number;
  authorityPressure: number;
  kinProximityPressure: number;
  householdVisibility: number;
  tabooAmplification: number;
  parishAttention: number;
  militaryAttention: number;
  churchAttention: number;
  /** Structured breakdown (Phase 5F.1). */
  socialBreakdown: SocialFieldSocialBreakdown;
  /** Raw counts for audit (not for reader prose). */
  counts: {
    entitiesInWorldSlice: number;
    entitiesAtPlace: number;
    entitiesInFocalHousehold: number;
    entitiesNearbyPlaceExcludingHousehold: number;
    entitiesAtParish: number;
  };
};

export type SocialFieldSignal =
  | "density"
  | "witness"
  | "gossip"
  | "authority"
  | "kin"
  | "household"
  | "taboo"
  | "parish"
  | "military"
  | "church";

export type SocialFieldQuery = {
  sceneId: string;
  worldStateId: string | null;
  storyYear: number | null;
  focalPersonIds: string[];
  placeId: string | null;
  householdId: string | null;
  /** Broader parish / county seat for regional banding (optional). */
  parishPlaceId?: string | null;
  /** Max population rows scanned for witness band sampling (default 8000). */
  witnessSampleCap?: number;
};

export type PopulationPromotionPlan = {
  populationEntityId: string;
  proposedPersonName: string;
  preserveAliases: boolean;
  linkExistingPersonId: string | null;
  createCharacterCore: boolean;
  notes: string | null;
};
