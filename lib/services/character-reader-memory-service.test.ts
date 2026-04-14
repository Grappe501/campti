/**
 * P2-G service integration (optional). Requires DB with ≥2 `Person` rows.
 * Run all: npx tsx --test lib/services/character-reader-memory-service.test.ts
 * Skips DB tests if connect fails or fewer than 2 persons exist.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  getCharacterReaderMemory,
  getOrCreateCharacterReaderMemory,
  incrementFamiliarityWithinBounds,
  updateMemoryAfterInteraction,
} from "@/lib/services/character-reader-memory-service";

const READER_TEST_ID = "p2g-service-test-reader";

describe("CharacterReaderMemory service (integration)", () => {
  let enabled = false;
  let charA = "";
  let charB = "";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const persons = await prisma.person.findMany({
        take: 2,
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (persons.length < 2) {
        return;
      }
      charA = persons[0]!.id;
      charB = persons[1]!.id;
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER_TEST_ID },
      });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) {
      return;
    }
    try {
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER_TEST_ID },
      });
    } catch {
      /* teardown best-effort */
    }
  });

  it("getOrCreate returns the same row id when called twice for the same pair", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const a = await getOrCreateCharacterReaderMemory(charA, READER_TEST_ID);
    const b = await getOrCreateCharacterReaderMemory(charA, READER_TEST_ID);
    assert.equal(a.id, b.id);
    assert.equal(a.interactionCount, 0);
  });

  it("unique pair: two characters and one reader yield two distinct rows", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const m1 = await getOrCreateCharacterReaderMemory(charA, READER_TEST_ID);
    const m2 = await getOrCreateCharacterReaderMemory(charB, READER_TEST_ID);
    assert.notEqual(m1.id, m2.id);
    assert.equal(m1.readerId, m2.readerId);
    assert.notEqual(m1.characterId, m2.characterId);
  });

  it("updateMemoryAfterInteraction increments count and keeps familiarity bounded", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const afterInteract = await updateMemoryAfterInteraction({
      characterId: charA,
      readerId: READER_TEST_ID,
      knownFactsPatch: { greeting: "hello" },
    });
    assert.equal(afterInteract.interactionCount >= 1, true);
    assert.equal(afterInteract.familiarityLevel <= 100, true);
    const raw = await prisma.characterReaderMemory.findUnique({
      where: { characterId_readerId: { characterId: charA, readerId: READER_TEST_ID } },
    });
    assert.ok(raw);
    assert.equal((raw!.knownFacts as Record<string, unknown>).greeting, "hello");
  });

  it("incrementFamiliarityWithinBounds on char B does not change char A row", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and at least two Person rows");
      return;
    }
    const beforeA = await getCharacterReaderMemory(charA, READER_TEST_ID);
    await incrementFamiliarityWithinBounds(charB, READER_TEST_ID, 5);
    const afterA = await getCharacterReaderMemory(charA, READER_TEST_ID);
    assert.ok(beforeA && afterA);
    assert.equal(afterA!.familiarityLevel, beforeA!.familiarityLevel);
  });
});
