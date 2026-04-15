import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  applyCanonicalConsequenceFromObservedEvent,
  applyReaderBondConsequenceFromObservedEvent,
  buildConsequenceOutputSurface,
} from "@/lib/services/consequence-engine-service";

describe("consequence-engine-service", () => {
  let enabled = false;
  let personA = "";
  let personB = "";
  let relationshipId = "";
  const readerId = "phase2-chunk3-reader";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const people = await prisma.person.findMany({
        take: 2,
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (people.length < 2) return;
      personA = people[0]!.id;
      personB = people[1]!.id;
      const existing = await prisma.characterRelationship.findFirst({
        where: { personAId: personA, personBId: personB },
        select: { id: true },
      });
      if (existing) {
        relationshipId = existing.id;
      } else {
        const created = await prisma.characterRelationship.create({
          data: {
            personAId: personA,
            personBId: personB,
            relationshipType: "ally",
            relationshipSummary: "phase2 chunk3 relationship setup",
          },
          select: { id: true },
        });
        relationshipId = created.id;
      }
      await prisma.characterRelationship.update({
        where: { id: relationshipId },
        data: { generatedDynamicSummary: null },
      });
      await prisma.characterReaderMemory.deleteMany({
        where: { characterId: personA, readerId },
      });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.characterRelationship.update({
        where: { id: relationshipId },
        data: { generatedDynamicSummary: null },
      });
      await prisma.characterReaderMemory.deleteMany({
        where: { characterId: personA, readerId },
      });
    } catch {
      /* best-effort teardown */
    }
  });

  it("rejects consequence creation without observed trigger anchor", async () => {
    await assert.rejects(
      () =>
        applyCanonicalConsequenceFromObservedEvent({
          relationshipId: "rel",
          event: {
            eventType: "support",
            sourcePlane: "canonical_truth",
            targetPlane: "canonical_truth",
          },
          trigger: {
            sourceKind: "relationship_event",
            observedEventId: "",
            sourceEventType: "support",
            occurredAtIso: "2026-04-17T00:00:00.000Z",
          },
          affectedEntityIds: ["a", "b"],
        }),
      /observedEventId is required/
    );
  });

  it("enforces channel/plane separation for reader-bond consequences", async () => {
    await assert.rejects(
      () =>
        applyReaderBondConsequenceFromObservedEvent({
          characterId: "char",
          readerId: "reader",
          event: {
            eventType: "support",
            sourcePlane: "canonical_truth",
            targetPlane: "canonical_truth",
          },
          trigger: {
            sourceKind: "interaction_event",
            observedEventId: "evt-1",
            sourceEventType: "support",
            occurredAtIso: "2026-04-17T00:00:00.000Z",
          },
          affectedEntityIds: ["char", "reader"],
        }),
      /reader-bond consequence flow requires reader_interaction_memory/
    );
  });

  it("creates deterministic canonical consequence records from observed betrayal", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const first = await applyCanonicalConsequenceFromObservedEvent({
      relationshipId,
      event: {
        eventType: "betrayal",
        intensity: 3,
        sourcePlane: "canonical_truth",
        targetPlane: "canonical_truth",
      },
      trigger: {
        sourceKind: "relationship_event",
        observedEventId: "betrayal-evt-1",
        sourceEventType: "betrayal",
        occurredAtIso: "2026-04-17T00:00:00.000Z",
        relationshipId,
      },
      affectedEntityIds: [personA, personB],
      linkedRelationshipIds: ["linked-rel-1", "linked-rel-2"],
    });
    assert.equal(first.record.category, "relational");
    assert.equal(first.record.lifecycleState, "active");
    assert.ok(first.record.propagationTargets.some((t) => t.targetKind === "linked_relationships"));
    assert.ok(first.output.futureConstraintSignals.some((s) => s.signalCode === "trust_repair_needed"));

    const second = await applyCanonicalConsequenceFromObservedEvent({
      relationshipId,
      event: {
        eventType: "betrayal",
        intensity: 3,
        sourcePlane: "canonical_truth",
        targetPlane: "canonical_truth",
      },
      trigger: {
        sourceKind: "relationship_event",
        observedEventId: "betrayal-evt-2",
        sourceEventType: "betrayal",
        occurredAtIso: "2026-04-17T00:01:00.000Z",
        relationshipId,
      },
      affectedEntityIds: [personA, personB],
      linkedRelationshipIds: ["linked-rel-1", "linked-rel-2"],
    });
    assert.equal(second.state.records.length, first.state.records.length + 1);
    assert.equal(second.record.severity, "high");
  });

  it("creates reader-bond consequences and does not contaminate canonical relationship summary", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const beforeCanonical = await prisma.characterRelationship.findUniqueOrThrow({
      where: { id: relationshipId },
      select: { generatedDynamicSummary: true },
    });

    const out = await applyReaderBondConsequenceFromObservedEvent({
      characterId: personA,
      readerId,
      event: {
        eventType: "public_disapproval",
        intensity: 2,
        sourcePlane: "reader_interaction_memory",
        targetPlane: "reader_interaction_memory",
      },
      trigger: {
        sourceKind: "interaction_event",
        observedEventId: "reader-evt-1",
        sourceEventType: "public_disapproval",
        occurredAtIso: "2026-04-17T01:00:00.000Z",
      },
      affectedEntityIds: [personA, readerId],
    });

    assert.equal(out.record.category, "reputational");
    assert.equal(out.record.visibility, "scene_public");
    assert.ok(
      out.output.relationshipPressureModifiers.some(
        (modifier) => modifier.target === "social_risk_pressure"
      )
    );
    const afterCanonical = await prisma.characterRelationship.findUniqueOrThrow({
      where: { id: relationshipId },
      select: { generatedDynamicSummary: true },
    });
    assert.equal(afterCanonical.generatedDynamicSummary, beforeCanonical.generatedDynamicSummary);
  });

  it("produces deterministic output surface shape from active consequences", () => {
    const out = buildConsequenceOutputSurface({
      contractVersion: "1",
      channel: "canonical_dyad",
      updatedAtIso: "2026-04-17T00:00:00.000Z",
      records: [
        {
          consequenceId: "c1",
          channel: "canonical_dyad",
          trigger: {
            sourceKind: "scene_event",
            observedEventId: "evt-1",
            sourceEventType: "violence",
            occurredAtIso: "2026-04-17T00:00:00.000Z",
          },
          affectedEntityIds: ["a", "b"],
          category: "bodily",
          severity: "high",
          visibility: "private_dyadic",
          immediacy: "immediate",
          duration: "long",
          lifecycleState: "active",
          reversibility: "partially_reversible",
          propagationTargets: [
            {
              targetKind: "household_economic_pressure",
              targetRef: null,
              modifier: 9,
            },
          ],
          explanation: {
            ruleCode: "event_violence_to_consequence_v1",
            reasonCodes: ["category_bodily"],
          },
          createdAtIso: "2026-04-17T00:00:00.000Z",
          updatedAtIso: "2026-04-17T00:00:00.000Z",
        },
      ],
    });
    assert.equal(out.activeConsequenceSummary.length, 1);
    assert.ok(
      out.futureConstraintSignals.some((signal) => signal.signalCode === "bodily_caution")
    );
    assert.ok(out.memorySalienceModifiers[0]!.salienceWeight >= 90);
  });
});
