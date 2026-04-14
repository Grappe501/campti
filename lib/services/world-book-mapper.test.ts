/**
 * Spine matching (pure + chronology map). Run: npx tsx --test lib/services/world-book-mapper.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EpicBook } from "@/lib/domain/epic-book";
import { listEpicBooksMatchingWorldState } from "@/lib/services/world-book-mapper";

function chronology(...entries: [string, number][]) {
  return new Map(entries);
}

function eb(
  id: string,
  orderIndex: number,
  start: string | null,
  end: string | null
): EpicBook {
  return {
    id,
    title: id,
    orderIndex,
    startYear: null,
    endYear: null,
    startWorldStateId: start,
    endWorldStateId: end,
    summary: null,
    themes: [],
    isProvisional: false,
    metadataJson: null,
  };
}

describe("listEpicBooksMatchingWorldState", () => {
  it("returns empty when no spine row defines WS bounds (non-claiming placeholders)", () => {
    const books = [eb("a", 1, null, null)];
    const m = chronology(["ws_x", 0]);
    assert.deepEqual(listEpicBooksMatchingWorldState(books, "ws_x", m), []);
  });

  it("returns single match when exactly one window contains the slice by chronologyIndex", () => {
    const books = [
      eb("b1", 1, "ws_a", "ws_c"),
      eb("b2", 2, "ws_d", "ws_z"),
    ];
    const m = chronology(
      ["ws_a", 0],
      ["ws_b", 1],
      ["ws_c", 2],
      ["ws_d", 3],
      ["ws_z", 10]
    );
    const out = listEpicBooksMatchingWorldState(books, "ws_b", m);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, "b1");
  });

  it("surfaces overlap as multiple matches (caller / getBookForWorldState must reject)", () => {
    const books = [eb("x", 1, "ws_a", "ws_m"), eb("y", 2, "ws_b", "ws_z")];
    const m = chronology(
      ["ws_a", 0],
      ["ws_b", 1],
      ["ws_c", 2],
      ["ws_m", 3],
      ["ws_z", 4]
    );
    assert.equal(listEpicBooksMatchingWorldState(books, "ws_c", m).length, 2);
  });
});
