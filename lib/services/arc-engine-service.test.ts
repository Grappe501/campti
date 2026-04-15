import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARC_SCOPES, ARC_TYPES } from "@/lib/domain/narrative-arc";
import { applyNarrativeArcUpdate, createNarrativeArc } from "@/lib/services/arc-engine-service";

describe("arc-engine-service", () => {
  it("creates a bounded arc model with supported type and scope", () => {
    const arc = createNarrativeArc({
      arcId: "arc-1",
      arcType: "marriage_fracture",
      arcScope: "dyadic",
      anchorEntities: [
        { anchorKind: "relationship", anchorId: "rel-1" },
        { anchorKind: "character", anchorId: "person-1" },
      ],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    assert.ok(ARC_TYPES.includes(arc.arcType));
    assert.ok(ARC_SCOPES.includes(arc.arcScope));
    assert.equal(arc.lifecycleState, "dormant");
    assert.equal(arc.lastExplanation.summaryCode, "arc_initialized");
  });

  it("rejects unsupported scope/type", () => {
    assert.throws(
      () =>
        createNarrativeArc({
          arcId: "arc-2",
          arcType: "invalid_arc_type",
          arcScope: "dyadic",
          anchorEntities: [{ anchorKind: "relationship", anchorId: "rel-1" }],
          createdAtIso: "2026-04-15T00:00:00.000Z",
        }),
      /unsupported arc type/
    );

    assert.throws(
      () =>
        createNarrativeArc({
          arcId: "arc-3",
          arcType: "marriage_fracture",
          arcScope: "invalid_scope",
          anchorEntities: [{ anchorKind: "relationship", anchorId: "rel-1" }],
          createdAtIso: "2026-04-15T00:00:00.000Z",
        }),
      /unsupported arc scope/
    );
  });

  it("moves lifecycle from dormant to seeded when activation legitimacy is present", () => {
    const arc = createNarrativeArc({
      arcId: "arc-activation",
      arcType: "family_survival",
      arcScope: "family_household",
      anchorEntities: [{ anchorKind: "family", anchorId: "fam-1" }],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const updated = applyNarrativeArcUpdate({
      arc,
      observedAtIso: "2026-04-15T01:00:00.000Z",
      evidence: {
        observedEvents: 2,
        activeConsequences: 1,
        relationshipShift: 50,
        memoryActivationPressure: 30,
        temporalPressure: 40,
        worldStatePressure: 35,
        storylineMomentum: 30,
      },
    });

    assert.equal(updated.updatedArc.lifecycleState, "seeded");
    assert.equal(updated.signals.progressed, true);
    assert.ok(updated.explanation.reasonCodes.includes("structural_legitimacy_present"));
  });

  it("keeps deterministic progression output for identical inputs", () => {
    const arc = createNarrativeArc({
      arcId: "arc-determinism",
      arcType: "political_survival",
      arcScope: "local_social",
      anchorEntities: [{ anchorKind: "faction", anchorId: "f-1" }],
      lifecycleState: "active",
      tensionLevel: 45,
      intensityLevel: 40,
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const input = {
      arc,
      observedAtIso: "2026-04-15T02:00:00.000Z",
      evidence: {
        observedEvents: 3,
        activeConsequences: 2,
        relationshipShift: 70,
        memoryActivationPressure: 35,
        temporalPressure: 60,
        worldStatePressure: 65,
        storylineMomentum: 50,
      },
    } as const;

    const outA = applyNarrativeArcUpdate(input);
    const outB = applyNarrativeArcUpdate(input);

    assert.deepEqual(outA, outB);
  });

  it("emits a stall signal when legitimacy exists but progression threshold is not met", () => {
    const arc = createNarrativeArc({
      arcId: "arc-stall",
      arcType: "inheritance_struggle",
      arcScope: "family_household",
      anchorEntities: [{ anchorKind: "household", anchorId: "house-1" }],
      lifecycleState: "active",
      tensionLevel: 48,
      intensityLevel: 45,
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const out = applyNarrativeArcUpdate({
      arc,
      observedAtIso: "2026-04-15T03:00:00.000Z",
      evidence: {
        observedEvents: 1,
        activeConsequences: 0,
        relationshipShift: 6,
        memoryActivationPressure: 0,
        temporalPressure: 10,
        worldStatePressure: 8,
        storylineMomentum: 4,
      },
    });

    assert.equal(out.updatedArc.lifecycleState, "active");
    assert.equal(out.signals.stalled, true);
    assert.equal(out.signals.failed, false);
  });

  it("fails an arc under deterministic failure pressure", () => {
    const arc = createNarrativeArc({
      arcId: "arc-failure",
      arcType: "revenge_justice",
      arcScope: "dyadic",
      anchorEntities: [{ anchorKind: "relationship", anchorId: "rel-2" }],
      lifecycleState: "crisis",
      tensionLevel: 80,
      intensityLevel: 78,
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const out = applyNarrativeArcUpdate({
      arc,
      observedAtIso: "2026-04-15T04:00:00.000Z",
      evidence: {
        observedEvents: 3,
        activeConsequences: 8,
        relationshipShift: 90,
        memoryActivationPressure: 20,
        temporalPressure: 70,
        worldStatePressure: 95,
        storylineMomentum: 10,
      },
    });

    assert.equal(out.updatedArc.lifecycleState, "failed");
    assert.equal(out.signals.failed, true);
    assert.ok(out.explanation.reasonCodes.includes("failure_pressure_high"));
  });

  it("resolves and then transforms through structurally justified updates", () => {
    const resolvingArc = createNarrativeArc({
      arcId: "arc-resolution",
      arcType: "reconciliation_attempt",
      arcScope: "dyadic",
      anchorEntities: [{ anchorKind: "relationship", anchorId: "rel-3" }],
      lifecycleState: "resolving",
      tensionLevel: 44,
      intensityLevel: 40,
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const resolved = applyNarrativeArcUpdate({
      arc: resolvingArc,
      observedAtIso: "2026-04-15T05:00:00.000Z",
      evidence: {
        observedEvents: 2,
        activeConsequences: 1,
        relationshipShift: 20,
        memoryActivationPressure: 72,
        temporalPressure: 60,
        worldStatePressure: 30,
        storylineMomentum: 88,
      },
    });
    assert.equal(resolved.updatedArc.lifecycleState, "resolved");
    assert.equal(resolved.signals.resolved, true);

    const transformed = applyNarrativeArcUpdate({
      arc: resolved.updatedArc,
      observedAtIso: "2026-04-15T06:00:00.000Z",
      evidence: {
        observedEvents: 1,
        activeConsequences: 0,
        relationshipShift: 15,
        memoryActivationPressure: 40,
        temporalPressure: 50,
        worldStatePressure: 76,
        storylineMomentum: 80,
      },
    });
    assert.equal(transformed.updatedArc.lifecycleState, "transformed");
    assert.equal(transformed.signals.transformed, true);
  });

  it("does not leak prose fields in explanation payload", () => {
    const arc = createNarrativeArc({
      arcId: "arc-no-prose",
      arcType: "succession",
      arcScope: "book_spine",
      anchorEntities: [{ anchorKind: "book", anchorId: "book-1" }],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const out = applyNarrativeArcUpdate({
      arc,
      observedAtIso: "2026-04-15T07:00:00.000Z",
      evidence: { observedEvents: 1, storylineMomentum: 40 },
    });
    const serialized = JSON.stringify(out.explanation);
    assert.equal(serialized.includes("spokenResponse"), false);
    assert.equal(serialized.includes("generatedText"), false);
    assert.equal(typeof out.explanation.summaryCode, "string");
  });

  it("blocks truth-plane contamination for reader memory to canonical arc writes", () => {
    const arc = createNarrativeArc({
      arcId: "arc-boundary",
      arcType: "displacement",
      arcScope: "local_social",
      anchorEntities: [{ anchorKind: "faction", anchorId: "f-2" }],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    assert.throws(
      () =>
        applyNarrativeArcUpdate({
          arc,
          observedAtIso: "2026-04-15T08:00:00.000Z",
          sourcePlane: "reader_interaction_memory",
          targetPlane: "canonical_truth",
          evidence: { observedEvents: 2, activeConsequences: 1 },
        }),
      /interaction_memory_to_canon_blocked/
    );
  });
});
