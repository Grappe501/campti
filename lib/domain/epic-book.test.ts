/**
 * Epic spine domain (pure). Run: npx tsx --test lib/domain/epic-book.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EpicBook } from "@/lib/domain/epic-book";
import {
  assertWorldStateWithinEpicBookChronology,
  collectEpicBooksMatchingYear,
  epicBookYearWindowsOverlap,
  listEpicBooksMatchingWorldState,
  worldStateWithinEpicBookBounds,
} from "@/lib/domain/epic-book";

function chronology(...entries: [string, number][]) {
  return new Map(entries);
}

function eb(
  id: string,
  orderIndex: number,
  start: string | null,
  end: string | null,
  years: { startYear: number | null; endYear: number | null } = { startYear: null, endYear: null }
): EpicBook {
  return {
    id,
    title: id,
    orderIndex,
    ...years,
    startWorldStateId: start,
    endWorldStateId: end,
    summary: null,
    themes: [],
    isProvisional: false,
    metadataJson: null,
  };
}

describe("worldStateWithinEpicBookBounds", () => {
  it("does not use lexicographic id order (later id string can be earlier in time)", () => {
    const c = chronology(["zzz_earlier_slice", 0], ["aaa_later_slice", 2]);
    assert.equal(
      worldStateWithinEpicBookBounds(
        { startWorldStateId: "aaa_later_slice", endWorldStateId: null },
        "zzz_earlier_slice",
        c
      ),
      false
    );
    assert.equal("aaa_later_slice" < "zzz_earlier_slice", true);
  });

  it("accepts containment by chronologyIndex even when id strings sort differently", () => {
    const c = chronology(["ws_a", 0], ["ws_b", 1], ["ws_c", 2]);
    assert.equal(
      worldStateWithinEpicBookBounds(
        { startWorldStateId: "ws_a", endWorldStateId: "ws_c" },
        "ws_b",
        c
      ),
      true
    );
  });
});

describe("listEpicBooksMatchingWorldState", () => {
  it("returns multiple matches when windows overlap in order space (ambiguous spine)", () => {
    const books = [eb("x", 1, "ws_a", "ws_m"), eb("y", 2, "ws_b", "ws_z")];
    const c = chronology(
      ["ws_a", 0],
      ["ws_b", 1],
      ["ws_c", 2],
      ["ws_m", 3],
      ["ws_z", 4]
    );
    const m = listEpicBooksMatchingWorldState(books, "ws_c", c);
    assert.equal(m.length, 2);
  });
});

describe("collectEpicBooksMatchingYear", () => {
  it("returns every book whose year window contains the year", () => {
    const books = [
      eb("a", 1, null, null, { startYear: 1800, endYear: 1850 }),
      eb("b", 2, null, null, { startYear: 1840, endYear: 1900 }),
    ];
    const m = collectEpicBooksMatchingYear(books, 1845);
    assert.equal(m.length, 2);
  });
});

describe("epicBookYearWindowsOverlap", () => {
  it("is false when neither book claims the year axis", () => {
    assert.equal(
      epicBookYearWindowsOverlap(
        { startYear: null, endYear: null },
        { startYear: null, endYear: null }
      ),
      false
    );
  });
});

describe("assertWorldStateWithinEpicBookChronology", () => {
  it("throws when current slice is before effective start in timeline order", () => {
    const c = chronology(["early", 0], ["late", 2]);
    assert.throws(() =>
      assertWorldStateWithinEpicBookChronology(
        { title: "T", startWorldStateId: "late", endWorldStateId: null },
        "early",
        c
      )
    );
  });
});
