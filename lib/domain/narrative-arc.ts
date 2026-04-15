import type { NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

export const NARRATIVE_ARC_CONTRACT_VERSION = "1" as const;

export const ARC_TYPES = [
  "marriage_fracture",
  "forbidden_courtship",
  "inheritance_struggle",
  "family_survival",
  "spiritual_crisis",
  "revenge_justice",
  "reconciliation_attempt",
  "political_survival",
  "displacement",
  "succession",
] as const;

export const ARC_SCOPES = [
  "character",
  "dyadic",
  "family_household",
  "local_social",
  "book_spine",
] as const;

export const ARC_LIFECYCLE_STATES = [
  "dormant",
  "seeded",
  "active",
  "escalating",
  "crisis",
  "turning",
  "resolving",
  "resolved",
  "failed",
  "transformed",
] as const;

export const ARC_RESOLUTION_MODES = [
  "reconciliation",
  "separation",
  "sacrifice",
  "justice_enforced",
  "survival_compromise",
  "succession_settlement",
  "spiritual_reorientation",
] as const;

export type ArcType = (typeof ARC_TYPES)[number];
export type ArcScope = (typeof ARC_SCOPES)[number];
export type ArcLifecycleState = (typeof ARC_LIFECYCLE_STATES)[number];
export type ArcResolutionMode = (typeof ARC_RESOLUTION_MODES)[number];

export type NarrativeArcAnchorEntity = {
  anchorKind: "character" | "relationship" | "family" | "household" | "faction" | "book";
  anchorId: string;
};

export type NarrativeArcActivationConditions = {
  minObservedEvents: number;
  minStructuralScore: number;
};

export type NarrativeArcProgressionConditions = {
  minProgressionScore: number;
  minTensionForEscalation: number;
  escalationThreshold: number;
  crisisThreshold: number;
  turningThreshold: number;
};

export type NarrativeArcStallConditions = {
  stallPressureThreshold: number;
};

export type NarrativeArcFailureConditions = {
  failurePressureThreshold: number;
};

export type NarrativeArcResolutionConditions = {
  minResolutionScore: number;
  transformThreshold: number;
};

export type NarrativeArcConditionSet = {
  activation: NarrativeArcActivationConditions;
  progression: NarrativeArcProgressionConditions;
  stall: NarrativeArcStallConditions;
  failure: NarrativeArcFailureConditions;
  resolution: NarrativeArcResolutionConditions;
};

export type NarrativeArcEvidenceSnapshot = {
  observedEvents: number;
  activeConsequences: number;
  relationshipShift: number;
  memoryActivationPressure: number;
  temporalPressure: number;
  worldStatePressure: number;
  storylineMomentum: number;
};

export type NarrativeArcExplanationSummary = {
  summaryCode: string;
  reasonCodes: string[];
  structuralLegitimacySources: number;
  structuralScore: number;
  escalationPressure: number;
  resolutionPressure: number;
  stallPressure: number;
  failurePressure: number;
  sourcePlane: NarrativeMemoryPlane;
  targetPlane: NarrativeMemoryPlane;
};

export type NarrativeArcState = {
  contractVersion: typeof NARRATIVE_ARC_CONTRACT_VERSION;
  arcId: string;
  arcType: ArcType;
  arcScope: ArcScope;
  anchorEntities: NarrativeArcAnchorEntity[];
  lifecycleState: ArcLifecycleState;
  tensionLevel: number;
  intensityLevel: number;
  activationConditions: NarrativeArcActivationConditions;
  progressionConditions: NarrativeArcProgressionConditions;
  stallConditions: NarrativeArcStallConditions;
  failureConditions: NarrativeArcFailureConditions;
  resolutionModes: ArcResolutionMode[];
  resolutionConditions: NarrativeArcResolutionConditions;
  lastUpdateAtIso: string;
  lastExplanation: NarrativeArcExplanationSummary;
};

export type NarrativeArcUpdateSignals = {
  progressed: boolean;
  stalled: boolean;
  failed: boolean;
  resolved: boolean;
  transformed: boolean;
};

export type NarrativeArcUpdateResult = {
  updatedArc: NarrativeArcState;
  tensionDelta: number;
  intensityDelta: number;
  signals: NarrativeArcUpdateSignals;
  explanation: NarrativeArcExplanationSummary;
};
