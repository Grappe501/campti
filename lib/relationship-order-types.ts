import type {
  CharacterDesireProfile,
  CharacterMaskingProfile,
  RelationshipDisclosureProfile,
  RelationshipDynamicState,
  RelationshipNetworkSummary,
  RelationshipProfile,
  WorldRelationshipNormProfile,
  WorldStateReference,
} from "@prisma/client";

export type RelationshipProfileAdminFilters = {
  visibility?: import("@prisma/client").VisibilityStatus;
  recordType?: import("@prisma/client").RecordType;
  worldStateId?: string;
  relationshipType?: import("@prisma/client").RelationshipType;
  search?: string;
};

/** Dyad rows for a character in one world (includes disclosure slice for that world). */
export type RelationshipProfileWithEnds = RelationshipProfile & {
  personA: { id: string; name: string };
  personB: { id: string; name: string };
  disclosureProfiles: RelationshipDisclosureProfile[];
};

/** Stage 6 — single-character × world slice for engines and admin. */
export type CharacterRelationshipBundle = {
  worldState: WorldStateReference;
  masking: CharacterMaskingProfile | null;
  desire: CharacterDesireProfile | null;
  networkSummary: RelationshipNetworkSummary | null;
  worldNorms: WorldRelationshipNormProfile | null;
  relationshipProfilesInvolvingPerson: RelationshipProfileWithEnds[];
};

export type {
  RelationshipProfile,
  RelationshipDynamicState,
  CharacterMaskingProfile,
  CharacterDesireProfile,
  WorldRelationshipNormProfile,
  RelationshipDisclosureProfile,
  RelationshipNetworkSummary,
};
