/**
 * Cluster 8 — interpersonal simulation (dynamic bonds affecting behavior).
 */

export type RelationshipProfile = {
  relationshipId: string;
  participants: [string, string];
  bondType: string;
  dependencyMap: Record<string, number>;
  powerBalance: number;
  trustLevel: number;
  unspokenNeeds: string[];
  resentmentLines: string[];
  protectionInstinct: string;
  conflictHistory: string[];
  repairHistory: string[];
  breakRisk: number;
  repairDifficulty: number;
  silenceZones: string[];
};

export type RelationshipConflictMode =
  | "cold"
  | "volatile"
  | "passive"
  | "repair_seek"
  | "withdrawal";

export type RelationshipState = {
  relationshipId: string;
  currentTensionLevel: number;
  currentThreatLevel: number;
  currentDependencyPressure: number;
  currentConflictMode: RelationshipConflictMode;
  currentRepairStatus: "none" | "attempting" | "stalled" | "fragile_gain";
};
