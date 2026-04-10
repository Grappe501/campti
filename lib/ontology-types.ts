import type {
  ConfidenceProfile,
  NarrativePermissionProfile,
  OntologyFamily,
  OntologyType,
  RegistryFamily,
  RegistryValue,
  SceneReadinessProfile,
} from "@prisma/client";

export type OntologyTypeRecord = OntologyType;
export type RegistryValueRecord = RegistryValue;
export type NarrativePermissionProfileRecord = NarrativePermissionProfile;
export type ConfidenceProfileRecord = ConfidenceProfile;
export type SceneReadinessProfileRecord = SceneReadinessProfile;

export type OntologyAdminFilters = {
  family?: OntologyFamily;
};

export type RegistryValueAdminFilters = {
  family?: RegistryFamily;
  registryType?: string;
};
