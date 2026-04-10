import {
  OntologyFamily,
  RecordType,
  RegistryFamily,
  VisibilityStatus,
} from "@prisma/client";

/** Default ontology / registry rows use hybrid story-system record typing until a row is promoted. */
export const ONTOLOGY_DEFAULT_RECORD_TYPE = RecordType.HYBRID;
export const ONTOLOGY_DEFAULT_VISIBILITY = VisibilityStatus.REVIEW;

export const ONTOLOGY_FAMILY_ORDER: OntologyFamily[] = [
  OntologyFamily.ENTITY,
  OntologyFamily.ENVIRONMENT,
  OntologyFamily.NARRATIVE,
  OntologyFamily.SIMULATION,
  OntologyFamily.RELATIONSHIP,
  OntologyFamily.SUPPORT,
];

export const REGISTRY_FAMILY_ORDER: RegistryFamily[] = [
  RegistryFamily.SYMBOLIC,
  RegistryFamily.RELATIONSHIP,
  RegistryFamily.ENVIRONMENT,
  RegistryFamily.PRESSURE,
  RegistryFamily.PERMISSION,
  RegistryFamily.READINESS,
  RegistryFamily.BRANCH,
  RegistryFamily.GENERAL,
];

/** Seed keys for OntologyType — stable references for config JSON and future FKs. */
export const SEED_ONTOLOGY_TYPE_KEYS = [
  "person",
  "collective",
  "place",
  "environment_zone",
  "event",
  "ritual",
  "object",
  "symbol",
  "motif",
  "theme",
  "source",
  "claim",
  "contradiction",
  "question",
  "chapter",
  "scene",
  "meta_scene",
  "fragment",
  "memory_unit",
  "pressure_source",
  "relationship",
  "anchor",
  "branch_condition",
  "variable_set",
] as const;
