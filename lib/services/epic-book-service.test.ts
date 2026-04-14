/**
 * Epic spine guards (pure projections). Run: npx tsx --test lib/services/epic-book-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EpicBook } from "@/lib/domain/epic-book";
import {
  collectEpicBooksMatchingYear,
  epicBookParticipatesInWorldStateMapping,
  listEpicBooksMatchingWorldState,
} from "@/lib/domain/epic-book";

/** Mirrors `getBookForYear` resolution rules without hitting the database. */
function resolveBookForYearLike(books: EpicBook[], year: number): EpicBook | null {
  const matches = collectEpicBooksMatchingYear(books, year);
  if (matches.length > 1) {
    const ids = matches.map((m) => m.id).join(", ");
    throw new Error(`EpicBook: ambiguous year match for ${year} (${ids}).`);
  }
  if (matches.length === 0) {
    return null;
  }
  return matches[0];
}

/** Mirrors `getBookForWorldState` resolution rules without hitting the database. */
function resolveBookForWorldStateLike(
  books: EpicBook[],
  worldStateId: string,
  chronologyIndexById: Map<string, number>
): EpicBook | null {
  const participating = books.filter(epicBookParticipatesInWorldStateMapping);
  if (participating.length === 0) {
    return null;
  }
  if (!chronologyIndexById.has(worldStateId)) {
    return null;
  }
  const matches = listEpicBooksMatchingWorldState(books, worldStateId, chronologyIndexById);
  if (matches.length > 1) {
    const ids = matches.map((m) => m.id).join(", ");
    throw new Error(`EpicBook: ambiguous world-state match for "${worldStateId}" (${ids}).`);
  }
  if (matches.length === 0) {
    return null;
  }
  return matches[0];
}

describe("getBookForYear (via collectEpicBooksMatchingYear)", () => {
  it("throws when two calibrated year windows contain the same year", () => {
    const books: EpicBook[] = [
      {
        id: "a",
        title: "a",
        orderIndex: 1,
        startYear: 1800,
        endYear: 1850,
        startWorldStateId: null,
        endWorldStateId: null,
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
      {
        id: "b",
        title: "b",
        orderIndex: 2,
        startYear: 1840,
        endYear: 1900,
        startWorldStateId: null,
        endWorldStateId: null,
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
    ];
    assert.throws(() => resolveBookForYearLike(books, 1845), /ambiguous year match/);
  });

  it("single calibrated match for a year", () => {
    const books: EpicBook[] = [
      {
        id: "only",
        title: "only",
        orderIndex: 1,
        startYear: 1700,
        endYear: 1750,
        startWorldStateId: null,
        endWorldStateId: null,
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
    ];
    assert.equal(collectEpicBooksMatchingYear(books, 1720).length, 1);
  });

  it("returns the unique spine row when exactly one world-state window matches", () => {
    const books: EpicBook[] = [
      {
        id: "only",
        title: "only",
        orderIndex: 1,
        startYear: null,
        endYear: null,
        startWorldStateId: "ws_a",
        endWorldStateId: "ws_c",
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
    ];
    const m = new Map<string, number>([
      ["ws_a", 0],
      ["ws_b", 1],
      ["ws_c", 2],
    ]);
    const got = resolveBookForWorldStateLike(books, "ws_b", m);
    assert.equal(got?.id, "only");
  });

  it("throws when two world-state windows overlap for the same slice (ambiguous)", () => {
    const books: EpicBook[] = [
      {
        id: "x",
        title: "x",
        orderIndex: 1,
        startYear: null,
        endYear: null,
        startWorldStateId: "ws_a",
        endWorldStateId: "ws_m",
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
      {
        id: "y",
        title: "y",
        orderIndex: 2,
        startYear: null,
        endYear: null,
        startWorldStateId: "ws_b",
        endWorldStateId: "ws_z",
        summary: null,
        themes: [],
        isProvisional: false,
        metadataJson: null,
      },
    ];
    const m = new Map<string, number>([
      ["ws_a", 0],
      ["ws_b", 1],
      ["ws_c", 2],
      ["ws_m", 3],
      ["ws_z", 4],
    ]);
    assert.throws(() => resolveBookForWorldStateLike(books, "ws_c", m), /ambiguous world-state match/);
  });

  it("provisional rows with no year bounds do not match the year axis", () => {
    const books: EpicBook[] = [
      {
        id: "p",
        title: "p",
        orderIndex: 1,
        startYear: null,
        endYear: null,
        startWorldStateId: null,
        endWorldStateId: null,
        summary: null,
        themes: [],
        isProvisional: true,
        metadataJson: null,
      },
    ];
    assert.equal(collectEpicBooksMatchingYear(books, 1999).length, 0);
  });
});
