/**
 * Canonical world-state chronology (pure). Run: npx tsx --test lib/domain/world-state-chronology.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareWorldStatesChronologicallyInMap,
  worldStateFallsWithinChronologyWindow,
} from "@/lib/domain/world-state-chronology";

function chronology(...entries: [string, number][]) {
  return new Map(entries);
}

describe("worldStateFallsWithinChronologyWindow", () => {
  it("ignores lexicographic id ordering; only chronologyIndex values matter", () => {
    const m = chronology(["z_early", 0], ["a_late", 5]);
    assert.equal(worldStateFallsWithinChronologyWindow("z_early", "a_late", null, m), false);
    assert.equal("a_late" < "z_early", true);
  });

  it("earlier target is not inside a window that starts later", () => {
    const m = chronology(["early", 1], ["late", 10]);
    assert.equal(worldStateFallsWithinChronologyWindow("early", "late", null, m), false);
  });

  it("inclusive window [start,end]", () => {
    const m = chronology(["a", 0], ["b", 1], ["c", 2]);
    assert.equal(worldStateFallsWithinChronologyWindow("b", "a", "c", m), true);
  });
});

describe("compareWorldStatesChronologicallyInMap", () => {
  it("orders by index, not id string", () => {
    const m = chronology(["zzz", 1], ["aaa", 10]);
    assert.equal(compareWorldStatesChronologicallyInMap("zzz", "aaa", m) < 0, true);
  });
});
