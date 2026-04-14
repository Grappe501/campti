/**
 * Epic timeline / book-spine service — **canonical narrative backbone** for the Campti master build spine.
 *
 * `EpicBook` rows define ordered books, optional calendar and world-state windows, and narrative role metadata.
 * Downstream systems (scene contracts, source filtering, character knowledge) should consult this spine so
 * assembly and inference stay aligned with `docs/build/master-build-spine.md` instead of ad hoc text.
 *
 * **Chronology rules**
 * - Raw `WorldStateReference.id` string order is **not** a timeline. Matching uses `WorldStateReference.chronologyIndex`
 *   via `lib/services/world-state-chronology.ts` (same basis as the P2-B narrative truth firewall).
 * - Calibrated epic books resolve containment and overlap in that numeric order space.
 * - **Ambiguous matches** (multiple spine rows qualify for the same year or world state) are **errors**, not
 *   resolved by `orderIndex` or “first row”.
 * - Rows with **no bounds on an axis** do not claim that axis (provisional placeholders stay non-authoritative
 *   until calibrated with real bounds).
 */

import type { Prisma } from "@prisma/client";

import type { EpicBook } from "@/lib/domain/epic-book";
import {
  assertWorldStateWithinEpicBookChronology,
  collectEpicBooksMatchingYear,
  epicBookParticipatesInYearMapping,
  epicBookParticipatesInWorldStateMapping,
  epicBookToWorldStateOrderInterval,
  epicBookYearWindowsOverlap,
  listEpicBooksMatchingWorldState,
  worldStateOrderIntervalsOverlap,
} from "@/lib/domain/epic-book";
import { prisma } from "@/lib/prisma";
import { loadWorldStateChronologyIndexMap } from "@/lib/services/world-state-chronology";

export type CreateEpicBookInput = {
  title: string;
  orderIndex: number;
  startYear?: number | null;
  endYear?: number | null;
  startWorldStateId?: string | null;
  endWorldStateId?: string | null;
  summary?: string | null;
  themes: string[];
  isProvisional?: boolean;
  metadataJson?: Prisma.InputJsonValue | null;
};

function assertYearOrdering(startYear: number | null | undefined, endYear: number | null | undefined) {
  if (startYear != null && endYear != null && startYear > endYear) {
    throw new Error(
      `EpicBook year range invalid: startYear (${startYear}) must be <= endYear (${endYear}).`
    );
  }
}

async function assertWorldStateWindowValid(
  startWorldStateId: string | null | undefined,
  endWorldStateId: string | null | undefined
): Promise<void> {
  if (startWorldStateId == null && endWorldStateId == null) {
    return;
  }
  const map = await loadWorldStateChronologyIndexMap([
    ...(startWorldStateId != null ? [startWorldStateId] : []),
    ...(endWorldStateId != null ? [endWorldStateId] : []),
  ]);
  if (startWorldStateId != null && !map.has(startWorldStateId)) {
    throw new Error(`Unknown startWorldStateId: ${startWorldStateId}`);
  }
  if (endWorldStateId != null && !map.has(endWorldStateId)) {
    throw new Error(`Unknown endWorldStateId: ${endWorldStateId}`);
  }
  if (startWorldStateId != null && endWorldStateId != null) {
    const lo = map.get(startWorldStateId)!;
    const hi = map.get(endWorldStateId)!;
    if (lo > hi) {
      throw new Error(
        "EpicBook world-state range invalid: start world state must be earlier than or equal to end (canonical chronologyIndex)."
      );
    }
  }
}

function inputToEpicBookShape(input: CreateEpicBookInput, idPlaceholder: string): EpicBook {
  return {
    id: idPlaceholder,
    title: input.title,
    orderIndex: input.orderIndex,
    startYear: input.startYear ?? null,
    endYear: input.endYear ?? null,
    startWorldStateId: input.startWorldStateId ?? null,
    endWorldStateId: input.endWorldStateId ?? null,
    summary: input.summary ?? null,
    themes: input.themes,
    isProvisional: input.isProvisional ?? true,
    metadataJson: null,
  };
}

async function validateNoOverlappingSpineWindows(
  candidate: CreateEpicBookInput,
  existing: EpicBook[]
): Promise<void> {
  const cand = inputToEpicBookShape(candidate, "candidate");

  if (epicBookParticipatesInYearMapping(cand)) {
    for (const ex of existing) {
      if (epicBookYearWindowsOverlap(cand, ex)) {
        throw new Error(
          `EpicBook year window overlaps existing spine row "${ex.title}" (${ex.id}). Calibrated year ranges must not overlap.`
        );
      }
    }
  }

  if (epicBookParticipatesInWorldStateMapping(cand)) {
    const allWsIds = new Set<string>();
    if (cand.startWorldStateId) {
      allWsIds.add(cand.startWorldStateId);
    }
    if (cand.endWorldStateId) {
      allWsIds.add(cand.endWorldStateId);
    }
    for (const ex of existing) {
      if (ex.startWorldStateId) {
        allWsIds.add(ex.startWorldStateId);
      }
      if (ex.endWorldStateId) {
        allWsIds.add(ex.endWorldStateId);
      }
    }
    const map = await loadWorldStateChronologyIndexMap([...allWsIds]);
    const candIv = epicBookToWorldStateOrderInterval(cand, map);
    if (candIv == null) {
      throw new Error("EpicBook world-state bounds reference unknown world state id(s).");
    }
    for (const ex of existing) {
      if (!epicBookParticipatesInWorldStateMapping(ex)) {
        continue;
      }
      const exIv = epicBookToWorldStateOrderInterval(ex, map);
      if (exIv == null) {
        continue;
      }
      if (worldStateOrderIntervalsOverlap(candIv, exIv)) {
        throw new Error(
          `EpicBook world-state window overlaps existing spine row "${ex.title}" (${ex.id}). Calibrated world-state ranges must not overlap.`
        );
      }
    }
  }
}

function toDomain(row: {
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
}): EpicBook {
  return {
    id: row.id,
    title: row.title,
    orderIndex: row.orderIndex,
    startYear: row.startYear,
    endYear: row.endYear,
    startWorldStateId: row.startWorldStateId,
    endWorldStateId: row.endWorldStateId,
    summary: row.summary,
    themes: row.themes,
    isProvisional: row.isProvisional,
    metadataJson: row.metadataJson,
  };
}

/**
 * Guard: `worldStateId` must sit within the book’s world-state window when bounds exist.
 * Uses canonical `chronologyIndex` from the database (not id text order).
 */
export async function assertWorldStateWithinBook(book: EpicBook, worldStateId: string): Promise<void> {
  if (book.startWorldStateId == null && book.endWorldStateId == null) {
    return;
  }
  const ids = [
    worldStateId,
    ...(book.startWorldStateId != null ? [book.startWorldStateId] : []),
    ...(book.endWorldStateId != null ? [book.endWorldStateId] : []),
  ];
  const map = await loadWorldStateChronologyIndexMap(ids);
  assertWorldStateWithinEpicBookChronology(book, worldStateId, map);
}

export async function createEpicBook(input: CreateEpicBookInput): Promise<EpicBook> {
  assertYearOrdering(input.startYear ?? null, input.endYear ?? null);
  await assertWorldStateWindowValid(input.startWorldStateId ?? null, input.endWorldStateId ?? null);

  const clash = await prisma.epicBook.findFirst({ where: { orderIndex: input.orderIndex } });
  if (clash) {
    throw new Error(
      `EpicBook orderIndex ${input.orderIndex} is already used by "${clash.title}" (${clash.id}).`
    );
  }

  const existing = (await prisma.epicBook.findMany({ orderBy: { orderIndex: "asc" } })).map(toDomain);
  await validateNoOverlappingSpineWindows(input, existing);

  const row = await prisma.epicBook.create({
    data: {
      title: input.title,
      orderIndex: input.orderIndex,
      startYear: input.startYear ?? null,
      endYear: input.endYear ?? null,
      startWorldStateId: input.startWorldStateId ?? null,
      endWorldStateId: input.endWorldStateId ?? null,
      summary: input.summary ?? null,
      themes: input.themes,
      isProvisional: input.isProvisional ?? true,
      metadataJson:
        input.metadataJson === undefined || input.metadataJson === null ? undefined : input.metadataJson,
    },
  });
  return toDomain(row);
}

export async function listEpicBooksOrdered(): Promise<EpicBook[]> {
  const rows = await prisma.epicBook.findMany({ orderBy: { orderIndex: "asc" } });
  return rows.map(toDomain);
}

/**
 * Spine book for `year` when exactly one calibrated row claims that year.
 *
 * Skips rows with neither `startYear` nor `endYear` (non-claiming on the calendar axis).
 * @returns null when no calibrated book matches.
 * @throws When multiple books match (ambiguous spine).
 */
export async function getBookForYear(year: number): Promise<EpicBook | null> {
  const books = await listEpicBooksOrdered();
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

/**
 * Spine book for `worldStateId` when exactly one row claims that world state on the canonical timeline.
 *
 * Skips rows with neither `startWorldStateId` nor `endWorldStateId` (non-claiming on the world-state axis).
 * @returns null when no calibrated book matches or the world state id is unknown.
 * @throws When multiple books match (ambiguous spine).
 */
export async function getBookForWorldState(worldStateId: string): Promise<EpicBook | null> {
  const books = await listEpicBooksOrdered();
  const participating = books.filter(epicBookParticipatesInWorldStateMapping);
  if (participating.length === 0) {
    return null;
  }

  const allIds = new Set<string>([worldStateId]);
  for (const b of participating) {
    if (b.startWorldStateId) {
      allIds.add(b.startWorldStateId);
    }
    if (b.endWorldStateId) {
      allIds.add(b.endWorldStateId);
    }
  }
  const map = await loadWorldStateChronologyIndexMap([...allIds]);
  if (!map.has(worldStateId)) {
    return null;
  }

  const matches = listEpicBooksMatchingWorldState(books, worldStateId, map);
  if (matches.length > 1) {
    const ids = matches.map((m) => m.id).join(", ");
    throw new Error(`EpicBook: ambiguous world-state match for "${worldStateId}" (${ids}).`);
  }
  if (matches.length === 0) {
    return null;
  }
  return matches[0];
}
