/**
 * P2-O reader memory writeback. Run: npx tsx --test lib/services/reader-memory-writeback-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import { prisma } from "@/lib/prisma";
import { getCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import {
  assertAllowedReaderDisclosurePatch,
  extractDirectReaderDisclosures,
  updateReaderMemoryFromTurn,
} from "@/lib/services/reader-memory-writeback-service";

const sampleResponse = {
  contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
  spokenResponse: "I hear you.",
  internalThought: "",
  knowledgeSource: "uncertain" as const,
  emotionalTone: "neutral",
};

describe("extractDirectReaderDisclosures (unit)", () => {
  it("captures explicit name disclosure only", () => {
    const f = extractDirectReaderDisclosures("Hello — my name is Jean Dupont.");
    assert.equal(f.disclosed_name, "Jean Dupont");
  });

  it("captures call me", () => {
    const f = extractDirectReaderDisclosures("Please call me Sam.");
    assert.equal(f.disclosed_call_me, "Sam");
  });

  it("does not invent facts from generic prose", () => {
    const f = extractDirectReaderDisclosures("The weather is fine and the river is high.");
    assert.deepEqual(f, {});
  });

  it("does not treat third-party lines as reader disclosures", () => {
    const f = extractDirectReaderDisclosures("She said her name is Marie.");
    assert.equal(f.disclosed_name, undefined);
  });

  it("rejects unknown disclosure keys in writeback patch", () => {
    assert.throws(
      () => assertAllowedReaderDisclosurePatch({ disclosed_name: "Alex", planType: "premium" }),
      /Disallowed reader disclosure key/
    );
  });
});

describe("updateReaderMemoryFromTurn (integration)", () => {
  let enabled = false;
  let charA = "";
  let charB = "";
  const READER = "p2o-writeback-test-reader";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const persons = await prisma.person.findMany({
        take: 2,
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (persons.length < 2) return;
      charA = persons[0]!.id;
      charB = persons[1]!.id;
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER },
      });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER },
      });
    } catch {
      /* ok */
    }
  });

  it("stores only direct disclosures; bland text adds no disclosure keys", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and two Person rows");
      return;
    }
    await updateReaderMemoryFromTurn({
      characterId: charA,
      readerId: READER,
      readerTurnText: "Just thinking about the dock.",
      characterResponse: sampleResponse,
    });
    const m = await getCharacterReaderMemory(charA, READER);
    assert.ok(m);
    const facts = m!.knownFacts as Record<string, unknown>;
    assert.equal(facts.disclosed_name, undefined);
    assert.equal(m!.interactionCount, 1);
  });

  it("repeated turns increase familiarity gradually", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and two Person rows");
      return;
    }
    await prisma.characterReaderMemory.deleteMany({ where: { readerId: READER } });

    let fam = 0;
    for (let i = 0; i < 3; i++) {
      const m = await updateReaderMemoryFromTurn({
        characterId: charA,
        readerId: READER,
        readerTurnText: "Hi again.",
        characterResponse: sampleResponse,
      });
      assert.ok(m.familiarityLevel >= fam);
      fam = m.familiarityLevel;
      assert.equal(m.interactionCount, i + 1);
    }
    assert.ok(fam >= 3);
  });

  it("does not leak one character's disclosures to another character row", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and two Person rows");
      return;
    }
    await prisma.characterReaderMemory.deleteMany({ where: { readerId: READER } });

    await updateReaderMemoryFromTurn({
      characterId: charA,
      readerId: READER,
      readerTurnText: "My name is Alex.",
      characterResponse: sampleResponse,
    });
    await updateReaderMemoryFromTurn({
      characterId: charB,
      readerId: READER,
      readerTurnText: "Hello there.",
      characterResponse: sampleResponse,
    });

    const memA = await getCharacterReaderMemory(charA, READER);
    const memB = await getCharacterReaderMemory(charB, READER);
    assert.ok(memA && memB);
    assert.equal((memA!.knownFacts as Record<string, unknown>).disclosed_name, "Alex");
    assert.equal((memB!.knownFacts as Record<string, unknown>).disclosed_name, undefined);
  });
});
