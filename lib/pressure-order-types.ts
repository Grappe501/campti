import type {
  CharacterDemographicProfile,
  CharacterFamilyPressureProfile,
  CharacterGovernanceImpact,
  CharacterProfile,
  CharacterSocioEconomicProfile,
  CharacterState,
  Person,
  WorldGovernanceProfile,
  WorldPressureBundle,
  WorldStateEraProfile,
  WorldStateReference,
} from "@prisma/client";
import type { EffectivePressureWeights } from "@/lib/world-era-profile";

export type WorldGovernanceProfileRecord = WorldGovernanceProfile;
export type CharacterGovernanceImpactRecord = CharacterGovernanceImpact;
export type CharacterSocioEconomicProfileRecord = CharacterSocioEconomicProfile;
export type CharacterDemographicProfileRecord = CharacterDemographicProfile;
export type CharacterFamilyPressureProfileRecord = CharacterFamilyPressureProfile;
export type WorldPressureBundleRecord = WorldPressureBundle;

/** Filters for governance list admin. */
export type WorldGovernanceAdminFilters = {
  visibility?: import("@prisma/client").VisibilityStatus;
  recordType?: import("@prisma/client").RecordType;
  search?: string;
};

/**
 * Full pressure slice for a person in one world state — feed for scene / decision engines later.
 * Character core + world + four pressure layers + CharacterState row when present for this world.
 */
export type CharacterPressureBundle = {
  person: Person & { characterProfile: CharacterProfile | null };
  worldState: WorldStateReference;
  governanceImpact: CharacterGovernanceImpact | null;
  socioEconomic: CharacterSocioEconomicProfile | null;
  demographic: CharacterDemographicProfile | null;
  familyPressure: CharacterFamilyPressureProfile | null;
  characterState: CharacterState | null;
  /** Stage 5 bundle row when present; used with era knobs for effective weights. */
  worldPressureBundle: WorldPressureBundle | null;
  eraProfile: WorldStateEraProfile | null;
  /** Era-tilted weights; null when bundle or era profile missing. */
  effectivePressureWeights: EffectivePressureWeights | null;
};
