import type { Prisma } from "@prisma/client";

import type { WorldStateChronologyIndexById } from "@/lib/domain/world-state-chronology";
import { worldStateFallsWithinChronologyWindow } from "@/lib/domain/world-state-chronology";

export type { WorldStateChronologyIndexById };

/** Canonical epic timeline spine row (`EpicBook` / Prisma). */
export type EpicBook = {
  id: string;
  title: string;
  orderIndex: number;

  startYear: number | null;
  endYear: number | null;

  startWorldStateId: string | null;
  endWorldStateId: string | null;

  summary: string | null;
  themes: string[];

  isProvisional: boolean;

  metadataJson: Prisma.JsonValue | null;
};

/** Stable ascending order for spine queries and UI. */
export function compareEpicBookOrder(
  a: Pick<EpicBook, "orderIndex">,
  b: Pick<EpicBook, "orderIndex">
): number {
  return a.orderIndex - b.orderIndex;
}

export function sortEpicBooksByOrder<T extends Pick<EpicBook, "orderIndex">>(books: T[]): T[] {
  return [...books].sort(compareEpicBookOrder);
}

/**
 * Whether `year` falls within the book’s optional calendar bounds (inclusive).
 * Open bounds: missing start/end treated as unbounded on that side.
 */
export function yearWithinEpicBookBounds(
  book: Pick<EpicBook, "startYear" | "endYear">,
  year: number
): boolean {
  if (book.startYear != null && year < book.startYear) return false;
  if (book.endYear != null && year > book.endYear) return false;
  return true;
}

/** True when the book defines at least one calendar bound (otherwise it does not claim the year axis). */
export function epicBookParticipatesInYearMapping(
  book: Pick<EpicBook, "startYear" | "endYear">
): boolean {
  return book.startYear != null || book.endYear != null;
}

/** True when the book defines at least one world-state bound (otherwise it does not claim the world-state axis). */
export function epicBookParticipatesInWorldStateMapping(
  book: Pick<EpicBook, "startWorldStateId" | "endWorldStateId">
): boolean {
  return book.startWorldStateId != null || book.endWorldStateId != null;
}

/**
 * Inclusive year interval for overlap checks; null start/end become unbounded on that side.
 */
export function epicBookToYearInterval(book: Pick<EpicBook, "startYear" | "endYear">): {
  lo: number;
  hi: number;
} {
  return {
    lo: book.startYear ?? -Infinity,
    hi: book.endYear ?? Infinity,
  };
}

/** Whether two books’ year windows overlap (both must participate on the year axis). */
export function epicBookYearWindowsOverlap(
  a: Pick<EpicBook, "startYear" | "endYear">,
  b: Pick<EpicBook, "startYear" | "endYear">
): boolean {
  if (!epicBookParticipatesInYearMapping(a) || !epicBookParticipatesInYearMapping(b)) {
    return false;
  }
  const ia = epicBookToYearInterval(a);
  const ib = epicBookToYearInterval(b);
  return ia.lo <= ib.hi && ib.lo <= ia.hi;
}

/**
 * Whether `worldStateId` falls within optional world-state bounds using **canonical chronology**
 * (`WorldStateReference.chronologyIndex`), not lexicographic id order.
 *
 * When both bounds are null, returns true (book does not constrain world state on this axis — callers
 * usually skip such rows via {@link epicBookParticipatesInWorldStateMapping}).
 */
export function worldStateWithinEpicBookBounds(
  book: Pick<EpicBook, "startWorldStateId" | "endWorldStateId">,
  worldStateId: string,
  chronologyIndexById: WorldStateChronologyIndexById
): boolean {
  return worldStateFallsWithinChronologyWindow(
    worldStateId,
    book.startWorldStateId,
    book.endWorldStateId,
    chronologyIndexById
  );
}

/** Numeric interval on the world-state timeline for overlap detection (null bound → unbounded). */
export type WorldStateOrderInterval = { lo: number; hi: number };

/**
 * Maps a book’s world-state window to numeric chronology space. Returns null if a referenced id is missing
 * from `chronologyIndexById`.
 */
export function epicBookToWorldStateOrderInterval(
  book: Pick<EpicBook, "startWorldStateId" | "endWorldStateId">,
  chronologyIndexById: WorldStateChronologyIndexById
): WorldStateOrderInterval | null {
  if (!epicBookParticipatesInWorldStateMapping(book)) {
    return null;
  }
  let lo = -Infinity;
  let hi = Infinity;
  if (book.startWorldStateId != null) {
    const v = chronologyIndexById.get(book.startWorldStateId);
    if (v === undefined) {
      return null;
    }
    lo = v;
  }
  if (book.endWorldStateId != null) {
    const v = chronologyIndexById.get(book.endWorldStateId);
    if (v === undefined) {
      return null;
    }
    hi = v;
  }
  if (lo > hi) {
    return null;
  }
  return { lo, hi };
}

export function worldStateOrderIntervalsOverlap(a: WorldStateOrderInterval, b: WorldStateOrderInterval): boolean {
  return a.lo <= b.hi && b.lo <= a.hi;
}

/** EpicBooks whose world-state window contains `worldStateId` (only rows that participate on the WS axis). */
export function listEpicBooksMatchingWorldState(
  books: EpicBook[],
  worldStateId: string,
  chronologyIndexById: WorldStateChronologyIndexById
): EpicBook[] {
  return books.filter(
    (book) =>
      epicBookParticipatesInWorldStateMapping(book) &&
      worldStateWithinEpicBookBounds(book, worldStateId, chronologyIndexById)
  );
}

/** EpicBooks that claim the year axis and contain `year`. */
export function collectEpicBooksMatchingYear(books: EpicBook[], year: number): EpicBook[] {
  return books.filter(
    (b) => epicBookParticipatesInYearMapping(b) && yearWithinEpicBookBounds(b, year)
  );
}

/**
 * Guard using resolved chronology (for tests and call sites that already have a chronology map).
 */
export function assertWorldStateWithinEpicBookChronology(
  book: Pick<EpicBook, "title" | "startWorldStateId" | "endWorldStateId">,
  worldStateId: string,
  chronologyIndexById: WorldStateChronologyIndexById
): void {
  if (book.startWorldStateId == null && book.endWorldStateId == null) {
    return;
  }
  if (!worldStateWithinEpicBookBounds(book, worldStateId, chronologyIndexById)) {
    const start = book.startWorldStateId ?? "(none)";
    const end = book.endWorldStateId ?? "(none)";
    throw new Error(
      `World state "${worldStateId}" is outside EpicBook "${book.title}" bounds [${start}, ${end}] (canonical world-state chronology, not id text order).`
    );
  }
}
