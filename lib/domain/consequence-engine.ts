import type { DyadicRelationshipEventType } from "@/lib/domain/dyadic-relationship";

export const CONSEQUENCE_ENGINE_CONTRACT_VERSION = "1" as const;

export const CONSEQUENCE_CATEGORIES = [
  "relational",
  "emotional",
  "reputational",
  "material",
  "bodily",
  "social",
  "political",
  "spiritual",
  "legal_customary",
  "household_economic",
] as const;

export const CONSEQUENCE_LIFECYCLE_STATES = [
  "active",
  "latent",
  "decaying",
  "resolved",
  "transformed",
] as const;

export const CONSEQUENCE_SEVERITIES = ["low", "moderate", "high"] as const;
export const CONSEQUENCE_VISIBILITIES = [
  "private_dyadic",
  "scene_public",
  "household_public",
  "community_public",
] as const;
export const CONSEQUENCE_IMMEDIACIES = ["immediate", "delayed"] as const;
export const CONSEQUENCE_DURATIONS = ["short", "medium", "long", "indefinite"] as const;
export const CONSEQUENCE_REVERSIBILITIES = [
  "reversible",
  "partially_reversible",
  "irreversible",
] as const;

export type ConsequenceCategory = (typeof CONSEQUENCE_CATEGORIES)[number];
export type ConsequenceLifecycleState = (typeof CONSEQUENCE_LIFECYCLE_STATES)[number];
export type ConsequenceSeverity = (typeof CONSEQUENCE_SEVERITIES)[number];
export type ConsequenceVisibility = (typeof CONSEQUENCE_VISIBILITIES)[number];
export type ConsequenceImmediacy = (typeof CONSEQUENCE_IMMEDIACIES)[number];
export type ConsequenceDuration = (typeof CONSEQUENCE_DURATIONS)[number];
export type ConsequenceReversibility = (typeof CONSEQUENCE_REVERSIBILITIES)[number];

export type ConsequenceEngineChannel = "canonical_dyad" | "reader_bond_dyad";

export type ConsequenceTriggerReference = {
  sourceKind: "relationship_event" | "interaction_event" | "scene_event";
  observedEventId: string;
  sourceEventType: DyadicRelationshipEventType;
  occurredAtIso: string;
  relationshipId?: string | null;
  sceneId?: string | null;
  sessionId?: string | null;
  turnId?: string | null;
  worldStateId?: string | null;
};

export type ConsequencePropagationTarget = {
  targetKind: "relationship_axes" | "social_risk_pressure" | "household_economic_pressure" | "linked_relationships";
  targetRef: string | null;
  modifier: number;
};

export type ConsequenceRecord = {
  consequenceId: string;
  channel: ConsequenceEngineChannel;
  trigger: ConsequenceTriggerReference;
  affectedEntityIds: string[];
  category: ConsequenceCategory;
  severity: ConsequenceSeverity;
  visibility: ConsequenceVisibility;
  immediacy: ConsequenceImmediacy;
  duration: ConsequenceDuration;
  lifecycleState: ConsequenceLifecycleState;
  reversibility: ConsequenceReversibility;
  propagationTargets: ConsequencePropagationTarget[];
  explanation: {
    ruleCode: string;
    reasonCodes: string[];
  };
  createdAtIso: string;
  updatedAtIso: string;
};

export type ConsequenceEngineState = {
  contractVersion: typeof CONSEQUENCE_ENGINE_CONTRACT_VERSION;
  channel: ConsequenceEngineChannel;
  records: ConsequenceRecord[];
  updatedAtIso: string;
};

export type ConsequencePressureModifier = {
  target: ConsequencePropagationTarget["targetKind"];
  totalModifier: number;
};

export type ConsequenceMemorySalienceModifier = {
  consequenceId: string;
  salienceWeight: number;
};

export type ConsequenceFutureConstraintSignal = {
  signalCode: "avoid_public_exposure" | "elevated_household_burden" | "trust_repair_needed" | "bodily_caution";
  severity: ConsequenceSeverity;
  sourceConsequenceId: string;
};

export type ConsequenceEngineOutputSurface = {
  activeConsequenceSummary: Array<{
    consequenceId: string;
    category: ConsequenceCategory;
    severity: ConsequenceSeverity;
    lifecycleState: ConsequenceLifecycleState;
    triggerEventType: DyadicRelationshipEventType;
  }>;
  relationshipPressureModifiers: ConsequencePressureModifier[];
  memorySalienceModifiers: ConsequenceMemorySalienceModifier[];
  futureConstraintSignals: ConsequenceFutureConstraintSignal[];
};
