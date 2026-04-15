/**
 * Phase 2 / Chunk 1 — Core dyadic relationship domain model.
 *
 * Bounded, structural-only state. No prose fields.
 */

export const DYADIC_RELATIONSHIP_AXIS_MIN = 0;
export const DYADIC_RELATIONSHIP_AXIS_MAX = 100;
export const DYADIC_RELATIONSHIP_AXIS_DEFAULT = 50;

export const DYADIC_RELATIONSHIP_TYPES = [
  "spouse",
  "promised_courtship",
  "parent_child",
  "siblings",
  "elder_younger",
  "ally",
  "rival",
  "authority_subject",
  "reader_bond",
] as const;

export const DYADIC_RELATIONSHIP_ORIGINS = [
  "seeded_canonical",
  "observed_interaction",
  "operator_annotation",
  "system_inference",
] as const;

export const DYADIC_RELATIONSHIP_EVENT_TYPES = [
  "comfort",
  "neglect",
  "betrayal",
  "protection",
  "humiliation",
  "sacrifice",
  "secrecy",
  "confession",
  "violence",
  "support",
  "public_disapproval",
  "duty_fulfilled",
  "duty_broken",
] as const;

export const DYADIC_RELATIONSHIP_LIFECYCLE_STATES = ["active", "inactive"] as const;

export const DYADIC_RELATIONSHIP_POSTURES = [
  "bonded",
  "strained",
  "unstable",
  "dutiful_but_cold",
  "fearful_attachment",
  "grieving_attachment",
  "broken_but_unresolved",
] as const;

export type DyadicRelationshipType = (typeof DYADIC_RELATIONSHIP_TYPES)[number];
export type DyadicRelationshipOrigin = (typeof DYADIC_RELATIONSHIP_ORIGINS)[number];
export type DyadicRelationshipEventType = (typeof DYADIC_RELATIONSHIP_EVENT_TYPES)[number];
export type DyadicRelationshipLifecycleState = (typeof DYADIC_RELATIONSHIP_LIFECYCLE_STATES)[number];
export type DyadicRelationshipPosture = (typeof DYADIC_RELATIONSHIP_POSTURES)[number];

export type DyadicRelationshipDirection =
  | "symmetric"
  | "participant_a_to_b"
  | "participant_b_to_a";

export type RelationshipBoundaryPlane =
  | "canonical_truth"
  | "character_bounded_knowledge"
  | "reader_interaction_memory"
  | "author_inspection_notes"
  | "interaction_summary"
  | "product_account_truth";

export type DyadicRelationshipAxes = {
  trust: number;
  affection: number;
  fear: number;
  duty: number;
  resentment: number;
  dependence: number;
  admiration: number;
  shameExposure: number;
  socialRisk: number;
  stability: number;
};

export type DyadicRelationshipContextAnchor = {
  worldStateId: string | null;
  sceneId: string | null;
};

export type DyadicRelationshipIdentity = {
  relationshipId: string;
  participantAId: string;
  participantBId: string;
};

export type DyadicRelationshipState = DyadicRelationshipIdentity & {
  relationshipType: DyadicRelationshipType;
  origin: DyadicRelationshipOrigin;
  lifecycleState: DyadicRelationshipLifecycleState;
  contextAnchor: DyadicRelationshipContextAnchor;
  axes: DyadicRelationshipAxes;
  posture: DyadicRelationshipPosture | null;
  updatedAtIso: string;
};

export type DyadicRelationshipEventInput = {
  eventType: DyadicRelationshipEventType;
  intensity?: 1 | 2 | 3;
  direction?: DyadicRelationshipDirection;
  occurredAtIso?: string;
  sourcePlane?: RelationshipBoundaryPlane;
  targetPlane?: RelationshipBoundaryPlane;
};

export function defaultDyadicRelationshipAxes(): DyadicRelationshipAxes {
  return {
    trust: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    affection: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    fear: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    duty: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    resentment: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    dependence: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    admiration: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    shameExposure: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    socialRisk: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
    stability: DYADIC_RELATIONSHIP_AXIS_DEFAULT,
  };
}

export function clampRelationshipAxis(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) return DYADIC_RELATIONSHIP_AXIS_DEFAULT;
  if (rounded < DYADIC_RELATIONSHIP_AXIS_MIN) return DYADIC_RELATIONSHIP_AXIS_MIN;
  if (rounded > DYADIC_RELATIONSHIP_AXIS_MAX) return DYADIC_RELATIONSHIP_AXIS_MAX;
  return rounded;
}

export function normalizeDyadicRelationshipAxes(input: DyadicRelationshipAxes): DyadicRelationshipAxes {
  return {
    trust: clampRelationshipAxis(input.trust),
    affection: clampRelationshipAxis(input.affection),
    fear: clampRelationshipAxis(input.fear),
    duty: clampRelationshipAxis(input.duty),
    resentment: clampRelationshipAxis(input.resentment),
    dependence: clampRelationshipAxis(input.dependence),
    admiration: clampRelationshipAxis(input.admiration),
    shameExposure: clampRelationshipAxis(input.shameExposure),
    socialRisk: clampRelationshipAxis(input.socialRisk),
    stability: clampRelationshipAxis(input.stability),
  };
}

export function normalizeDyadicParticipants(input: {
  participantAId: string;
  participantBId: string;
}): { participantAId: string; participantBId: string } {
  const a = input.participantAId.trim();
  const b = input.participantBId.trim();
  if (!a || !b) {
    throw new Error("[dyadic-relationship] participant ids are required.");
  }
  if (a === b) {
    throw new Error("[dyadic-relationship] participantAId and participantBId must be different.");
  }
  return a < b ? { participantAId: a, participantBId: b } : { participantAId: b, participantBId: a };
}
