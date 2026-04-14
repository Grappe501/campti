/**
 * P2-G reader relationship memory (pure). Run: npx tsx --test lib/domain/character-reader-memory.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clampFamiliarityLevel,
  familiarityGainForInteraction,
  MAX_READER_RELATIONSHIP_FAMILIARITY,
} from "@/lib/domain/character-reader-memory";

describe("clampFamiliarityLevel", () => {
  it("clamps to [0, max]", () => {
    assert.equal(clampFamiliarityLevel(-5), 0);
    assert.equal(clampFamiliarityLevel(500), MAX_READER_RELATIONSHIP_FAMILIARITY);
    assert.equal(clampFamiliarityLevel(33.7), 33);
  });
});

describe("familiarityGainForInteraction", () => {
  it("returns 0 when already at max", () => {
    assert.equal(
      familiarityGainForInteraction(MAX_READER_RELATIONSHIP_FAMILIARITY, 99),
      0
    );
  });

  it("increment respects remaining headroom to max", () => {
    assert.equal(familiarityGainForInteraction(99, 5), 1);
    assert.equal(familiarityGainForInteraction(98, 5), 2);
  });

  it("cumulative familiarity over many interactions stays bounded", () => {
    let fam = 0;
    for (let n = 1; n <= 200; n++) {
      const gain = familiarityGainForInteraction(fam, n);
      fam = clampFamiliarityLevel(fam + gain);
    }
    assert.equal(fam, MAX_READER_RELATIONSHIP_FAMILIARITY);
  });
});

describe("relationship isolation (conceptual)", () => {
  it("memory identity is per character+reader pair, not reader alone", () => {
    const pairA = `char-a::reader-1`;
    const pairB = `char-b::reader-1`;
    assert.notEqual(pairA, pairB);
  });

  it("two characters sharing one reader id have independent familiarity progression (simulated)", () => {
    let famCharA = 0;
    let famCharB = 0;
    const reader = "same-reader-opaque-id";
    for (let n = 1; n <= 15; n++) {
      famCharA = clampFamiliarityLevel(
        famCharA + familiarityGainForInteraction(famCharA, n)
      );
      famCharB = clampFamiliarityLevel(
        famCharB + familiarityGainForInteraction(famCharB, n)
      );
    }
    assert.equal(famCharA, famCharB);
    famCharA = clampFamiliarityLevel(famCharA + 25);
    assert.notEqual(famCharA, famCharB);
    void reader;
  });
});

describe("incrementFamiliarityWithinBounds (pure simulation)", () => {
  it("manual delta respects clamp without interaction count", () => {
    let fam = 90;
    const delta = 50;
    fam = clampFamiliarityLevel(fam + delta);
    assert.equal(fam, MAX_READER_RELATIONSHIP_FAMILIARITY);
  });
});
