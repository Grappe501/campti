/**
 * Phase 2 / Chunk 1 — deterministic dyadic relationship update primitives.
 *
 * Structural-only updates: no prose generation, no persistence side-effects.
 */
import {
  defaultDyadicRelationshipAxes,
  normalizeDyadicParticipants,
  normalizeDyadicRelationshipAxes,
  type DyadicRelationshipAxes,
  type DyadicRelationshipDirection,
  type DyadicRelationshipEventInput,
  type DyadicRelationshipPosture,
  type DyadicRelationshipState,
  type DyadicRelationshipType,
  type DyadicRelationshipOrigin,
} from "@/lib/domain/dyadic-relationship";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

type AxisDelta = Partial<Record<keyof DyadicRelationshipAxes, number>>;

type PostureReasonCode =
  | "high_trust_affection_stability"
  | "high_duty_low_affection"
  | "high_fear_dependence"
  | "high_resentment_low_stability"
  | "high_resentment_with_attachment"
  | "high_shame_or_social_risk"
  | "default_strained";

const EVENT_DELTAS: Record<DyadicRelationshipEventInput["eventType"], AxisDelta> = {
  comfort: { trust: 6, affection: 7, fear: -4, resentment: -3, stability: 3 },
  neglect: { trust: -5, affection: -4, resentment: 4, dependence: -2, stability: -4 },
  betrayal: { trust: -12, affection: -8, fear: 6, resentment: 12, stability: -10, socialRisk: 4 },
  protection: { trust: 7, affection: 5, fear: -5, admiration: 6, dependence: 2, stability: 4 },
  humiliation: { trust: -6, affection: -7, resentment: 8, shameExposure: 12, socialRisk: 9, stability: -7 },
  sacrifice: { trust: 10, affection: 8, admiration: 9, resentment: -5, stability: 5, duty: 3 },
  secrecy: { trust: -4, fear: 2, resentment: 3, socialRisk: 5, stability: -3, dependence: 2 },
  confession: { trust: 7, affection: 4, shameExposure: 6, stability: 2, resentment: -2 },
  violence: { trust: -11, affection: -9, fear: 13, resentment: 9, stability: -12, socialRisk: 5 },
  support: { trust: 6, affection: 5, admiration: 4, resentment: -3, stability: 4 },
  public_disapproval: { trust: -4, affection: -3, shameExposure: 8, socialRisk: 10, resentment: 5, stability: -5 },
  duty_fulfilled: { trust: 4, duty: 10, admiration: 3, resentment: -2, stability: 5 },
  duty_broken: { trust: -7, duty: -11, resentment: 8, socialRisk: 5, stability: -8 },
};

function resolveIntensity(input: 1 | 2 | 3 | undefined): 1 | 2 | 3 {
  return input ?? 2;
}

function directionMultiplier(axis: keyof DyadicRelationshipAxes, direction: DyadicRelationshipDirection): number {
  if (direction === "symmetric") return 1;
  if (axis === "trust" || axis === "affection" || axis === "dependence") return 0.8;
  if (axis === "fear" || axis === "shameExposure" || axis === "socialRisk") return 1.2;
  return 1;
}

function scaledAxisDelta(input: {
  base: AxisDelta;
  intensity: 1 | 2 | 3;
  direction: DyadicRelationshipDirection;
}): AxisDelta {
  const intensityScale = input.intensity / 2;
  const out: AxisDelta = {};
  for (const [key, delta] of Object.entries(input.base) as Array<[keyof DyadicRelationshipAxes, number]>) {
    out[key] = Math.round(delta * intensityScale * directionMultiplier(key, input.direction));
  }
  return out;
}

function applyDeltaAxes(current: DyadicRelationshipAxes, delta: AxisDelta): DyadicRelationshipAxes {
  return normalizeDyadicRelationshipAxes({
    trust: current.trust + (delta.trust ?? 0),
    affection: current.affection + (delta.affection ?? 0),
    fear: current.fear + (delta.fear ?? 0),
    duty: current.duty + (delta.duty ?? 0),
    resentment: current.resentment + (delta.resentment ?? 0),
    dependence: current.dependence + (delta.dependence ?? 0),
    admiration: current.admiration + (delta.admiration ?? 0),
    shameExposure: current.shameExposure + (delta.shameExposure ?? 0),
    socialRisk: current.socialRisk + (delta.socialRisk ?? 0),
    stability: current.stability + (delta.stability ?? 0),
  });
}

export function deriveDyadicRelationshipPosture(axes: DyadicRelationshipAxes): {
  posture: DyadicRelationshipPosture;
  reasonCodes: PostureReasonCode[];
} {
  if (axes.trust >= 70 && axes.affection >= 60 && axes.stability >= 60) {
    return {
      posture: "bonded",
      reasonCodes: ["high_trust_affection_stability"],
    };
  }
  if (axes.duty >= 65 && axes.affection <= 40 && axes.resentment >= 45) {
    return {
      posture: "dutiful_but_cold",
      reasonCodes: ["high_duty_low_affection"],
    };
  }
  if (axes.fear >= 65 && axes.dependence >= 55) {
    return {
      posture: "fearful_attachment",
      reasonCodes: ["high_fear_dependence"],
    };
  }
  if (axes.resentment >= 70 && axes.stability <= 35) {
    return {
      posture: "broken_but_unresolved",
      reasonCodes: ["high_resentment_low_stability"],
    };
  }
  if (axes.resentment >= 60 && (axes.affection >= 45 || axes.dependence >= 45)) {
    return {
      posture: "grieving_attachment",
      reasonCodes: ["high_resentment_with_attachment"],
    };
  }
  if (axes.shameExposure >= 65 || axes.socialRisk >= 65 || axes.stability <= 30) {
    return {
      posture: "unstable",
      reasonCodes: ["high_shame_or_social_risk"],
    };
  }
  return {
    posture: "strained",
    reasonCodes: ["default_strained"],
  };
}

export function createDyadicRelationshipState(input: {
  relationshipId: string;
  participantAId: string;
  participantBId: string;
  relationshipType: DyadicRelationshipType;
  origin: DyadicRelationshipOrigin;
  lifecycleState?: "active" | "inactive";
  worldStateId?: string | null;
  sceneId?: string | null;
  axes?: DyadicRelationshipAxes;
  updatedAtIso?: string;
}): DyadicRelationshipState {
  const normalizedParticipants = normalizeDyadicParticipants({
    participantAId: input.participantAId,
    participantBId: input.participantBId,
  });
  const axes = normalizeDyadicRelationshipAxes(input.axes ?? defaultDyadicRelationshipAxes());
  const posture = deriveDyadicRelationshipPosture(axes).posture;
  return {
    relationshipId: input.relationshipId.trim(),
    participantAId: normalizedParticipants.participantAId,
    participantBId: normalizedParticipants.participantBId,
    relationshipType: input.relationshipType,
    origin: input.origin,
    lifecycleState: input.lifecycleState ?? "active",
    contextAnchor: {
      worldStateId: input.worldStateId ?? null,
      sceneId: input.sceneId ?? null,
    },
    axes,
    posture,
    updatedAtIso: input.updatedAtIso ?? new Date().toISOString(),
  };
}

export type DyadicRelationshipUpdateExplanation = {
  eventType: DyadicRelationshipEventInput["eventType"];
  intensity: 1 | 2 | 3;
  direction: DyadicRelationshipDirection;
  axisDelta: AxisDelta;
  postureTransition: {
    from: DyadicRelationshipPosture | null;
    to: DyadicRelationshipPosture;
    reasonCodes: PostureReasonCode[];
  };
};

export type DyadicRelationshipUpdateResult = {
  state: DyadicRelationshipState;
  explanation: DyadicRelationshipUpdateExplanation;
};

export function applyDyadicRelationshipEvent(params: {
  prior: DyadicRelationshipState;
  event: DyadicRelationshipEventInput;
}): DyadicRelationshipUpdateResult {
  if (params.prior.lifecycleState !== "active") {
    throw new Error("[dyadic-relationship] Cannot update inactive relationship.");
  }
  if (params.event.sourcePlane && params.event.targetPlane) {
    assertMemoryBoundary({
      source: params.event.sourcePlane,
      target: params.event.targetPlane,
      payload: {
        relationshipId: params.prior.relationshipId,
        eventType: params.event.eventType,
      },
    });
  }

  const intensity = resolveIntensity(params.event.intensity);
  const direction = params.event.direction ?? "symmetric";
  const baseDelta = EVENT_DELTAS[params.event.eventType];
  const axisDelta = scaledAxisDelta({
    base: baseDelta,
    intensity,
    direction,
  });
  const axes = applyDeltaAxes(params.prior.axes, axisDelta);
  const posture = deriveDyadicRelationshipPosture(axes);
  const next: DyadicRelationshipState = {
    ...params.prior,
    axes,
    posture: posture.posture,
    updatedAtIso: params.event.occurredAtIso ?? new Date().toISOString(),
  };
  return {
    state: next,
    explanation: {
      eventType: params.event.eventType,
      intensity,
      direction,
      axisDelta,
      postureTransition: {
        from: params.prior.posture,
        to: posture.posture,
        reasonCodes: posture.reasonCodes,
      },
    },
  };
}
