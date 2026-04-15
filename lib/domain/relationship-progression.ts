import type {
  DyadicRelationshipAxes,
  DyadicRelationshipDirection,
  DyadicRelationshipEventType,
  DyadicRelationshipPosture,
  DyadicRelationshipState,
  DyadicRelationshipType,
} from "@/lib/domain/dyadic-relationship";

export const RELATIONSHIP_PROGRESSION_CONTRACT_VERSION = "1" as const;

export type RelationshipProgressionChannel = "canonical_dyad" | "reader_bond_dyad";

export type RelationshipProgressionEventRecord = {
  eventType: DyadicRelationshipEventType;
  intensity: 1 | 2 | 3;
  direction: DyadicRelationshipDirection;
  occurredAtIso: string;
};

export type RelationshipProgressionTrend = "warming" | "cooling" | "unstable" | "flat";
export type RelationshipRuptureRisk = "low" | "elevated" | "high";
export type RelationshipDisclosureLikelihoodShift = "decreasing" | "steady" | "increasing";
export type RelationshipAttachmentPressure = "low" | "moderate" | "high";
export type RelationshipReconciliationAvailability = "open" | "guarded" | "closed";

export type RelationshipProgressionSignals = {
  trend: RelationshipProgressionTrend;
  ruptureRisk: RelationshipRuptureRisk;
  disclosureLikelihoodShift: RelationshipDisclosureLikelihoodShift;
  attachmentPressure: RelationshipAttachmentPressure;
  reconciliationAvailability: RelationshipReconciliationAvailability;
};

export type RelationshipProgressionSnapshot = {
  contractVersion: typeof RELATIONSHIP_PROGRESSION_CONTRACT_VERSION;
  channel: RelationshipProgressionChannel;
  relationshipId: string;
  participantAId: string;
  participantBId: string;
  relationshipType: DyadicRelationshipType;
  axes: DyadicRelationshipAxes;
  posture: DyadicRelationshipPosture | null;
  eventCount: number;
  lastEvent: RelationshipProgressionEventRecord | null;
  signals: RelationshipProgressionSignals;
  updatedAtIso: string;
};

export type RelationshipProgressionEnvelope = {
  contractVersion: typeof RELATIONSHIP_PROGRESSION_CONTRACT_VERSION;
  snapshot: RelationshipProgressionSnapshot;
  recentEvents: RelationshipProgressionEventRecord[];
};

export type RelationshipProgressionExplanation = {
  channel: RelationshipProgressionChannel;
  priorAxes: DyadicRelationshipAxes;
  nextAxes: DyadicRelationshipAxes;
  axisDelta: Partial<Record<keyof DyadicRelationshipAxes, number>>;
  priorPosture: DyadicRelationshipPosture | null;
  nextPosture: DyadicRelationshipPosture;
  postureReasonCodes: string[];
  signalTransition: {
    prior: RelationshipProgressionSignals;
    next: RelationshipProgressionSignals;
  };
};

export function defaultRelationshipProgressionSignals(): RelationshipProgressionSignals {
  return {
    trend: "flat",
    ruptureRisk: "elevated",
    disclosureLikelihoodShift: "steady",
    attachmentPressure: "moderate",
    reconciliationAvailability: "guarded",
  };
}

export function defaultRelationshipProgressionSnapshot(input: {
  channel: RelationshipProgressionChannel;
  relationshipId: string;
  participantAId: string;
  participantBId: string;
  relationshipType: DyadicRelationshipType;
  state: DyadicRelationshipState;
}): RelationshipProgressionSnapshot {
  return {
    contractVersion: RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
    channel: input.channel,
    relationshipId: input.relationshipId,
    participantAId: input.participantAId,
    participantBId: input.participantBId,
    relationshipType: input.relationshipType,
    axes: input.state.axes,
    posture: input.state.posture,
    eventCount: 0,
    lastEvent: null,
    signals: defaultRelationshipProgressionSignals(),
    updatedAtIso: input.state.updatedAtIso,
  };
}
