import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  applyCanonicalRelationshipObservedEvent,
  applyReaderBondObservedEvent,
  decodeCanonicalRelationshipProgressionEnvelope,
  decodeReaderBondRelationshipProgressionEnvelope,
  deriveRelationshipProgressionSignals,
  mergeReaderNotesWithProgressionEnvelope,
} from "@/lib/services/relationship-progression-service";
import { RELATIONSHIP_PROGRESSION_CONTRACT_VERSION } from "@/lib/domain/relationship-progression";

describe("relationship-progression-service", () => {
  let enabled = false;
  let personA = "";
  let personB = "";
  let relationshipId = "";
  const readerId = "phase2-chunk2-reader";

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
            relationshipSummary: "test setup relationship",
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

  it("derives bounded progression signals deterministically", () => {
    const out = deriveRelationshipProgressionSignals({
      priorAxes: {
        trust: 50,
        affection: 50,
        fear: 50,
        duty: 50,
        resentment: 50,
        dependence: 50,
        admiration: 50,
        shameExposure: 50,
        socialRisk: 50,
        stability: 50,
      },
      nextAxes: {
        trust: 70,
        affection: 65,
        fear: 35,
        duty: 55,
        resentment: 35,
        dependence: 45,
        admiration: 60,
        shameExposure: 35,
        socialRisk: 40,
        stability: 68,
      },
    });
    assert.equal(out.trend, "warming");
    assert.equal(out.disclosureLikelihoodShift, "increasing");
  });

  it("rejects prohibited truth-plane crossing for reader-bond progression", async () => {
    await assert.rejects(
      () =>
        applyReaderBondObservedEvent({
          characterId: "char",
          readerId: "reader",
          event: {
            eventType: "support",
            sourcePlane: "canonical_truth",
            targetPlane: "canonical_truth",
          },
        }),
      /Reader bond progression requires reader_interaction_memory/
    );
  });

  it("rejects prohibited truth-plane crossing for canonical progression", async () => {
    await assert.rejects(
      () =>
        applyCanonicalRelationshipObservedEvent({
          relationshipId: "rel",
          event: {
            eventType: "support",
            sourcePlane: "reader_interaction_memory",
            targetPlane: "reader_interaction_memory",
          },
        }),
      /Canonical relationship progression requires canonical_truth/
    );
  });

  it("persists canonical progression snapshots with repeated deterministic updates", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const first = await applyCanonicalRelationshipObservedEvent({
      relationshipId,
      event: {
        eventType: "support",
        intensity: 2,
        direction: "symmetric",
        occurredAtIso: "2026-04-16T00:00:00.000Z",
      },
    });
    const second = await applyCanonicalRelationshipObservedEvent({
      relationshipId,
      event: {
        eventType: "support",
        intensity: 2,
        direction: "symmetric",
        occurredAtIso: "2026-04-16T00:01:00.000Z",
      },
    });
    assert.equal(first.snapshot.contractVersion, RELATIONSHIP_PROGRESSION_CONTRACT_VERSION);
    assert.equal(second.snapshot.eventCount, first.snapshot.eventCount + 1);
    assert.deepEqual(first.explanation.axisDelta, second.explanation.axisDelta);
    const row = await prisma.characterRelationship.findUniqueOrThrow({
      where: { id: relationshipId },
      select: { generatedDynamicSummary: true },
    });
    const decoded = decodeCanonicalRelationshipProgressionEnvelope(row.generatedDynamicSummary);
    assert.ok(decoded);
    assert.equal(decoded!.snapshot.channel, "canonical_dyad");
    assert.equal(decoded!.snapshot.eventCount, second.snapshot.eventCount);
  });

  it("persists reader-bond progression in relationshipNotes with explainable shape", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const out = await applyReaderBondObservedEvent({
      characterId: personA,
      readerId,
      event: {
        eventType: "confession",
        intensity: 2,
        direction: "participant_b_to_a",
        occurredAtIso: "2026-04-16T01:00:00.000Z",
      },
    });
    assert.equal(out.snapshot.channel, "reader_bond_dyad");
    assert.equal(typeof out.explanation.axisDelta, "object");
    assert.equal(out.explanation.channel, "reader_bond_dyad");
    const memory = await prisma.characterReaderMemory.findUniqueOrThrow({
      where: { characterId_readerId: { characterId: personA, readerId } },
      select: { relationshipNotes: true },
    });
    const decoded = decodeReaderBondRelationshipProgressionEnvelope(memory.relationshipNotes);
    assert.ok(decoded);
    assert.equal(decoded!.snapshot.relationshipType, "reader_bond");
  });

  it("merges progression payload without deleting existing relationship note keys", () => {
    const merged = mergeReaderNotesWithProgressionEnvelope({
      relationshipNotes: {
        previousKey: { keep: true },
      } as Prisma.JsonValue,
      envelope: {
        contractVersion: RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
        snapshot: {
          contractVersion: RELATIONSHIP_PROGRESSION_CONTRACT_VERSION,
          channel: "reader_bond_dyad",
          relationshipId: "rel",
          participantAId: "a",
          participantBId: "b",
          relationshipType: "reader_bond",
          axes: {
            trust: 50,
            affection: 50,
            fear: 50,
            duty: 50,
            resentment: 50,
            dependence: 50,
            admiration: 50,
            shameExposure: 50,
            socialRisk: 50,
            stability: 50,
          },
          posture: "strained",
          eventCount: 0,
          lastEvent: null,
          signals: {
            trend: "flat",
            ruptureRisk: "elevated",
            disclosureLikelihoodShift: "steady",
            attachmentPressure: "moderate",
            reconciliationAvailability: "guarded",
          },
          updatedAtIso: "2026-04-16T00:00:00.000Z",
        },
        recentEvents: [],
      },
    });
    const root = merged as Record<string, unknown>;
    assert.ok(root.previousKey);
    assert.ok(root.dyadicRelationshipProgressionV1);
  });
});
