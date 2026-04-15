import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clampRelationshipAxis,
  defaultDyadicRelationshipAxes,
  normalizeDyadicParticipants,
  normalizeDyadicRelationshipAxes,
} from "@/lib/domain/dyadic-relationship";
import {
  applyDyadicRelationshipEvent,
  createDyadicRelationshipState,
  deriveDyadicRelationshipPosture,
} from "@/lib/services/dyadic-relationship-engine-service";

describe("dyadic relationship axis normalization", () => {
  it("clamps axes to bounded shared scale", () => {
    assert.equal(clampRelationshipAxis(-15), 0);
    assert.equal(clampRelationshipAxis(120), 100);
    assert.equal(clampRelationshipAxis(49.6), 50);
    assert.equal(clampRelationshipAxis(Number.NaN), 50);
  });

  it("normalizes full axis object deterministically", () => {
    const out = normalizeDyadicRelationshipAxes({
      trust: -1,
      affection: 12,
      fear: 101,
      duty: 40.4,
      resentment: 59.6,
      dependence: 200,
      admiration: 87,
      shameExposure: -8,
      socialRisk: 42,
      stability: 33.5,
    });
    assert.deepEqual(out, {
      trust: 0,
      affection: 12,
      fear: 100,
      duty: 40,
      resentment: 60,
      dependence: 100,
      admiration: 87,
      shameExposure: 0,
      socialRisk: 42,
      stability: 34,
    });
  });
});

describe("dyadic identity normalization", () => {
  it("orders participants consistently for relationship identity", () => {
    const normalized = normalizeDyadicParticipants({
      participantAId: "z-reader",
      participantBId: "a-character",
    });
    assert.equal(normalized.participantAId, "a-character");
    assert.equal(normalized.participantBId, "z-reader");
  });
});

describe("posture derivation", () => {
  it("derives explainable postures from bounded axes", () => {
    const bonded = deriveDyadicRelationshipPosture({
      ...defaultDyadicRelationshipAxes(),
      trust: 85,
      affection: 72,
      stability: 78,
    });
    const unstable = deriveDyadicRelationshipPosture({
      ...defaultDyadicRelationshipAxes(),
      shameExposure: 70,
      socialRisk: 68,
      stability: 29,
    });
    assert.equal(bonded.posture, "bonded");
    assert.ok(bonded.reasonCodes.length > 0);
    assert.equal(unstable.posture, "unstable");
  });
});

describe("deterministic event-driven updates", () => {
  it("updates relationship state deterministically with fixed event context", () => {
    const prior = createDyadicRelationshipState({
      relationshipId: "rel-1",
      participantAId: "char-1",
      participantBId: "char-2",
      relationshipType: "ally",
      origin: "observed_interaction",
      axes: {
        ...defaultDyadicRelationshipAxes(),
        trust: 62,
        affection: 58,
      },
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    });

    const event = {
      eventType: "support" as const,
      intensity: 2 as const,
      direction: "symmetric" as const,
      occurredAtIso: "2026-04-15T01:00:00.000Z",
    };

    const first = applyDyadicRelationshipEvent({ prior, event });
    const second = applyDyadicRelationshipEvent({ prior, event });
    assert.deepEqual(first, second);
    assert.equal(first.state.updatedAtIso, "2026-04-15T01:00:00.000Z");
  });

  it("supports symmetry vs asymmetry handling through direction scaling", () => {
    const prior = createDyadicRelationshipState({
      relationshipId: "rel-2",
      participantAId: "char-1",
      participantBId: "char-2",
      relationshipType: "rival",
      origin: "observed_interaction",
      axes: defaultDyadicRelationshipAxes(),
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    });

    const symmetric = applyDyadicRelationshipEvent({
      prior,
      event: {
        eventType: "betrayal",
        intensity: 2,
        direction: "symmetric",
        occurredAtIso: "2026-04-15T01:00:00.000Z",
      },
    });
    const directed = applyDyadicRelationshipEvent({
      prior,
      event: {
        eventType: "betrayal",
        intensity: 2,
        direction: "participant_a_to_b",
        occurredAtIso: "2026-04-15T01:00:00.000Z",
      },
    });

    assert.notDeepEqual(symmetric.explanation.axisDelta, directed.explanation.axisDelta);
    assert.ok((directed.explanation.axisDelta.fear ?? 0) > (symmetric.explanation.axisDelta.fear ?? 0));
  });

  it("keeps explanation structured without prose payload leakage", () => {
    const prior = createDyadicRelationshipState({
      relationshipId: "rel-3",
      participantAId: "char-1",
      participantBId: "reader-1",
      relationshipType: "reader_bond",
      origin: "observed_interaction",
      axes: defaultDyadicRelationshipAxes(),
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    });
    const out = applyDyadicRelationshipEvent({
      prior,
      event: {
        eventType: "confession",
        intensity: 2,
        occurredAtIso: "2026-04-15T02:00:00.000Z",
      },
    });
    const serialized = JSON.stringify(out.explanation);
    assert.ok(!serialized.includes("spokenResponse"));
    assert.ok(!serialized.includes("internalThought"));
    assert.ok(!serialized.includes("readerText"));
  });

  it("rejects truth-plane contamination attempts when boundary context is supplied", () => {
    const prior = createDyadicRelationshipState({
      relationshipId: "rel-4",
      participantAId: "char-1",
      participantBId: "reader-1",
      relationshipType: "reader_bond",
      origin: "observed_interaction",
      axes: defaultDyadicRelationshipAxes(),
      updatedAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.throws(
      () =>
        applyDyadicRelationshipEvent({
          prior,
          event: {
            eventType: "support",
            sourcePlane: "reader_interaction_memory",
            targetPlane: "canonical_truth",
            occurredAtIso: "2026-04-15T02:00:00.000Z",
          },
        }),
      /interaction_memory_to_canon_blocked/
    );
  });
});
