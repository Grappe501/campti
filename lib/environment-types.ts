import type {
  EnvironmentNode,
  NodeConnection,
  Place,
  PlaceEnvironmentProfile,
  PlaceMemoryProfile,
  PlaceState,
  RiskRegime,
  SettingProfile,
  SettingState,
  WorldStateReference,
} from "@prisma/client";

export type PlaceEnvironmentProfileRecord = PlaceEnvironmentProfile;
export type PlaceStateRecord = PlaceState;
export type EnvironmentNodeRecord = EnvironmentNode;
export type NodeConnectionRecord = NodeConnection;
export type RiskRegimeRecord = RiskRegime;
export type PlaceMemoryProfileRecord = PlaceMemoryProfile;
export type WorldStateReferenceRecord = WorldStateReference;

/** Admin / engine bundle: canonical place plus layered simulation rows (+ prose setting profile for same page). */
export type PlaceFullEnvironmentBundle = {
  place: Place & {
    settingProfile: SettingProfile | null;
    settingStates: SettingState[];
    environmentProfile: PlaceEnvironmentProfile | null;
    placeStates: (PlaceState & { worldState: WorldStateReference | null })[];
    environmentNodes: EnvironmentNode[];
    placeMemoryProfiles: (PlaceMemoryProfile & { worldState: WorldStateReference | null })[];
  };
  environmentProfile: PlaceEnvironmentProfile | null;
  placeStates: (PlaceState & { worldState: WorldStateReference | null })[];
  nodes: EnvironmentNode[];
  memoryProfiles: (PlaceMemoryProfile & { worldState: WorldStateReference | null })[];
  connections: NodeConnection[];
};

export type EnvironmentAdminFilters = {
  visibility?: import("@prisma/client").VisibilityStatus;
  recordType?: import("@prisma/client").RecordType;
  search?: string;
};

export type EnvironmentNodeAdminFilters = EnvironmentAdminFilters & {
  nodeType?: string;
  regionLabel?: string;
  coreOnly?: boolean;
};

export type NodeConnectionAdminFilters = EnvironmentAdminFilters & {
  connectionType?: import("@prisma/client").NodeConnectionType;
  worldStateId?: string;
};
